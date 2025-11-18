-- Active: 1730905897544@@127.0.0.1@3306@almacennetcommtelpruebas
SELECT 
    codigoMaterial,
    descripcion,
    stockActual,
    stockMinimo,
    CASE 
        WHEN stockActual < stockMinimo THEN '⚠️ Bajo Stock'
        ELSE '✅ Suficiente'
    END AS alerta
FROM material;
DELIMITER $$

CREATE PROCEDURE sp_actualizarAlertasStock()
BEGIN
    UPDATE material
    SET alerta = (stockActual <= stockMinimo OR stockActual = 0);
END$$

DELIMITER ;
CREATE EVENT evt_verificarAlertasDiarias
ON SCHEDULE EVERY 1 DAY
DO
CALL sp_actualizarAlertasStock();

SELECT 
        codigoMaterial,
        descripcion,
        unidadMedida,
        color,
        stockActual,
        stockMinimo,
        ubicacion,
        stockReservado
      FROM vw_materiales_activos
      WHERE 1=1;
SELECT COUNT(*) AS alertas
      FROM vw_alertaMaterialDetalle
      WHERE estadoAlerta = 'ACTIVA';
SELECT COUNT(*) AS entrada
      FROM entrada
      WHERE estado = 'PEN';
SELECT COUNT(*) AS salida
FROM salida
WHERE estado = 'PEN';
      SELECT 
        e.noEntrada,
        e.OS,
        e.fecha,
        p.nombre,
        p.claveProveedor AS proveedorId,
        c.claveCliente AS clienteId,
        c.nombreFiscal,
        e.estado,
        COUNT(em.codigoMaterial) AS totalMateriales
      FROM entrada e
      LEFT JOIN proveedor p ON e.proveedor = p.claveProveedor
      LEFT JOIN cliente c ON e.cliente = c.claveCliente
      LEFT JOIN entradaMaterial em ON e.noEntrada = em.noEntrada
      WHERE e.estado = 'PEN'
      GROUP BY e.noEntrada
      ORDER BY e.fecha DESC;
