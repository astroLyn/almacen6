-- Active: 1730905897544@@127.0.0.1@3306@almacennetcommtelpruebas
--Actualizar el stock de materiales una vez que la entrada es aprobada
DELIMITER $$
CREATE TRIGGER trg_actualizarStock_Entrada
AFTER UPDATE ON entrada
FOR EACH ROW
BEGIN
    -- Solo ejecutar si el estado cambió y ahora es 'APR'
    IF NEW.estado = 'APR' AND OLD.estado <> 'APR' THEN
        -- Actualizar stock por cada material asociado a la entrada aprobada
        UPDATE material m
        JOIN entradaMaterial em ON m.codigoMaterial = em.codigoMaterial
        SET m.stockActual = m.stockActual + em.cantidad
        WHERE em.noEntrada = NEW.noEntrada;
    END IF;
END$$
UPDATE salida
SET estado = 'APR'
WHERE noSalida = 1;
UPDATE material
SET estado = 'ACT'
WHERE codigoMaterial = 'XM60PTAY';
--Actualizar el stock de materiales una vez que la salida es aprobada
DELIMITER $$
CREATE TRIGGER trg_actualizarStock_Salida
AFTER UPDATE ON salida
FOR EACH ROW
BEGIN
    -- Solo ejecutar si el estado cambió y ahora es 'APR'
    IF NEW.estado = 'APR' AND OLD.estado <> 'APR' THEN
        -- Actualizar el stock de los materiales asociados a la salida aprobada
        UPDATE material m
        JOIN salidaMaterial sm ON m.codigoMaterial = sm.codigoMaterial
        SET 
            m.stockActual = m.stockActual - sm.cantidad,
            sm.alerta = TRUE
        WHERE sm.noSalida = NEW.noSalida;
    END IF;
END$$
--Verificación de el stock de manera automatica para generar alertas
DROP TRIGGER trg_stockReservado;
DELIMITER $$
CREATE TRIGGER trg_registrarAlertaStock
AFTER UPDATE ON material
FOR EACH ROW
BEGIN
    DECLARE v_mensaje VARCHAR(255);
    DECLARE v_tipoAlerta VARCHAR(50);
    -- Si el stock llega a 0 (agotado)
    IF NEW.stockActual = 0 THEN
        SET v_tipoAlerta = 'STOCK AGOTADO';
        SET v_mensaje = CONCAT(
            'El material con código ', NEW.codigoMaterial,
            ' se ha quedado sin stock. Stock actual: ',
            NEW.stockActual, ', mínimo requerido: ',
            NEW.stockMinimo, '. Reposición urgente requerida.'
        );
        -- Evitar alertas duplicadas del mismo día y tipo
        IF NOT EXISTS (
            SELECT 1 FROM alertaMaterial
            WHERE codigoMaterial = NEW.codigoMaterial
              AND tipoAlerta = v_tipoAlerta
              AND DATE(fechaAlerta) = CURDATE()
        ) THEN
            INSERT INTO alertaMaterial (codigoMaterial, tipoAlerta, mensaje)
            VALUES (NEW.codigoMaterial, v_tipoAlerta, v_mensaje);
        END IF;
    -- Si el stock está por debajo del mínimo pero no agotado
    ELSEIF NEW.stockActual < NEW.stockMinimo THEN
        SET v_tipoAlerta = 'STOCK BAJO';
        SET v_mensaje = CONCAT(
            'El material con código ', NEW.codigoMaterial,
            ' tiene stock bajo. Stock actual: ',
            NEW.stockActual, ', mínimo requerido: ',
            NEW.stockMinimo, '. Considere realizar un nuevo pedido.'
        );
        -- Evitar alertas duplicadas del mismo día y tipo
        IF NOT EXISTS (
            SELECT 1 FROM alertaMaterial
            WHERE codigoMaterial = NEW.codigoMaterial
              AND tipoAlerta = v_tipoAlerta
              AND DATE(fechaAlerta) = CURDATE()
        ) THEN
            INSERT INTO alertaMaterial (codigoMaterial, tipoAlerta, mensaje)
            VALUES (NEW.codigoMaterial, v_tipoAlerta, v_mensaje);
        END IF;
    END IF;
END$$

🧩 3. Control de materiales apartados con estado válido
DELIMITER $$

CREATE TRIGGER trg_apartado_estado_valido
BEFORE INSERT ON materialApartado
FOR EACH ROW
BEGIN
    IF (SELECT COUNT(*) FROM estado WHERE codigoEstado = NEW.estado) = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: El estado asignado al material apartado no es válido.';
    END IF;
END$$

DELIMITER ;

🧩 4. Usuarios con acceso obligatorio
DELIMITER $$

CREATE TRIGGER trg_usuario_acceso_valido
BEFORE INSERT ON usuario
FOR EACH ROW
BEGIN
    IF NEW.acceso IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: Todo usuario debe tener un acceso asignado.';
    ELSEIF (SELECT COUNT(*) FROM acceso WHERE codigoAcceso = NEW.acceso) = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: El código de acceso no existe en la tabla acceso.';
    END IF;
END$$

DELIMITER ;

🧩 5. Estados válidos en entrada, salida y materialApartado
DELIMITER $$

CREATE TRIGGER trg_entrada_estado_valido
BEFORE INSERT ON entrada
FOR EACH ROW
BEGIN
    IF (SELECT COUNT(*) FROM estado WHERE codigoEstado = NEW.estado) = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: El estado asignado a la entrada no es válido.';
    END IF;
END$$

CREATE TRIGGER trg_salida_estado_valido
BEFORE INSERT ON salida
FOR EACH ROW
BEGIN
    IF (SELECT COUNT(*) FROM estado WHERE codigoEstado = NEW.estado) = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: El estado asignado a la salida no es válido.';
    END IF;
END$$

DELIMITER ;

🧩 6. Alertas no nulas en tablas de detalle
DELIMITER $$

CREATE TRIGGER trg_entradaMaterial_alerta_notnull
BEFORE INSERT ON entradaMaterial
FOR EACH ROW
BEGIN
    IF NEW.alerta IS NULL THEN
        SET NEW.alerta = FALSE;
    END IF;
END$$

CREATE TRIGGER trg_salidaMaterial_alerta_notnull
BEFORE INSERT ON salidaMaterial
FOR EACH ROW
BEGIN
    IF NEW.alerta IS NULL THEN
        SET NEW.alerta = FALSE;
    END IF;
END$$

CREATE TRIGGER trg_apartadoMaterial_alerta_notnull
BEFORE INSERT ON apartadoMaterial
FOR EACH ROW
BEGIN
    IF NEW.alerta IS NULL THEN
        SET NEW.alerta = FALSE;
    END IF;
END$$

DELIMITER ;

🧩 7. Bloquear salidas con más cantidad que el stock actual
DELIMITER $$

CREATE TRIGGER trg_salidaMaterial_stock
BEFORE INSERT ON salidaMaterial
FOR EACH ROW
BEGIN
    DECLARE stock DECIMAL(10,2);
    SELECT stockActual INTO stock FROM material WHERE codigoMaterial = NEW.codigoMaterial;
    
    IF stock IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: El material no existe.';
    ELSEIF NEW.cantidad > stock THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: La cantidad de salida excede el stock disponible.';
    END IF;
END$$

DELIMITER ;

🧩 8. Proteger eliminación de clientes con apartados pendientes
DELIMITER $$

CREATE TRIGGER trg_cliente_no_eliminar_con_apartados
BEFORE DELETE ON cliente
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM materialApartado 
        WHERE cliente = OLD.claveCliente 
        AND estado <> 'FIN'  -- Suponiendo que 'FIN' significa finalizado
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: No se puede eliminar el cliente, tiene apartados pendientes.';
    END IF;
END$$

DELIMITER ;