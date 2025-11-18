-- Active: 1730905897544@@127.0.0.1@3306@almacennetcommtelpruebas
--Parametrós para el historial de movimientos
DELIMITER $$
CREATE PROCEDURE sp_filtrarMovimientos (
    IN tipo VARCHAR(20),
    IN fechaInicio DATE,
    IN fechaFin DATE,
    IN estado VARCHAR(20)
)
BEGIN
    SELECT *
    FROM vw_historialMovimientos
    WHERE 
        -- Filtro por tipo de movimiento (opcional)
        (tipoMovimiento = tipo OR tipo IS NULL)
        -- Filtro por rango de fechas (opcional)
        AND (
            (fecha BETWEEN fechaInicio AND fechaFin)
            OR (fechaInicio IS NULL OR fechaFin IS NULL)
        )
        -- Filtro por estado (opcional)
        AND (estado = estado OR estado IS NULL)
        
    ORDER BY fecha DESC;
END$$
CALL sp_filtrarMovimientos('Salida', NULL, NULL, NULL);



DELIMITER ;
⚙️ 3. SP – Registrar apartado de materiales

Objetivo: Apartar materiales (reservarlos sin sacarlos físicamente del almacén).

DELIMITER $$

CREATE PROCEDURE sp_registrarApartadoMaterial (
    IN p_noApartado INT,
    IN p_codigoMaterial CHAR(28),
    IN p_cantidad DECIMAL(10,2)
)
BEGIN
    DECLARE v_stockActual DECIMAL(10,2);

    -- Verificar existencia y stock disponible
    SELECT stockActual INTO v_stockActual
    FROM material WHERE codigoMaterial = p_codigoMaterial;

    IF v_stockActual IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Material no encontrado.';
    ELSEIF v_stockActual < p_cantidad THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Stock insuficiente para apartar.';
    END IF;

    -- Registrar apartado
    INSERT INTO apartadoMaterial (codigoMaterial, noApartado, cantidad, alerta)
    VALUES (p_codigoMaterial, p_noApartado, p_cantidad, FALSE);

    -- Aumentar el stock reservado
    UPDATE material
    SET stockReservado = stockReservado + p_cantidad
    WHERE codigoMaterial = p_codigoMaterial;
END$$

DELIMITER ;

⚙️ 4. SP – Liberar materiales apartados

Objetivo: Liberar materiales reservados (ya sea porque se canceló o se despachó).

DELIMITER $$

CREATE PROCEDURE sp_liberarMaterialApartado (
    IN p_noApartado INT
)
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_codigoMaterial CHAR(28);
    DECLARE v_cantidad DECIMAL(10,2);
    DECLARE cur CURSOR FOR 
        SELECT codigoMaterial, cantidad FROM apartadoMaterial WHERE noApartado = p_noApartado;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO v_codigoMaterial, v_cantidad;
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Disminuir stock reservado
        UPDATE material
        SET stockReservado = stockReservado - v_cantidad
        WHERE codigoMaterial = v_codigoMaterial;
    END LOOP;

    CLOSE cur;
END$$