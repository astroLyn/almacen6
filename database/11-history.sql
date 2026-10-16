DELIMITER //
CREATE PROCEDURE sp_obtenerTotalesMovimientos()
BEGIN
    SELECT 
        SUM(CASE WHEN modulo IN ('Entradas', 'Salidas') THEN 1 ELSE 0 END) AS totalMovimientos,
        SUM(CASE WHEN modulo = 'Entradas' THEN 1 ELSE 0 END) AS totalEntradas,        
        SUM(CASE WHEN modulo = 'Salidas' THEN 1 ELSE 0 END) AS totalSalidas        
    FROM vw_historialGlobal;
END //
DELIMITER ;