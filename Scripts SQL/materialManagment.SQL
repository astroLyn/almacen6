-- Active: 1730905897544@@127.0.0.1@3306@almacennetcommtelpruebas
--Agregar un material
DELIMITER $$
CREATE PROCEDURE sp_agregarMaterial (
    IN p_codigoMaterial VARCHAR(28),
    IN p_descripcion VARCHAR(150),
    IN p_color VARCHAR(25),
    IN p_observaciones VARCHAR(150),
    IN p_unidadMedida VARCHAR(15),
    IN p_stockActual DECIMAL(10,2),
    IN p_imagen VARCHAR(100),
    IN p_codigoInterno BOOLEAN,
    IN p_categoria CHAR(3),
    IN p_ubicacion CHAR(5),
    IN p_marca INT,
    IN p_proveedor INT,
    IN p_stockMin DECIMAL(10,2)
)
BEGIN
    -- Validación 1: stockActual no puede ser negativo
    IF p_stockActual < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El stock actual no puede ser negativo.';
    END IF;
    -- Inserción del material
    INSERT INTO material (
        codigoMaterial,
        descripcion,
        color,
        observaciones,
        unidadMedida,
        stockActual,
        stockReservado,
        imagen,
        codigoInterno,
        categoria,
        ubicacion,
        marca,
        estado,
        proveedor,
        stockMinimo,
        alerta
    ) VALUES (
        p_codigoMaterial,
        p_descripcion,
        p_color,
        p_observaciones,
        p_unidadMedida,
        p_stockActual,
        0.00,
        p_imagen,
        p_codigoInterno,
        p_categoria,
        p_ubicacion,
        p_marca,
        'ACT',
        p_proveedor,
        p_stockMin,
        FALSE
    );
END$$
CALL sp_agregarMaterial(
    'PE-CAT6-02',
    'PEDACERA CABLE CAT 6 (02 m)',
    'Azul',
    '',
    'metro',
    2.00,
    '',
    TRUE,
    'CCB',
    'RC.3',
    11,
    2,
    15
);
--Actualización de la información de materiales
DELIMITER $$
CREATE PROCEDURE sp_actualizarMaterial (
    IN p_codigoMaterial VARCHAR(28),
    IN p_descripcion VARCHAR(150),
    IN p_color VARCHAR(25),
    IN p_observaciones VARCHAR(150),
    IN p_unidadMedida VARCHAR(15),
    IN p_stockActual DECIMAL(10,2),
    IN p_imagen VARCHAR(100),
    IN p_categoria CHAR(3),
    IN p_ubicacion VARCHAR(5),
    IN p_marca CHAR(3),
    IN p_proveedor CHAR(3),
    IN p_stockMinimo DECIMAL(10,2)
)
BEGIN
    DECLARE v_existe INT;
    DECLARE v_error VARCHAR(255);
    -- Verificar que el material exista
    SELECT COUNT(*) INTO v_existe
    FROM material
    WHERE codigoMaterial = p_codigoMaterial;
    IF v_existe = 0 THEN
        SET v_error = CONCAT('Error: El material con código ', p_codigoMaterial, ' no existe.');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error;
    END IF;
    IF p_stockMinimo < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: El stock mínimo no puede ser negativo.';
    END IF;
    -- Actualizar registro
    UPDATE material
    SET 
        descripcion = p_descripcion,
        color = p_color,
        observaciones = p_observaciones,
        unidadMedida = p_unidadMedida,
        stockActual = p_stockActual,
        imagen = p_imagen,
        categoria = p_categoria,
        ubicacion = p_ubicacion,
        marca = p_marca,
        proveedor = p_proveedor,
        stockMinimo = p_stockMinimo,
        alerta = TRUE
    WHERE codigoMaterial = p_codigoMaterial;
END$$
DROP PROCEDURE sp_actualizarMaterial;
--Eliminar un material
DELIMITER $$
CREATE OR REPLACE PROCEDURE sp_materialEliminado (
    IN p_codigoMaterial VARCHAR(28)
)
BEGIN
    -- Cambia el estado a inactivo (INT = Inactivo)
    UPDATE material
    SET estado = 'INT'
    WHERE codigoMaterial = p_codigoMaterial;
END$$
CALL sp_materialEliminado('C5U7KB9DNRD');