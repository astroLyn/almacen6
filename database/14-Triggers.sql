DELIMITER //
CREATE TRIGGER trg_log_nueva_entrada
AFTER INSERT ON entrada
FOR EACH ROW
BEGIN
    INSERT INTO bitacora_actividad (nombreUsuario, accion, modulo, detalle)
    VALUES (
        NEW.usuarioSolicita, 
        'CREAR', 
        'ENTRADAS', 
        CONCAT('Se registro una nueva entrada folio #', NEW.noEntrada, ' vinculada a la OS: ', NEW.OS)
    );
END //
CREATE TRIGGER trg_log_nueva_salida
AFTER INSERT ON salida
FOR EACH ROW
BEGIN
    INSERT INTO bitacora_actividad (nombreUsuario, accion, modulo, detalle)
    VALUES (
        NEW.usuarioSolicita, 
        'CREAR', 
        'SALIDAS', 
        CONCAT('Se registro una nueva salida folio #', NEW.noSalida, ' vinculada a la OS: ', NEW.OS)
    );
END //
CREATE TRIGGER trg_registrarAlertaStock
AFTER UPDATE ON material
FOR EACH ROW
BEGIN
    DECLARE v_mensaje VARCHAR(255);
    DECLARE v_tipoAlerta VARCHAR(50);
    IF NEW.stockActual <= 0 THEN
        SET v_tipoAlerta = 'STOCK AGOTADO';
        SET v_mensaje = CONCAT('Material ', NEW.codigoMaterial, ' sin existencia. Se requiere reposicion urgente.');
        
        IF NOT EXISTS (SELECT 1 FROM alertaMaterial WHERE codigoMaterial = NEW.codigoMaterial AND tipoAlerta = v_tipoAlerta AND visto = 0) THEN
            INSERT INTO alertaMaterial (codigoMaterial, tipoAlerta, mensaje) VALUES (NEW.codigoMaterial, v_tipoAlerta, v_mensaje);
        END IF;
    ELSEIF NEW.stockActual < NEW.stockMinimo THEN
        SET v_tipoAlerta = 'STOCK BAJO';
        SET v_mensaje = CONCAT('Material ', NEW.codigoMaterial, ' por debajo del minimo (Actual: ', NEW.stockActual, ')');
        
        IF NOT EXISTS (SELECT 1 FROM alertaMaterial WHERE codigoMaterial = NEW.codigoMaterial AND tipoAlerta = v_tipoAlerta AND visto = 0) THEN
            INSERT INTO alertaMaterial (codigoMaterial, tipoAlerta, mensaje) VALUES (NEW.codigoMaterial, v_tipoAlerta, v_mensaje);
        END IF;
    END IF;
END //
DELIMITER ;