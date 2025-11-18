-- Active: 1730905897544@@127.0.0.1@3306@almacennetcommtelpruebas
--Filtrado de materiales para el módulo de inventario
DELIMITER $$
CREATE OR REPLACE PROCEDURE sp_inventario (
    IN p_busqueda VARCHAR(150),
    IN p_categoria VARCHAR(100)
)
BEGIN
    SELECT *
    FROM vw_stockActual
    WHERE 
        estado = 'ACT'
        AND (
            p_busqueda IS NULL 
            OR codigoMaterial LIKE CONCAT('%', p_busqueda, '%')
            OR descripcion LIKE CONCAT('%', p_busqueda, '%')
        )
        AND (
            p_categoria IS NULL 
            OR codigoCategoria = p_categoria
        )
    ORDER BY descripcion ASC;
END$$
DROP PROCEDURE sp_inventario;
CALL sp_inventario(NULL, NULL);
--Contar el stock de todos los materiales
DELIMITER $$
CREATE OR REPLACE PROCEDURE sp_contarStockTotal()
BEGIN
    DECLARE v_total DECIMAL(15,2);
    SELECT 
        SUM(stockActual) 
    INTO v_total
    FROM material
    WHERE estado = 'ACT';
    SELECT 
        IFNULL(v_total, 0) AS stockTotal;
END$$
CALL sp_contarStockTotal();
--Contar el stock disponible al quitar los materiales reservados
DELIMITER $$
CREATE OR REPLACE PROCEDURE sp_contarStockDisponible()
BEGIN
    DECLARE v_disponible DECIMAL(15,2);
    SELECT 
        SUM(stockActual - stockReservado)
    INTO v_disponible
    FROM material
    WHERE estado = 'ACT';
    SELECT 
        IFNULL(v_disponible, 0) AS stockDisponible;
END$$
CALL sp_contarStockDisponible();