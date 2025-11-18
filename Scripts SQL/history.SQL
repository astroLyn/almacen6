-- Active: 1730905897544@@127.0.0.1@3306@almacennetcommtelpruebas
DELIMITER //
CREATE PROCEDURE sp_obtenerTotalesMovimientos()
BEGIN
    SELECT 
        COUNT(*) AS totalMovimientos,
        SUM(CASE WHEN tipoMovimiento = 'Entrada' THEN 1 ELSE 0 END) AS totalEntradas,
        SUM(CASE WHEN tipoMovimiento = 'Salida' THEN 1 ELSE 0 END) AS totalSalidas,
        SUM(CASE WHEN tipoMovimiento = 'Apartado' THEN 1 ELSE 0 END) AS totalApartados
    FROM vw_historialMovimientos;
END //
CALL sp_obtenerTotalesMovimientos();
