import express from "express";
import db from "../config/db.js";

const router = express.Router();

/**
 * 🔐 POST /api/auth/login
 * Autentica un usuario usando el procedimiento sp_loginUsuario
 */
router.post("/login", async (req, res) => {
  const { nombreUsuario, password } = req.body;

  // Validar campos requeridos
  if (!nombreUsuario || !password) {
    return res.status(400).json({
      error: "Campos requeridos",
      detalle: "nombreUsuario y password son obligatorios"
    });
  }

  try {
    console.log("🔐 Intentando login para:", nombreUsuario);

    // Llamar al procedimiento almacenado
    const [results] = await db.query(
      "CALL sp_loginUsuario(?, ?)",
      [nombreUsuario, password]
    );

    // El procedimiento devuelve los datos del usuario en el primer resultado
    const usuario = results[0][0];

    if (!usuario) {
      return res.status(401).json({
        error: "Error de autenticación",
        detalle: "Usuario o contraseña incorrectos"
      });
    }

    console.log("✅ Login exitoso para:", usuario.nombreUsuario);

    res.json({
      message: "Login exitoso",
      usuario: {
        nombreUsuario: usuario.nombreUsuario,
        nombre: usuario.nombre,
        apellidoPaterno: usuario.apellidoPaterno,
        apellidoMaterno: usuario.apellidoMaterno,
        acceso: usuario.acceso,
        nombreCompleto: `${usuario.nombre} ${usuario.apellidoPaterno} ${usuario.apellidoMaterno}`
      },
      token: "jwt-token-placeholder" // Aquí integrarás JWT después
    });

  } catch (error) {
    console.error("❌ Error en login:", error);

    // Manejar errores específicos del procedimiento
    if (error.message.includes('Usuario o contraseña incorrectos')) {
      return res.status(401).json({
        error: "Error de autenticación",
        detalle: "Usuario o contraseña incorrectos"
      });
    }

    res.status(500).json({
      error: "Error interno del servidor",
      detalle: error.message
    });
  }
});

/**
 * 👥 GET /api/auth/usuarios
 * Obtiene todos los usuarios (sin contraseñas)
 */
router.get("/usuarios", async (req, res) => {
  try {
    const [usuarios] = await db.query(`
      SELECT 
        nombreUsuario,
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        acceso
      FROM usuario
      ORDER BY nombre, apellidoPaterno
    `);

    res.json(usuarios);
  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error);
    res.status(500).json({
      error: "Error al obtener usuarios",
      detalle: error.message
    });
  }
});

/**
 * ➕ POST /api/auth/usuarios
 * Crea un nuevo usuario usando sp_crearUsuario
 */
router.post("/usuarios", async (req, res) => {
  const {
    user,
    passwordPlano,
    nombre,
    apellidoPaterno,
    apellidoMaterno,
    acceso
  } = req.body;

  // Validar campos requeridos
  if (!user || !passwordPlano || !nombre || !apellidoPaterno || !apellidoMaterno || !acceso) {
    return res.status(400).json({
      error: "Campos requeridos",
      detalle: "Todos los campos son obligatorios"
    });
  }

  try {
    console.log("👤 Creando nuevo usuario:", user);

    // Llamar al procedimiento almacenado
    await db.query(
      "CALL sp_crearUsuario(?, ?, ?, ?, ?, ?)",
      [user, passwordPlano, nombre, apellidoPaterno, apellidoMaterno, acceso]
    );

    console.log("✅ Usuario creado exitosamente:", user);

    res.status(201).json({
      message: "Usuario creado exitosamente",
      usuario: {
        nombreUsuario: user,
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        acceso
      }
    });

  } catch (error) {
    console.error("❌ Error al crear usuario:", error);

    // Manejar errores específicos
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        error: "Usuario duplicado",
        detalle: "El nombre de usuario ya existe"
      });
    }

    if (error.code === 'ER_NO_REFERENCED_ROW') {
      return res.status(400).json({
        error: "Acceso inválido",
        detalle: "El código de acceso no existe"
      });
    }

    res.status(500).json({
      error: "Error al crear usuario",
      detalle: error.message
    });
  }
});

/**
 * ✏️ PUT /api/auth/usuarios/:nombreUsuario
 * Modifica un usuario existente usando sp_modificarUsuario
 */
router.put("/usuarios/:nombreUsuario", async (req, res) => {
  const { nombreUsuario } = req.params;
  const {
    nuevoPasswordPlano,
    nombre,
    apellidoPaterno,
    apellidoMaterno,
    acceso
  } = req.body;

  // Validar que al menos hay campos para actualizar
  if (!nombre && !apellidoPaterno && !apellidoMaterno && !acceso && !nuevoPasswordPlano) {
    return res.status(400).json({
      error: "Campos requeridos",
      detalle: "Debe proporcionar al menos un campo para actualizar"
    });
  }

  try {
    console.log("✏️ Actualizando usuario:", nombreUsuario);

    // Llamar al procedimiento almacenado
    const [results] = await db.query(
      "CALL sp_modificarUsuario(?, ?, ?, ?, ?, ?)",
      [nombreUsuario, nuevoPasswordPlano || null, nombre, apellidoPaterno, apellidoMaterno, acceso]
    );

    console.log("✅ Usuario actualizado exitosamente:", nombreUsuario);

    res.json({
      message: "Usuario actualizado exitosamente",
      detalle: results[0]?.[0]?.mensaje || "Cambios aplicados correctamente"
    });

  } catch (error) {
    console.error("❌ Error al actualizar usuario:", error);

    // Manejar errores específicos
    if (error.message.includes('El usuario no existe')) {
      return res.status(404).json({
        error: "Usuario no encontrado",
        detalle: "El usuario especificado no existe"
      });
    }

    if (error.code === 'ER_NO_REFERENCED_ROW') {
      return res.status(400).json({
        error: "Acceso inválido",
        detalle: "El código de acceso no existe"
      });
    }

    res.status(500).json({
      error: "Error al actualizar usuario",
      detalle: error.message
    });
  }
});

/**
 * 🗑️ DELETE /api/auth/usuarios/:nombreUsuario
 * Elimina un usuario
 */
router.delete("/usuarios/:nombreUsuario", async (req, res) => {
  const { nombreUsuario } = req.params;

  try {
    console.log("🗑️ Eliminando usuario:", nombreUsuario);

    // Verificar si el usuario existe
    const [usuario] = await db.query(
      "SELECT nombreUsuario FROM usuario WHERE nombreUsuario = ?",
      [nombreUsuario]
    );

    if (usuario.length === 0) {
      return res.status(404).json({
        error: "Usuario no encontrado",
        detalle: "El usuario especificado no existe"
      });
    }

    // Eliminar usuario
    await db.query(
      "DELETE FROM usuario WHERE nombreUsuario = ?",
      [nombreUsuario]
    );

    console.log("✅ Usuario eliminado exitosamente:", nombreUsuario);

    res.json({
      message: "Usuario eliminado exitosamente",
      usuarioEliminado: nombreUsuario
    });

  } catch (error) {
    console.error("❌ Error al eliminar usuario:", error);

    // Manejar errores de clave foránea
    if (error.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(400).json({
        error: "No se puede eliminar el usuario",
        detalle: "El usuario tiene registros asociados en el sistema"
      });
    }

    res.status(500).json({
      error: "Error al eliminar usuario",
      detalle: error.message
    });
  }
});

/**
 * 🔍 GET /api/auth/usuarios/:nombreUsuario
 * Obtiene un usuario específico
 */
router.get("/usuarios/:nombreUsuario", async (req, res) => {
  const { nombreUsuario } = req.params;

  try {
    const [usuarios] = await db.query(`
      SELECT 
        nombreUsuario,
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        acceso
      FROM usuario
      WHERE nombreUsuario = ?
    `, [nombreUsuario]);

    if (usuarios.length === 0) {
      return res.status(404).json({
        error: "Usuario no encontrado",
        detalle: "El usuario especificado no existe"
      });
    }

    res.json(usuarios[0]);
  } catch (error) {
    console.error("❌ Error al obtener usuario:", error);
    res.status(500).json({
      error: "Error al obtener usuario",
      detalle: error.message
    });
  }
});

/**
 * 🎯 GET /api/auth/tipos-acceso
 * Obtiene los tipos de acceso disponibles
 */
router.get("/tipos-acceso", async (req, res) => {
  try {
    const [tiposAcceso] = await db.query(`
      SELECT codigoAcceso, nombre 
      FROM acceso 
      ORDER BY codigoAcceso
    `);

    res.json(tiposAcceso);
  } catch (error) {
    console.error("❌ Error al obtener tipos de acceso:", error);
    res.status(500).json({
      error: "Error al obtener tipos de acceso",
      detalle: error.message
    });
  }
});

export default router;