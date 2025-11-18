-- Active: 1730905897544@@127.0.0.1@3306@almacennetcommtelpruebas
--Crear el apartado
DELIMITER //
CREATE OR REPLACE PROCEDURE sp_crearMaterialApartado(
    IN p_OS VARCHAR(50),
    IN p_fecha DATE,
    IN p_cotizacion VARCHAR(25),
    IN p_cliente INT,
    IN p_estado CHAR(3)
)
BEGIN
    DECLARE v_noApartado INT;
    -- Insertar el registro principal
    INSERT INTO materialApartado (
        OS, 
        fecha, 
        cotizacion, 
        cliente, 
        estado,
        darSalida
    ) VALUES (
        p_OS,
        p_fecha,
        p_cotizacion,
        p_cliente,
        p_estado,
        FALSE
    );
    -- Obtener el ID generado
    SET v_noApartado = LAST_INSERT_ID();
    -- Devolver el número de apartado creado
    SELECT v_noApartado AS noApartado;
END //
DELIMITER ;
--Agregar materiales al apartado
DELIMITER //

CREATE OR REPLACE PROCEDURE sp_agregarDetalleApartado(
    IN p_codigoMaterial VARCHAR(28),
    IN p_noApartado INT,
    IN p_cantidad DECIMAL(10,2),
    IN p_observaciones VARCHAR(150),
    IN p_alerta BOOLEAN
)
BEGIN
    DECLARE v_existe_apartado INT DEFAULT 0;
    DECLARE v_existe_material INT DEFAULT 0;
    DECLARE v_stock_actual DECIMAL(10,2) DEFAULT 0;
    DECLARE v_stock_reservado DECIMAL(10,2) DEFAULT 0;
    DECLARE v_stock_disponible DECIMAL(10,2) DEFAULT 0;
    DECLARE v_hay_insuficiencia BOOLEAN DEFAULT FALSE;
    DECLARE v_error TEXT DEFAULT '';

    -- ✅ Handler mejorado para capturar errores sin causar excepción por ROLLBACK
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Solo intenta rollback si hay una transacción activa
        IF @@in_transaction THEN
            ROLLBACK;
        END IF;

        -- Si hay mensaje personalizado, lo usamos
        IF v_error IS NULL OR v_error = '' THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error al agregar detalle de apartado.';
        ELSE
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = v_error;
        END IF;
    END;

    -- 🧩 Validar existencia del apartado
    SELECT COUNT(*) INTO v_existe_apartado 
    FROM materialApartado 
    WHERE noApartado = p_noApartado;

    IF v_existe_apartado = 0 THEN
        SET v_error = 'Error: El número de apartado no existe.';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error;
    END IF;

    -- 🧩 Validar existencia del material
    SELECT COUNT(*) INTO v_existe_material 
    FROM material 
    WHERE codigoMaterial = p_codigoMaterial;

    IF v_existe_material = 0 THEN
        SET v_error = 'Error: El código de material no existe.';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error;
    END IF;

    -- 🧩 Validar cantidad
    IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
        SET v_error = 'Error: La cantidad debe ser mayor a 0.';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error;
    END IF;

    -- 🧩 Obtener stock actual y reservado
    SELECT COALESCE(stockActual, 0), COALESCE(stockReservado, 0)
    INTO v_stock_actual, v_stock_reservado
    FROM material
    WHERE codigoMaterial = p_codigoMaterial;

    -- 🧩 Calcular stock disponible
    SET v_stock_disponible = v_stock_actual - v_stock_reservado;

    -- 🧩 Marcar insuficiencia si corresponde
    IF v_stock_disponible < p_cantidad THEN
        SET v_hay_insuficiencia = TRUE;
    END IF;

    -- 🚀 Iniciar transacción
    START TRANSACTION;

    -- 🧩 Insertar detalle del apartado
    INSERT INTO apartadoMaterial (
        codigoMaterial,
        noApartado,
        cantidad,
        observaciones,
        alerta
    )
    VALUES (
        p_codigoMaterial,
        p_noApartado,
        p_cantidad,
        p_observaciones,
        COALESCE(p_alerta, FALSE) OR v_hay_insuficiencia
    );

    -- 🧩 Actualizar stock reservado
    UPDATE material
    SET stockReservado = stockReservado + p_cantidad
    WHERE codigoMaterial = p_codigoMaterial;

    -- 🧩 Insertar alerta si hay insuficiencia
    IF v_hay_insuficiencia THEN
        INSERT INTO alertaMaterial (
            codigoMaterial,
            tipoAlerta,
            mensaje
        )
        VALUES (
            p_codigoMaterial,
            'STOCK_INSUFICIENTE',
            CONCAT(
                'Stock insuficiente al apartar. Material: ', p_codigoMaterial,
                ' | Apartado: ', p_noApartado,
                ' | Disponible: ', ROUND(v_stock_disponible, 2),
                ' | Solicitado: ', ROUND(p_cantidad, 2)
            )
        );
    END IF;

    -- 🧩 Confirmar cambios
    COMMIT;

    -- 🧩 Mensaje final
    IF v_hay_insuficiencia THEN
        SELECT CONCAT(
            '⚠️ Detalle agregado con alerta por stock insuficiente. Disponible: ',
            ROUND(v_stock_disponible, 2),
            ', Solicitado: ', ROUND(p_cantidad, 2)
        ) AS mensaje;
    ELSE
        SELECT '✅ Detalle de apartado agregado correctamente.' AS mensaje;
    END IF;
END //

DELIMITER ;

CALL sp_agregarDetalleApartado(
    'C5U7KB9DNRD',   -- Material con suficiente stock
    26,           -- noApartado existente
    10,           -- Cantidad a apartar
    'Apartado que genera alerta',
    TRUE        -- Sin alerta manual
);

DELIMITER ;

--Eliminar materiales del apartado
DELIMITER //
CREATE OR REPLACE PROCEDURE sp_eliminarDetalleApartado(
    IN p_codigoMaterial VARCHAR(28),
    IN p_noApartado INT
)
BEGIN
    DECLARE v_cantidad_reservada DECIMAL(10,2);
    DECLARE v_existe_detalle INT;
    DECLARE v_stock_reservado_actual DECIMAL(10,2);
    -- Verificar que el detalle existe y obtener la cantidad
    SELECT COUNT(*), COALESCE(cantidad, 0)
    INTO v_existe_detalle, v_cantidad_reservada
    FROM apartadoMaterial 
    WHERE codigoMaterial = p_codigoMaterial AND noApartado = p_noApartado;
    IF v_existe_detalle = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El detalle de apartado no existe';
    END IF;
    -- Obtener el stock reservado actual
    SELECT COALESCE(stockReservado, 0) INTO v_stock_reservado_actual
    FROM material
    WHERE codigoMaterial = p_codigoMaterial;
    -- Verificar que no se intenta liberar más stock del reservado
    IF v_stock_reservado_actual < v_cantidad_reservada THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Error: El stock reservado es menor que la cantidad a liberar';
    END IF;
    -- Iniciar transacción
    START TRANSACTION;
    -- Eliminar el detalle
    DELETE FROM apartadoMaterial 
    WHERE codigoMaterial = p_codigoMaterial AND noApartado = p_noApartado;
    -- Restaurar el stock reservado (reducir)
    UPDATE material 
    SET stockReservado = stockReservado - v_cantidad_reservada
    WHERE codigoMaterial = p_codigoMaterial;
    -- Confirmar transacción
    COMMIT;
    -- Mensaje de éxito
    SELECT 'Detalle de apartado eliminado correctamente' AS mensaje;
END //
DELIMITER ;
--Generar salidas (modificar)
DROP PROCEDURE IF EXISTS GenerarSalidaDesdeApartado;
DELIMITER //

CREATE PROCEDURE GenerarSalidaDesdeApartado(IN p_noApartado INT)
BEGIN
    DECLARE v_noSalida INT;
    DECLARE v_done INT DEFAULT 0;
    DECLARE v_codigoMaterial VARCHAR(28);
    DECLARE v_cantidad DECIMAL(10,2);
    DECLARE v_observaciones VARCHAR(150);
    DECLARE v_alerta BOOLEAN;

    -- Datos del apartado
    DECLARE v_OS VARCHAR(255);
    DECLARE v_cotizacion VARCHAR(255);
    DECLARE v_cliente VARCHAR(255);

    -- Cursor con materiales del apartado
    DECLARE cur_materiales CURSOR FOR
        SELECT codigoMaterial, cantidad, observaciones, alerta
        FROM apartadoMaterial
        WHERE noApartado = p_noApartado;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    -- 🔹 Inicia transacción
    START TRANSACTION;

    -- Verificar que el apartado exista y obtener datos
    SELECT OS, cotizacion, cliente
    INTO v_OS, v_cotizacion, v_cliente
    FROM materialApartado
    WHERE noApartado = p_noApartado
    LIMIT 1;

    -- Crear la salida
    INSERT INTO salida (OS, fecha, cotizacion, materialApartado, cliente, estado)
    VALUES (v_OS, CURDATE(), v_cotizacion, p_noApartado, v_cliente, 'PEN');

    SET v_noSalida = LAST_INSERT_ID();

    -- Procesar materiales
    OPEN cur_materiales;
    read_loop: LOOP
        FETCH cur_materiales INTO v_codigoMaterial, v_cantidad, v_observaciones, v_alerta;
        IF v_done = 1 THEN 
            LEAVE read_loop;
        END IF;

        -- Insertar detalle en salidaMaterial
        INSERT INTO salidaMaterial (codigoMaterial, noSalida, cantidad, observaciones, alerta)
        VALUES (v_codigoMaterial, v_noSalida, v_cantidad, v_observaciones, COALESCE(v_alerta, FALSE));

        -- Actualizar stock
        UPDATE material
        SET stockActual = stockActual - v_cantidad,
            stockReservado = stockReservado - v_cantidad
        WHERE codigoMaterial = v_codigoMaterial;
    END LOOP;
    CLOSE cur_materiales;

    -- Marcar apartado como procesado
    UPDATE materialApartado
    SET darSalida = 1
    WHERE noApartado = p_noApartado;

    COMMIT;

    SELECT CONCAT('✅ Salida generada con ID: ', v_noSalida) AS mensaje;
END //
DELIMITER ;

 CALL GenerarSalidaDesdeApartado(2); 