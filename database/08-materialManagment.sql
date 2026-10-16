DELIMITER //
CREATE PROCEDURE sp_agregarMaterial (
    IN p_codigoMaterial VARCHAR(28),
    IN p_descripcion VARCHAR(150),
    IN p_color VARCHAR(25),
    IN p_observaciones VARCHAR(150),
    IN p_unidadMedida VARCHAR(15),
    IN p_stockActual DECIMAL(10,2),
    IN p_codigoInterno BOOLEAN,
    IN p_categoria CHAR(3),
    IN p_ubicacion CHAR(5),
    IN p_marca INT,
    IN p_proveedor INT,
    IN p_stockMin DECIMAL(10,2)
)
BEGIN
    IF p_stockActual < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El stock actual no puede ser negativo.';
    END IF;
    INSERT INTO material (
        codigoMaterial,
        descripcion,
        color,
        observaciones,
        unidadMedida,
        stockActual,
        stockReservado,
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
        p_codigoInterno,
        p_categoria,
        p_ubicacion,
        p_marca,
        'ACT',
        p_proveedor,
        p_stockMin,
        FALSE
    );
END //
DELIMITER //
CREATE PROCEDURE sp_actualizarMaterial(
    IN p_codigoViejo VARCHAR(50),
    IN p_codigoNuevo VARCHAR(50),
    IN p_descripcion VARCHAR(255),
    IN p_color VARCHAR(50),
    IN p_observaciones TEXT,
    IN p_unidadMedida VARCHAR(20),
    IN p_stockActual DECIMAL(10,2),
    IN p_categoria VARCHAR(50), 
    IN p_ubicacion VARCHAR(50), 
    IN p_marca INT,
    IN p_proveedor INT,
    IN p_stockMinimo DECIMAL(10,2)
)
BEGIN
    UPDATE material
    SET 
        codigoMaterial = p_codigoNuevo, descripcion = p_descripcion, color = p_color, observaciones = p_observaciones,
        unidadMedida = p_unidadMedida, stockActual = p_stockActual, categoria = p_categoria, ubicacion = p_ubicacion,
        marca = p_marca, proveedor = p_proveedor, stockMinimo = p_stockMinimo
    WHERE codigoMaterial = p_codigoViejo;
END //
CREATE PROCEDURE sp_materialEliminado (
    IN p_codigoMaterial VARCHAR(28)
)
BEGIN
    UPDATE material
    SET estado = 'INT'
    WHERE codigoMaterial = p_codigoMaterial;
END //
DELIMITER ;