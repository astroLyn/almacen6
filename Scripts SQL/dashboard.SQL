-- Active: 1730905897544@@127.0.0.1@3306@almacennetcommtelpruebas
-- Total de materiales
SELECT COUNT(*) FROM material;

-- Stock total
SELECT SUM(stockActual) FROM material;

-- Total de material reservado
SELECT SUM(stockReservado)  FROM material;

-- Alertas activas de stock
SELECT COUNT(*)  FROM alertaMaterial WHERE visto = FALSE;
SELECT COUNT(*) FROM entrada WHERE estado = 'PEN';
SELECT COUNT(*)  FROM salida WHERE estado = 'PEN';
-- Entradas de hoy
SELECT COUNT(*)
FROM entrada
WHERE DATE(fecha) = CURDATE();

-- Salidas de hoy
SELECT COUNT(*) 
FROM salida
WHERE DATE(fecha) = CURDATE();
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
GROUP BY c.claveCategoria, c.nombre;
DELIMITER //

CREATE OR REPLACE PROCEDURE sp_dashboardGeneral()
BEGIN
    -- 1️⃣ Total de materiales, stock total y reservado
    SELECT 
        COUNT(*) AS totalMateriales,
        SUM(stockActual) AS stockTotal,
        SUM(stockReservado) AS totalReservado
    FROM material;

    -- 2️⃣ Alertas activas
    SELECT COUNT(*) AS alertasActivas
    FROM alertaMaterial
    WHERE visto = FALSE;

    -- 3️⃣ Entradas y salidas por aprobar
    SELECT 
        (SELECT COUNT(*) FROM entrada WHERE estado = 'PEN') AS entradasPorAprobar,
        (SELECT COUNT(*) FROM salida WHERE estado = 'PEN') AS salidasPorAprobar;

    -- 4️⃣ Movimientos de hoy (incluye total combinado)
    SELECT 
        (SELECT COUNT(*) FROM entrada WHERE DATE(fecha) = CURDATE()) AS entradasHoy,
        (SELECT COUNT(*) FROM salida WHERE DATE(fecha) = CURDATE()) AS salidasHoy,
        (
            (SELECT COUNT(*) FROM entrada WHERE DATE(fecha) = CURDATE()) +
            (SELECT COUNT(*) FROM salida WHERE DATE(fecha) = CURDATE())
        ) AS totalHoy;

    -- 5️⃣ Movimientos semanales (por día)
    SELECT 
        DATE(fecha) AS dia,
        SUM(CASE WHEN tipoMovimiento = 'ENTRADA' THEN 1 ELSE 0 END) AS entradas,
        SUM(CASE WHEN tipoMovimiento = 'SALIDA' THEN 1 ELSE 0 END) AS salidas
    FROM vw_movimientosRecientes
    WHERE YEARWEEK(fecha, 1) = YEARWEEK(CURDATE(), 1)
    GROUP BY DATE(fecha)
    ORDER BY dia;

    -- 6️⃣ Stock por categoría
    SELECT 
        c.nombre AS categoria,
        SUM(m.stockActual) AS stock
    FROM material m
    JOIN categoria c ON c.claveCategoria = m.categoria
    GROUP BY c.claveCategoria, c.nombre;

    -- 7️⃣ Total de movimientos del día (para uso general, opcional)
    SELECT 
        (
            (SELECT COUNT(*) FROM entrada WHERE DATE(fecha) = CURDATE())
            +
            (SELECT COUNT(*) FROM salida WHERE DATE(fecha) = CURDATE())
        ) AS totalMovimientosHoy;
END //

DELIMITER ;

CALL sp_dashboardGeneral();
