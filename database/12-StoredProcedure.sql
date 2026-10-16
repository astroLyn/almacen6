DELIMITER //
CREATE PROCEDURE sp_filtrarMovimientos (
    IN p_tipo VARCHAR(20),
    IN p_fechaInicio DATE,
    IN p_fechaFin DATE,
    IN p_estado VARCHAR(20)
)
BEGIN
    SELECT *
    FROM vw_historialGlobal
    WHERE 
        (tipoMovimiento = p_tipo OR p_tipo IS NULL)
        AND (
            (fecha BETWEEN p_fechaInicio AND p_fechaFin)
            OR (p_fechaInicio IS NULL OR p_fechaFin IS NULL)
        )
        AND (nombreEstado = p_estado OR p_estado IS NULL)
    ORDER BY fecha DESC;
END //