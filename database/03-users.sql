DELIMITER //
CREATE PROCEDURE sp_crearUsuario (
    IN p_nombreUsuario VARCHAR(15),
    IN p_passwordHash CHAR(64),
    IN p_nombre VARCHAR(25),
    IN p_apellidoPaterno VARCHAR(15),
    IN p_apellidoMaterno VARCHAR(15),
    IN p_acceso CHAR(3)
)
BEGIN
    DECLARE v_existeAcceso INT DEFAULT 0;
    SELECT COUNT(*) INTO v_existeAcceso 
    FROM acceso 
    WHERE codigoAcceso = p_acceso;
    IF v_existeAcceso = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: El nivel de acceso especificado no es válido.';
    END IF;
    INSERT INTO usuario (
        nombreUsuario,
        password,
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        acceso
    ) VALUES (
        p_nombreUsuario,
        p_passwordHash,
        p_nombre,
        p_apellidoPaterno,
        p_apellidoMaterno,
        p_acceso
    );
    SELECT CONCAT('Usuario ', p_nombreUsuario, ' creado correctamente con rol ', p_acceso) AS mensaje;
END //
CREATE PROCEDURE sp_loginUsuario(
    IN p_nombreUsuario VARCHAR(15),
    IN p_passwordHash CHAR(64)
)
BEGIN
    DECLARE v_existe INT DEFAULT 0;
    SELECT COUNT(*) INTO v_existe
    FROM usuario
    WHERE LOWER(nombreUsuario) = LOWER(p_nombreUsuario)
      AND password = p_passwordHash;
    IF v_existe = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Usuario o contraseña incorrectos';
    ELSE
        SELECT nombreUsuario, nombre, apellidoPaterno, apellidoMaterno, acceso
        FROM usuario
        WHERE LOWER(nombreUsuario) = LOWER(p_nombreUsuario);
    END IF;
END //
CREATE PROCEDURE sp_modificarUsuario(
    IN p_nombreUsuario VARCHAR(15),
    IN p_nuevoPasswordHash CHAR(64),
    IN p_nombre VARCHAR(25),
    IN p_apellidoPaterno VARCHAR(15),
    IN p_apellidoMaterno VARCHAR(15),
    IN p_acceso CHAR(3)
)
BEGIN
    DECLARE v_existe INT DEFAULT 0;
    SELECT COUNT(*) INTO v_existe FROM usuario WHERE nombreUsuario = p_nombreUsuario;
    IF v_existe = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: El usuario no existe.';
    END IF;
    IF p_nuevoPasswordHash IS NOT NULL AND p_nuevoPasswordHash <> '' THEN
        UPDATE usuario
        SET password = p_nuevoPasswordHash, nombre = p_nombre, 
            apellidoPaterno = p_apellidoPaterno, apellidoMaterno = p_apellidoMaterno, acceso = p_acceso
        WHERE nombreUsuario = p_nombreUsuario;
    ELSE
        UPDATE usuario
        SET nombre = p_nombre, apellidoPaterno = p_apellidoPaterno, 
            apellidoMaterno = p_apellidoMaterno, acceso = p_acceso
        WHERE nombreUsuario = p_nombreUsuario;
    END IF;

    SELECT CONCAT('Usuario ', p_nombreUsuario, ' modificado correctamente.') AS mensaje;
END //
CREATE PROCEDURE sp_registrarAuditoria (
    IN p_usuario VARCHAR(15),
    IN p_accion VARCHAR(50),
    IN p_modulo VARCHAR(50),
    IN p_detalle TEXT
)
BEGIN
    INSERT INTO bitacora_actividad (nombreUsuario, accion, modulo, detalle)
    VALUES (p_usuario, p_accion, p_modulo, p_detalle);
END //
DELIMITER ;