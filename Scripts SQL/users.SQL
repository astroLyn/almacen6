-- Active: 1730905897544@@127.0.0.1@3306@almacennetcommtelpruebas
--Procedimiento para crear usuarios
DELIMITER $$
CREATE OR REPLACE PROCEDURE sp_crearUsuario (
    IN p_user VARCHAR(15),
    IN p_passwordPlano VARCHAR(100),
    IN p_nombre VARCHAR(25),
    IN p_apellidoPaterno VARCHAR(15),
    IN p_apellidoMaterno VARCHAR(15),
    IN p_acceso CHAR(3)
)
BEGIN
    DECLARE v_passwordHasheado CHAR(64);
    SET v_passwordHasheado = SHA2(p_passwordPlano, 256);
    INSERT INTO usuario (
        nombreUsuario,
        password,
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        acceso
    ) VALUES (
        p_user,
        v_passwordHasheado,
        p_nombre,
        p_apellidoPaterno,
        p_apellidoMaterno,
        p_acceso
    );
END$$
CALL sp_crearUsuario(
    'aPrueba',
    'pass123',
    'Usuario',
    'Prueba',
    'Primero',
    'ENC'
);
DELIMITER //

CREATE OR REPLACE PROCEDURE sp_loginUsuario(
    IN p_nombreUsuario VARCHAR(15),
    IN p_passwordPlano VARCHAR(100)
)
BEGIN
    DECLARE v_passwordHasheado CHAR(64);
    DECLARE v_existe INT DEFAULT 0;
    -- Hashear la contraseña ingresada
    SET v_passwordHasheado = SHA2(p_passwordPlano, 256);
    -- Verificar si el usuario existe (ignorando mayúsculas/minúsculas)
    SELECT COUNT(*) INTO v_existe
    FROM usuario
    WHERE LOWER(nombreUsuario) = LOWER(p_nombreUsuario)
      AND password = v_passwordHasheado;
    IF v_existe = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Usuario o contraseña incorrectos';
    ELSE
        -- Devolver los datos del usuario (sin contraseña)
        SELECT 
            nombreUsuario,
            nombre,
            apellidoPaterno,
            apellidoMaterno,
            acceso
        FROM usuario
        WHERE LOWER(nombreUsuario) = LOWER(p_nombreUsuario);
    END IF;
END //
DELIMITER ;

CALL sp_loginUsuario('jArellano', 'lover.tay');

DELIMITER //

CREATE OR REPLACE PROCEDURE sp_modificarUsuario(
    IN p_nombreUsuario VARCHAR(15),
    IN p_nuevoPasswordPlano VARCHAR(100), -- puede ser NULL si no se desea cambiar
    IN p_nombre VARCHAR(25),
    IN p_apellidoPaterno VARCHAR(15),
    IN p_apellidoMaterno VARCHAR(15),
    IN p_acceso CHAR(3)
)
BEGIN
    DECLARE v_existe INT DEFAULT 0;
    DECLARE v_nuevoPasswordHash CHAR(64);
    -- Verificar si el usuario existe
    SELECT COUNT(*) INTO v_existe
    FROM usuario
    WHERE nombreUsuario = p_nombreUsuario;
    IF v_existe = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: El usuario no existe.';
    END IF;
    -- Si se proporciona nueva contraseña, hashearla
    IF p_nuevoPasswordPlano IS NOT NULL AND p_nuevoPasswordPlano <> '' THEN
        SET v_nuevoPasswordHash = SHA2(p_nuevoPasswordPlano, 256);
        UPDATE usuario
        SET 
            password = v_nuevoPasswordHash,
            nombre = p_nombre,
            apellidoPaterno = p_apellidoPaterno,
            apellidoMaterno = p_apellidoMaterno,
            acceso = p_acceso
        WHERE nombreUsuario = p_nombreUsuario;
    ELSE
        -- Si no se envía contraseña, actualizar solo los demás datos
        UPDATE usuario
        SET 
            nombre = p_nombre,
            apellidoPaterno = p_apellidoPaterno,
            apellidoMaterno = p_apellidoMaterno,
            acceso = p_acceso
        WHERE nombreUsuario = p_nombreUsuario;
    END IF;
    -- Confirmar éxito
    SELECT CONCAT('✅ Usuario ', p_nombreUsuario, ' modificado correctamente.') AS mensaje;
END //
DELIMITER ;
CALL sp_modificarUsuario(
    'aPrueba',
    NULL, -- No se cambia la contraseña
    'Juan',
    'Perez',
    'Rosales',
    'ENC'
);
CALL sp_modificarUsuario(
    'jArellano',
    'lover.tay',
    'Jocelyn',
    'Arellano',
    'Aramburo',
    'ENC'
);
