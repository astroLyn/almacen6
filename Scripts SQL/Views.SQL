-- Active: 1730905897544@@127.0.0.1@3306@almacennetcommtelpruebas
--Vista para ver los materiales que tienen un stock menor al minimo
CREATE VIEW vw_bajoStock AS
SELECT 
    m.codigoMaterial,
    m.descripcion,
    m.stockActual,
    m.stockMinimo,
    c.nombre AS categoria,
    u.nombre AS ubicacion,
    ma.nombre AS marca,
    co.descripcion AS color
FROM material m
LEFT JOIN categoria c ON m.categoria = c.claveCategoria
LEFT JOIN ubicacion u ON m.ubicacion = u.codigoUbicacion
LEFT JOIN marca ma ON m.marca = ma.claveMarca
LEFT JOIN color co ON u.color = co.codigoColor
WHERE m.stockActual < m.stockMinimo
ORDER BY m.stockActual ASC;
SELECT * FROM vw_bajoStock
ORDER BY stockActual ASC;
--Vista del historial completo de entradas
CREATE OR REPLACE VIEW vw_historialEntradas AS
SELECT 
    e.noEntrada AS entrada,
    e.proveedor AS proveedor,
    e.estado AS estado,
    e.cliente AS cliente,
    e.OS,
    e.fecha,
    p.nombre AS nombreProveedor,
    c.nombreFiscal AS nombreCliente,
    es.nombre AS nombreEstado,
    m.codigoMaterial,
    m.descripcion AS nombreMaterial,
    m.unidadMedida,
    m.color,
    em.cantidad,
    em.alerta
FROM entrada e
INNER JOIN entradaMaterial em 
    ON e.noEntrada = em.noEntrada
INNER JOIN material m 
    ON em.codigoMaterial = m.codigoMaterial
LEFT JOIN proveedor p 
    ON e.proveedor = p.claveProveedor
LEFT JOIN cliente c 
    ON e.cliente = c.claveCliente
LEFT JOIN estado es 
    ON e.estado = es.codigoEstado
ORDER BY e.fecha DESC, e.noEntrada ASC;
SELECT * FROM vw_historialEntradas;
--Vista del historial completo de salidas
CREATE OR REPLACE VIEW vw_historialSalidas AS
SELECT 
    s.noSalida AS salida,
    s.estado AS estado,
    s.cliente AS cliente,
    s.OS,
    s.fecha,
    c.nombreFiscal AS nombreCliente,
    es.nombre AS nombreEstado,
    m.codigoMaterial,
    m.descripcion AS nombreMaterial,
    m.unidadMedida,
    m.color,
    sm.cantidad,
    sm.alerta
FROM salida s
INNER JOIN salidaMaterial sm 
    ON s.noSalida = sm.noSalida
INNER JOIN material m 
    ON sm.codigoMaterial = m.codigoMaterial
LEFT JOIN cliente c 
    ON s.cliente = c.claveCliente
LEFT JOIN estado es 
    ON s.estado = es.codigoEstado
ORDER BY s.fecha DESC, s.noSalida ASC;
SELECT * FROM vw_historialsalidas;
--Vista del historial de movimientos de los últimos 7 días incluyendo
--entradas, salidas y material apartado
CREATE VIEW vw_movimientosRecientes AS
SELECT 
    m.codigoMaterial,
    m.descripcion,
    'Entrada' AS tipoMovimiento,
    e.fecha,
    em.cantidad,
    et.nombre AS estado,
    e.noEntrada AS folioMovimiento
FROM entradaMaterial em
JOIN entrada e ON em.noEntrada = e.noEntrada
JOIN material m ON em.codigoMaterial = m.codigoMaterial
JOIN estado et ON e.estado = et.codigoEstado
WHERE e.fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
UNION ALL
SELECT 
    m.codigoMaterial,
    m.descripcion,
    'Salida' AS tipoMovimiento,
    s.fecha,
    sm.cantidad,
    et.nombre AS estado,
    s.noSalida AS folioMovimiento
FROM salidaMaterial sm
JOIN salida s ON sm.noSalida = s.noSalida
JOIN material m ON sm.codigoMaterial = m.codigoMaterial
JOIN estado et ON s.estado = et.codigoEstado
WHERE s.fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
UNION ALL
SELECT 
    m.codigoMaterial,
    m.descripcion,
    'Apartado' AS tipoMovimiento,
    a.fecha AS fecha,
    am.cantidad,
    et.nombre AS estado,
    a.noApartado AS folioMovimiento
FROM apartadoMaterial am
JOIN materialApartado a ON am.noApartado = a.noApartado
JOIN material m ON am.codigoMaterial = m.codigoMaterial
JOIN estado et ON a.estado = et.codigoEstado
WHERE a.fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
ORDER BY fecha DESC;
SELECT * FROM vw_movimientosRecientes;
--Vista con la información pertinente de los materiales en almacén
CREATE OR REPLACE VIEW vw_stockActual AS
SELECT 
    m.codigoMaterial,
    m.descripcion,
    m.color,
    m.unidadMedida,
    m.stockActual,
    m.stockMinimo,
    m.stockReservado,
    m.observaciones,
    m.imagen,
    m.estado,
    c.claveCategoria AS codigoCategoria,
    c.nombre AS categoria,
    u.codigoUbicacion AS codigoUbicacion,
    u.nombre AS ubicacion,
    u.color AS colorUbicacion,
    ma.claveMarca AS codigoMarca,
    ma.nombre AS marca,
    p.claveProveedor AS codigoProveedor,
    p.nombre AS proveedor
FROM material m
JOIN categoria c ON m.categoria = c.claveCategoria
JOIN ubicacion u ON m.ubicacion = u.codigoUbicacion
JOIN marca ma ON m.marca = ma.claveMarca
JOIN proveedor p ON m.proveedor = p.claveProveedor;
SELECT * FROM vw_stockactual;
--Vista con los productos con un stock menor al minimo o igual a cero
CREATE VIEW vw_productosCriticos AS
SELECT 
    m.codigoMaterial,
    m.descripcion,
    m.stockActual,
    m.stockMinimo,
    c.nombre AS categoria,
    u.nombre AS ubicacion,
    cl.descripcion AS color,
    ma.nombre AS marca,
    p.nombre AS proveedor
FROM material m
LEFT JOIN categoria c ON m.categoria = c.claveCategoria
LEFT JOIN ubicacion u ON m.ubicacion = u.codigoUbicacion
LEFT JOIN marca ma ON m.marca = ma.claveMarca
LEFT JOIN proveedor p ON m.proveedor = p.claveProveedor
LEFT JOIN color cl ON u.color = cl.codigoColor
WHERE m.stockActual < m.stockMinimo OR m.stockActual <= 0
ORDER BY m.stockActual ASC;
--Vista del historial completa
CREATE VIEW vw_historialMovimientos AS
SELECT 
    m.codigoMaterial,
    m.descripcion,
    'Entrada' AS tipoMovimiento,
    e.fecha,
    em.cantidad,
    et.nombre AS estado,
    e.noEntrada AS folioMovimiento
FROM entradaMaterial em
JOIN entrada e ON em.noEntrada = e.noEntrada
JOIN material m ON em.codigoMaterial = m.codigoMaterial
JOIN estado et ON e.estado = et.codigoEstado
UNION ALL
SELECT 
    m.codigoMaterial,
    m.descripcion,
    'Salida' AS tipoMovimiento,
    s.fecha,
    sm.cantidad,
    et.nombre AS estado,
    s.noSalida AS folioMovimiento
FROM salidaMaterial sm
JOIN salida s ON sm.noSalida = s.noSalida
JOIN material m ON sm.codigoMaterial = m.codigoMaterial
JOIN estado et ON s.estado = et.codigoEstado
UNION ALL
SELECT 
    m.codigoMaterial,
    m.descripcion,
    'Apartado' AS tipoMovimiento,
    a.fecha AS fecha,
    am.cantidad,
    et.nombre AS estado,
    a.noApartado AS folioMovimiento
FROM apartadoMaterial am
JOIN materialApartado a ON am.noApartado = a.noApartado
JOIN material m ON am.codigoMaterial = m.codigoMaterial
JOIN estado et ON a.estado = et.codigoEstado
ORDER BY fecha DESC;
SELECT * FROM vw_historialMovimientos;
CREATE VIEW vw_materialesAlerta AS
SELECT 
    m.codigoMaterial,
    m.descripcion,
    m.stockActual,
    m.stockMinimo,
    c.nombre AS categoria,
    u.nombre AS ubicacion,
    ma.nombre AS marca,
    co.descripcion AS color,
    m.alerta
FROM material m
LEFT JOIN categoria c ON m.categoria = c.claveCategoria
LEFT JOIN ubicacion u ON m.ubicacion = u.codigoUbicacion
LEFT JOIN marca ma ON m.marca = ma.claveMarca
LEFT JOIN color co ON u.color = co.codigoColor
WHERE m.alerta = TRUE
ORDER BY m.stockActual ASC;
SELECT * FROM vw_materialesAlerta;
--Ver la información de las categorías
CREATE VIEW vw_materialesCategorias AS
SELECT
    c.claveCategoria AS codigo,
    c.nombre AS categoria
FROM categoria c;
SELECT codigo, categoria FROM vw_materialesCategorias;
--Ver la información de las ubicaciones
CREATE VIEW vw_ubicacionMateriales AS
SELECT
    u.codigoUbicacion AS codigo,
    u.nombre AS ubicacion,
    c.descripcion AS color
FROM ubicacion AS u
JOIN color AS c ON u.color = c.codigoColor;
SELECT * FROM vw_ubicacionMateriales;
DROP VIEW vw_ubicacionMateriales;
CREATE OR REPLACE VIEW vw_materiales_activos AS
SELECT 
    m.codigoMaterial,
    m.descripcion,
    m.unidadMedida,
    m.color,
    m.stockActual,
    m.stockMinimo,
    m.ubicacion,
    COALESCE(m.stockReservado, 0) as stockReservado,
    m.estado
FROM material m
WHERE m.estado = 'ACT';
