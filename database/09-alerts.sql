DELIMITER //
CREATE PROCEDURE sp_promedioGeneralStock()
BEGIN
    DECLARE v_promedio DECIMAL(7,2);
    
    SELECT 
        CASE 
            WHEN SUM(stockMinimo) = 0 THEN 0
            ELSE ROUND((SUM(stockActual) / SUM(stockMinimo)) * 100, 2)
        END
    INTO v_promedio
    FROM material
    WHERE estado = 'ACT';
        SELECT IFNULL(v_promedio, 0) AS promedioGeneralStock;
END //
DELIMITER ;