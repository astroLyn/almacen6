DELIMITER //
CREATE PROCEDURE sp_agregarSalida (
    IN p_OS VARCHAR(50),
    IN p_fecha DATE,
    IN p_cotizacion VARCHAR(20),
    IN p_cliente INT,
    IN p_usuarioSolicita VARCHAR(15)
)
BEGIN
    DECLARE v_error VARCHAR(255);
    IF p_fecha IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: La fecha no puede ser nula.';
    END IF;
    IF p_fecha > CURDATE() THEN
        SET v_error = CONCAT('Error: La fecha (', p_fecha, ') no puede ser futura.');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error;
    END IF;
    IF p_fecha < DATE_SUB(CURDATE(), INTERVAL 1 MONTH) THEN
        SET v_error = CONCAT('Error: La fecha (', p_fecha, ') no puede ser anterior a un mes desde hoy.');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error;
    END IF;
    IF p_cliente IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM cliente WHERE claveCliente = p_cliente) THEN
            SET v_error = CONCAT('Error: El cliente con clave ', p_cliente, ' no existe.');
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error;
        END IF;
    END IF;
    INSERT INTO salida (OS, fecha, cotizacion, cliente, estado, usuarioSolicita)
    VALUES (p_OS, p_fecha, p_cotizacion, p_cliente, 'PEN', p_usuarioSolicita);
END//
CREATE PROCEDURE sp_registrosalidaMaterial (
    IN p_noSalida INT,
    IN p_codigoMaterial VARCHAR(28),
    IN p_cantidad DECIMAL(10,2),
    IN p_observaciones VARCHAR(150)
)
BEGIN
    DECLARE v_existencia INT DEFAULT 0;
    DECLARE v_estado CHAR(3);
    DECLARE v_stockActual DECIMAL(10,2) DEFAULT 0;
    DECLARE v_error VARCHAR(255);
    SELECT COUNT(*) INTO v_existencia
    FROM material
    WHERE codigoMaterial = p_codigoMaterial;
    IF v_existencia = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: El material no existe en el catálogo.';
    END IF;
    SELECT estado, stockActual
    INTO v_estado, v_stockActual
    FROM material
    WHERE codigoMaterial = p_codigoMaterial;
    IF v_estado <> 'ACT' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: El material está inactivo y no puede tener movimientos.';
    END IF;
    IF v_stockActual < p_cantidad THEN
        SET v_error = CONCAT('Error: Stock insuficiente del material ', p_codigoMaterial, '. Se solicitan ', p_cantidad, ' pero solo hay ', v_stockActual, ' disponibles.');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error;
    END IF;
    INSERT INTO salidaMaterial (codigoMaterial, noSalida, cantidad, observaciones, alerta)
    VALUES (p_codigoMaterial, p_noSalida, p_cantidad, p_observaciones, FALSE);
END//
CREATE PROCEDURE sp_aprobarSalida (
    IN p_noSalida INT,
    IN p_usuarioAprueba VARCHAR(15)
)
BEGIN
    DECLARE v_estadoActual CHAR(3);
    SELECT estado INTO v_estadoActual FROM salida WHERE noSalida = p_noSalida;
    IF v_estadoActual IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: La salida no existe.';
    END IF;
    IF v_estadoActual = 'APR' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Esta salida ya fue aprobada anteriormente.';
    END IF;
    IF v_estadoActual = 'REC' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Esta salida fue rechazada y no puede aprobarse.';
    END IF;
    UPDATE material m
    INNER JOIN salidaMaterial sm ON m.codigoMaterial = sm.codigoMaterial
    SET m.stockActual = m.stockActual - sm.cantidad
    WHERE sm.noSalida = p_noSalida;
    UPDATE salida
    SET 
        estado = 'APR', 
        usuarioAprueba = p_usuarioAprueba, 
        fechaAprobacion = NOW()
    WHERE noSalida = p_noSalida;
    INSERT INTO bitacora_actividad (nombreUsuario, accion, modulo, detalle)
    VALUES (
        p_usuarioAprueba, 
        'APROBAR', 
        'SALIDAS', 
        CONCAT('Aprobación de Salida #', p_noSalida, '. Stock descontado.')
    );
END//
DELIMITER ;