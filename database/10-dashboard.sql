DELIMITER //
CREATE PROCEDURE sp_dashboardGeneral()
BEGIN
    SELECT 
        COUNT(*) AS totalMateriales,
        SUM(stockActual) AS stockTotal,
        SUM(stockReservado) AS totalReservado
    FROM material
    WHERE estado = 'ACT';
    SELECT COUNT(*) AS alertasActivas
    FROM alertaMaterial
    WHERE visto = FALSE;
    SELECT 
        (SELECT COUNT(*) FROM entrada WHERE estado = 'PEN') AS entradasPorAprobar,
        (SELECT COUNT(*) FROM salida WHERE estado = 'PEN') AS salidasPorAprobar;
    SELECT 
        (SELECT COUNT(*) FROM entrada WHERE DATE(fecha) = CURDATE()) AS entradasHoy,
        (SELECT COUNT(*) FROM salida WHERE DATE(fecha) = CURDATE()) AS salidasHoy,
        (
            (SELECT COUNT(*) FROM entrada WHERE DATE(fecha) = CURDATE()) +
            (SELECT COUNT(*) FROM salida WHERE DATE(fecha) = CURDATE())
        ) AS totalHoy;
    SELECT 
        DATE(fecha) AS dia,
        SUM(CASE WHEN tipoMovimiento = 'ENTRADA' THEN 1 ELSE 0 END) AS entradas,
        SUM(CASE WHEN tipoMovimiento = 'SALIDA' THEN 1 ELSE 0 END) AS salidas
    FROM vw_movimientosRecientes
    WHERE YEARWEEK(fecha, 1) = YEARWEEK(CURDATE(), 1)
    GROUP BY DATE(fecha)
    ORDER BY dia;
    SELECT 
        c.nombre AS categoria,
        SUM(m.stockActual) AS stock
    FROM material m
    JOIN categoria c ON c.claveCategoria = m.categoria
    WHERE m.estado = 'ACT'
    GROUP BY c.claveCategoria, c.nombre;
    SELECT 
        (
            (SELECT COUNT(*) FROM entrada WHERE DATE(fecha) = CURDATE())
            +
            (SELECT COUNT(*) FROM salida WHERE DATE(fecha) = CURDATE())
        ) AS totalMovimientosHoy;
END //
DELIMITER ;