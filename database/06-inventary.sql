DELIMITER //
CREATE PROCEDURE sp_inventario (
    IN p_busqueda VARCHAR(150),
    IN p_categoria VARCHAR(100)
)
BEGIN
    SELECT *
    FROM vw_stockActual
    WHERE 
        (
            p_busqueda IS NULL 
            OR codigoMaterial LIKE CONCAT('%', p_busqueda, '%')
            OR descripcion LIKE CONCAT('%', p_busqueda, '%')
        )
        AND (
            p_categoria IS NULL 
            OR codigoCategoria = p_categoria
        )
    ORDER BY descripcion ASC;
END //
CREATE PROCEDURE sp_contarStockTotal()
BEGIN
    DECLARE v_total DECIMAL(15,2);    
    SELECT SUM(stockActual) INTO v_total
    FROM material
    WHERE estado = 'ACT' AND estado = 'INT';
    SELECT IFNULL(v_total, 0) AS stockTotal;
END //