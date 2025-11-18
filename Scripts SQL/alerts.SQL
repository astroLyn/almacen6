-- Active: 1730905897544@@127.0.0.1@3306@almacennetcommtelpruebas
DELIMITER $$
CREATE OR REPLACE PROCEDURE sp_promedioGeneralStock()
BEGIN
    DECLARE v_promedio DECIMAL(7,2);
    SELECT 
        CASE 
            WHEN SUM(stockMinimo) = 0 THEN 0
            ELSE ROUND((SUM(stockActual) / SUM(stockMinimo)) * 100, 2)
        END
    INTO v_promedio
    FROM material;
    -- Mostrar el resultado
    SELECT v_promedio AS promedioGeneralStock;
END$$
CALL sp_promedioGeneralStock();
--Vista para las alertas
CREATE OR REPLACE VIEW vw_alertaMaterialDetalle AS
SELECT
    a.idAlerta,
    a.codigoMaterial,
    m.descripcion AS nombreMaterial,
    a.tipoAlerta,
    a.estado AS estadoAlerta,
    a.visto,
    a.fechaAlerta,
    a.mensaje,
    m.stockActual,
    m.stockMinimo,
    m.stockReservado,
    -- Porcentaje del nivel de cada material
    ROUND(
        (CASE 
            WHEN m.stockMinimo = 0 THEN 0
            ELSE (m.stockActual / m.stockMinimo) * 100
        END), 2
    ) AS porcentajeNivel
FROM alertaMaterial a
JOIN material m ON a.codigoMaterial = m.codigoMaterial
ORDER BY a.fechaAlerta DESC;
SELECT * FROM vw_alertaMaterialDetalle;