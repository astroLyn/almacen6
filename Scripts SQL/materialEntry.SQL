-- Active: 1730905897544@@127.0.0.1@3306@almacennetcommtelpruebas
--Registrar un nuevo registro de entrada
SHOW CREATE PROCEDURE sp_agregarEntrada;
DELIMITER $$
CREATE OR REPLACE PROCEDURE sp_agregarEntrada (
    IN p_OS VARCHAR(25),
    IN p_fecha DATE,
    IN p_proveedor CHAR(3),
    IN p_cliente CHAR(3)
)
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
    -- Validar que la fecha no sea anterior a un mes desde hoy
    IF p_fecha < DATE_SUB(CURDATE(), INTERVAL 1 MONTH) THEN
        SET v_error = CONCAT('Error: La fecha (', p_fecha, ') no puede ser anterior a un mes desde hoy.');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error;
    END IF;
    -- Validar proveedor
    IF NOT EXISTS (SELECT 1 FROM proveedor WHERE claveProveedor = p_proveedor) THEN
        SET v_error = CONCAT('Error: El proveedor con clave ', p_proveedor, ' no existe.');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error;
    END IF;
    -- Validar cliente (si se proporciona)
    IF p_cliente IS NOT NULL AND p_cliente <> '' THEN
        IF NOT EXISTS (SELECT 1 FROM cliente WHERE claveCliente = p_cliente) THEN
            SET v_error = CONCAT('Error: El cliente con clave ', p_cliente, ' no existe.');
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error;
        END IF;
    END IF;
    -- Insertar entrada válida
    INSERT INTO entrada (OS, fecha, proveedor, estado, cliente)
    VALUES (p_OS, p_fecha, p_proveedor, 'PEN', NULLIF(p_cliente, ''));
END$$
--Registro de la lista de materiales en la entrada
DELIMITER $$
CREATE OR REPLACE PROCEDURE sp_registroEntradaMaterial ( 
    IN p_noEntrada INT,
    IN p_codigoMaterial CHAR(28),
    IN p_cantidad DECIMAL(10,2)
)
BEGIN
    DECLARE v_existencia INT DEFAULT 0;
    DECLARE v_estado CHAR(3);
    DECLARE v_alerta BOOLEAN DEFAULT FALSE;
    DECLARE v_estadoEntrada CHAR(3);
    -- Validar que la entrada exista y esté pendiente
    SELECT COUNT(*), estado 
    INTO v_existencia, v_estadoEntrada
    FROM entrada
    WHERE noEntrada = p_noEntrada;
    IF v_existencia = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: La entrada especificada no existe.';
    END IF;
    IF v_estadoEntrada <> 'PEN' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Solo se pueden agregar materiales a entradas pendientes.';
    END IF;
    -- Validar que el material exista
    SELECT COUNT(*), estado 
    INTO v_existencia, v_estado
    FROM material
    WHERE codigoMaterial = p_codigoMaterial;
    IF v_existencia = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: El material no existe.';
    END IF;
    -- Reactivar material si estaba inactivo
    IF v_estado <> 'ACT' THEN
        UPDATE material 
        SET estado = 'ACT'
        WHERE codigoMaterial = p_codigoMaterial;
        SET v_alerta = TRUE;
    END IF;
    -- Insertar detalle de entrada
    INSERT INTO entradaMaterial (codigoMaterial, noEntrada, cantidad, alerta)
    VALUES (p_codigoMaterial, p_noEntrada, p_cantidad, v_alerta);
END$$