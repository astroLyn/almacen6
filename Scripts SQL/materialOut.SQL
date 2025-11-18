--Registrar un nuevo registro de salida
DELIMITER $$
CREATE PROCEDURE sp_agregarSalida (
    IN p_OS VARCHAR(50),
    IN p_fecha DATE,
    IN p_cotizacion VARCHAR(20),
    IN p_materialApartado INT,
    IN p_cliente INT)
BEGIN
    DECLARE v_error VARCHAR(255);
    -- Validar que la fecha no sea nula
    IF p_fecha IS NULL THEN
        SET v_error = 'Error: La fecha no puede ser nula.';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error;
    END IF;
    -- Validar que la fecha no sea futura
    IF p_fecha > CURDATE() THEN
        SET v_error = CONCAT('Error: La fecha (', p_fecha, ') no puede ser futura.');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error;
    END IF;
    -- Validar que la fecha no sea más antigua que un mes
    IF p_fecha < DATE_SUB(CURDATE(), INTERVAL 1 MONTH) THEN
        SET v_error = CONCAT('Error: La fecha (', p_fecha, ') no puede ser anterior a un mes desde hoy.');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error;
    END IF;
    -- Validar que el cliente exista
    IF NOT EXISTS (SELECT 1 FROM cliente WHERE claveCliente = p_cliente) THEN
        SET v_error = CONCAT('Error: El cliente con clave ', p_cliente, ' no existe.');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error;
    END IF;
    -- Validar que el material apartado exista (si se proporciona)
    IF p_materialApartado IS NOT NULL 
       AND NOT EXISTS (SELECT 1 FROM materialApartado WHERE noApartado = p_materialApartado) THEN
        SET v_error = CONCAT('Error: El material apartado con número ', p_materialApartado, ' no existe.');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error;
    END IF;
    -- Insertar la salida si todas las validaciones son correctas
    INSERT INTO salida (OS, fecha, cotizacion, materialApartado, cliente, estado)
    VALUES (p_OS, p_fecha, p_cotizacion, p_materialApartado, p_cliente, 'PEN');
END$$
CALL sp_agregarSalida(
    'OS-0019',
    '2025-10-01',
    'CO-2519',
    NULL,
    2
);
--Agregar materiales a un registro de salida
DELIMITER $$
CREATE OR REPLACE PROCEDURE sp_registroSalidaMaterial (
    IN p_noSalida INT,
    IN p_codigoMaterial CHAR(28),
    IN p_cantidad DECIMAL(10,2),
    IN p_observaciones VARCHAR(150)
)
BEGIN
    DECLARE v_existencia INT DEFAULT 0;
    DECLARE v_estado CHAR(3);
    DECLARE v_stockActual DECIMAL(10,2) DEFAULT 0;
    DECLARE v_alerta BOOLEAN DEFAULT FALSE;
    DECLARE v_error VARCHAR(255);
    -- Validar existencia del material y obtener su estado y stock actual
    SELECT COUNT(*), estado, stockActual
    INTO v_existencia, v_estado, v_stockActual
    FROM material
    WHERE codigoMaterial = p_codigoMaterial;
    -- Validar que el material exista
    IF v_existencia = 0 THEN
        SET v_error = 'Error: El material no existe.';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error;
    END IF;
    -- Validar que el material esté activo
    IF v_estado <> 'ACT' THEN
        SET v_error = 'Error: El material está inactivo y no puede tener movimientos.';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error;
    END IF;
    -- Si el stock quedará negativo, marcar alerta
    IF (v_stockActual - p_cantidad) < 0 THEN
        SET v_alerta = TRUE;
    END IF;
    -- Insertar en la tabla salidaMaterial (permitiendo stock negativo)
    INSERT INTO salidaMaterial (codigoMaterial, noSalida, cantidad, observaciones, alerta)
    VALUES (p_codigoMaterial, p_noSalida, p_cantidad, p_observaciones, v_alerta);
END$$
CALL sp_registroSalidaMaterial(
    1,
    'O0707',
    3,
    NULL
);