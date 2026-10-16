DELIMITER //
CREATE PROCEDURE sp_agregarEntrada (
    IN p_OS VARCHAR(25),
    IN p_fecha DATE,
    IN p_proveedor CHAR(3),
    IN p_cliente CHAR(3),
    IN p_usuarioSolicita VARCHAR(15)
)
BEGIN
    DECLARE v_error VARCHAR(255);
    IF p_fecha IS NULL THEN
        SET v_error = 'Error: La fecha no puede ser nula.';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error;
    END IF;
    IF p_fecha > CURDATE() THEN
        SET v_error = CONCAT('Error: La fecha (', p_fecha, ') no puede ser futura.');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error;
    END IF;
    IF p_fecha < DATE_SUB(CURDATE(), INTERVAL 1 MONTH) THEN
        SET v_error = CONCAT('Error: La fecha (', p_fecha, ') no puede ser anterior a un mes desde hoy.');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM proveedor WHERE claveProveedor = p_proveedor) THEN
        SET v_error = CONCAT('Error: El proveedor con clave ', p_proveedor, ' no existe.');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error;
    END IF;
    IF p_cliente IS NOT NULL AND p_cliente <> '' THEN
        IF NOT EXISTS (SELECT 1 FROM cliente WHERE claveCliente = p_cliente) THEN
            SET v_error = CONCAT('Error: El cliente con clave ', p_cliente, ' no existe.');
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error;
        END IF;
    END IF;
    INSERT INTO entrada (OS, fecha, proveedor, estado, cliente, usuarioSolicita)
    VALUES (p_OS, p_fecha, p_proveedor, 'PEN', NULLIF(p_cliente, ''), p_usuarioSolicita);
END //
CREATE PROCEDURE sp_registroentradaMaterial ( 
    IN p_noEntrada INT,
    IN p_codigoMaterial CHAR(28),
    IN p_cantidad DECIMAL(10,2)
)
BEGIN
    DECLARE v_existencia INT DEFAULT 0;
    DECLARE v_estado CHAR(3);
    DECLARE v_alerta BOOLEAN DEFAULT FALSE;
    DECLARE v_estadoEntrada CHAR(3);
    SELECT COUNT(*) INTO v_existencia FROM entrada WHERE noEntrada = p_noEntrada;
    IF v_existencia = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: La entrada especificada no existe.';
    END IF;
    SELECT estado INTO v_estadoEntrada FROM entrada WHERE noEntrada = p_noEntrada;
    IF v_estadoEntrada <> 'PEN' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Solo se pueden agregar materiales a entradas pendientes.';
    END IF;
    SELECT COUNT(*) INTO v_existencia FROM material WHERE codigoMaterial = p_codigoMaterial;
    IF v_existencia = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: El material no existe.';
    END IF;
    SELECT estado INTO v_estado FROM material WHERE codigoMaterial = p_codigoMaterial;
    IF v_estado <> 'ACT' THEN
        UPDATE material 
        SET estado = 'ACT'
        WHERE codigoMaterial = p_codigoMaterial;
        SET v_alerta = TRUE;
    END IF;
    INSERT INTO entradaMaterial (codigoMaterial, noEntrada, cantidad, alerta)
    VALUES (p_codigoMaterial, p_noEntrada, p_cantidad, v_alerta);
END //
CREATE PROCEDURE sp_aprobarEntrada (
    IN p_noEntrada INT,
    IN p_usuarioAprueba VARCHAR(15)
)
BEGIN
    DECLARE v_estadoActual CHAR(3);
    SELECT estado INTO v_estadoActual FROM entrada WHERE noEntrada = p_noEntrada;
    IF v_estadoActual IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: La entrada no existe.';
    END IF;
    IF v_estadoActual = 'APR' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Esta entrada ya fue aprobada anteriormente.';
    END IF;
    IF v_estadoActual = 'REC' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Esta entrada fue rechazada y no puede aprobarse.';
    END IF;
    UPDATE material m
    INNER JOIN entradaMaterial em ON m.codigoMaterial = em.codigoMaterial
    SET m.stockActual = m.stockActual + em.cantidad
    WHERE em.noEntrada = p_noEntrada;
    UPDATE entrada
    SET 
        estado = 'APR', 
        usuarioAprueba = p_usuarioAprueba, 
        fechaAprobacion = NOW()
    WHERE noEntrada = p_noEntrada;
    INSERT INTO bitacora_actividad (nombreUsuario, accion, modulo, detalle)
    VALUES (
        p_usuarioAprueba, 
        'APROBAR', 
        'ENTRADAS', 
        CONCAT('Aprobacion de Entrada #', p_noEntrada, '. Stock sumado.')
    );
END //
DELIMITER ;