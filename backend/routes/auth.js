import express from "express";
import crypto from "crypto"; // 🔒 Para encriptar contraseñas
import jwt from "jsonwebtoken"; // 🔒 Para generar el gafete (Token)
import db from "../config/db.js";
// 🔒 Importamos los guardias de seguridad para proteger la creación de usuarios
import { verificarToken, verificarRol } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * 🔐 POST /api/auth/login
 * PÚBLICA: Autentica un usuario y le entrega su Token
 */
router.post("/login", async (req, res) => {
  const { nombreUsuario, password } = req.body;

  if (!nombreUsuario || !password) {
    return res.status(400).json({ error: "Campos requeridos", detalle: "nombreUsuario y password son obligatorios" });
  }

  try {
    // 🔒 1. Encriptamos la contraseña en Node.js ANTES de mandarla a la base de datos
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    // Llamar al procedimiento con la contraseña ya encriptada
    const [results] = await db.query(
      "CALL sp_loginUsuario(?, ?)",
      [nombreUsuario, passwordHash]
    );

    const usuario = results[0][0];

    if (!usuario) {
      return res.status(401).json({ error: "Error de autenticación", detalle: "Usuario o contraseña incorrectos" });
    }

    // 🔒 2. Generamos el Token (Gafete) incluyendo el ROL del usuario (acceso)
    const tokenPayload = {
      nombreUsuario: usuario.nombreUsuario,
      acceso: usuario.acceso 
    };

    const token = jwt.sign(
      tokenPayload, 
      process.env.JWT_SECRET, 
      { expiresIn: '8h' } // El usuario tendrá que volver a loguearse después de 8 horas
    );

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
      token: token // 🔒 Entregamos el token real
    });

  } catch (error) {
    if (error.message.includes('Usuario o contraseña incorrectos')) {
      return res.status(401).json({ error: "Error de autenticación", detalle: "Usuario o contraseña incorrectos" });
    }
    res.status(500).json({ error: "Error interno", detalle: error.message });
  }
});

/**
 * 👥 GET /api/auth/usuarios
 * PROTEGIDA: Solo Encargadas (ENC) pueden ver la lista completa de usuarios
 */
router.get("/usuarios", verificarToken, verificarRol(['ENC']), async (req, res) => {
  try {
    const [usuarios] = await db.query(`
      SELECT nombreUsuario, nombre, apellidoPaterno, apellidoMaterno, acceso
      FROM usuario ORDER BY nombre, apellidoPaterno
    `);
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener usuarios", detalle: error.message });
  }
});

/**
 * ➕ POST /api/auth/usuarios
 * PROTEGIDA: Solo Encargadas (ENC) pueden crear usuarios
 */
router.post("/usuarios", verificarToken, verificarRol(['ENC']), async (req, res) => {
  const { user, passwordPlano, nombre, apellidoPaterno, apellidoMaterno, acceso } = req.body;

  // 1. Validamos todo excepto el apellido materno
  if (!user || !passwordPlano || !nombre || !apellidoPaterno || !acceso) {
    return res.status(400).json({ error: "Campos requeridos", detalle: "Los campos principales son obligatorios" });
  }

  try {
    // 2. Encriptar la contraseña antes de guardarla
    const passwordHash = crypto.createHash('sha256').update(passwordPlano).digest('hex');

    // 3. Pasamos los 6 parámetros. Si apellidoMaterno viene vacío o undefined, mandamos 'N/A'
    await db.query(
      "CALL sp_crearUsuario(?, ?, ?, ?, ?, ?)",
      [
        user, 
        passwordHash, 
        nombre, 
        apellidoPaterno, 
        apellidoMaterno || 'N/A',
        acceso
      ]
    );

    res.status(201).json({
      message: "Usuario creado exitosamente",
      usuario: { 
        nombreUsuario: user, 
        nombre, 
        apellidoPaterno, 
        apellidoMaterno: apellidoMaterno || 'N/A', 
        acceso 
      }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: "Usuario duplicado", detalle: "El nombre de usuario ya existe" });
    if (error.code === 'ER_NO_REFERENCED_ROW') return res.status(400).json({ error: "Acceso inválido", detalle: "El código de acceso no existe" });
    res.status(500).json({ error: "Error al crear usuario", detalle: error.message });
  }
});

/**
 * ✏️ PUT /api/auth/usuarios/:nombreUsuario
 * PROTEGIDA: Solo Encargadas (ENC) pueden editar usuarios
 */
router.put("/usuarios/:nombreUsuario", verificarToken, verificarRol(['ENC']), async (req, res) => {
  const { nombreUsuario } = req.params;
  const { nuevoPasswordPlano, nombre, apellidoPaterno, apellidoMaterno, acceso } = req.body;

  try {
    // 🔒 Si mandan una contraseña nueva, la encriptamos. Si no, mandamos null.
    let passwordHash = null;
    if (nuevoPasswordPlano) {
      passwordHash = crypto.createHash('sha256').update(nuevoPasswordPlano).digest('hex');
    }

    const [results] = await db.query(
      "CALL sp_modificarUsuario(?, ?, ?, ?, ?, ?)",
      [nombreUsuario, passwordHash, nombre, apellidoPaterno, apellidoMaterno, acceso]
    );

    res.json({
      message: "Usuario actualizado exitosamente",
      detalle: results[0]?.[0]?.mensaje || "Cambios aplicados correctamente"
    });
  } catch (error) {
    if (error.message.includes('El usuario no existe')) return res.status(404).json({ error: "No encontrado", detalle: "El usuario no existe" });
    res.status(500).json({ error: "Error al actualizar", detalle: error.message });
  }
});

/**
 * 🗑️ DELETE /api/auth/usuarios/:nombreUsuario
 * PROTEGIDA: Solo Encargadas (ENC) pueden borrar usuarios
 */
router.delete("/usuarios/:nombreUsuario", verificarToken, verificarRol(['ENC']), async (req, res) => {
  const { nombreUsuario } = req.params;
  try {
    const [usuario] = await db.query("SELECT nombreUsuario FROM usuario WHERE nombreUsuario = ?", [nombreUsuario]);
    if (usuario.length === 0) return res.status(404).json({ error: "No encontrado", detalle: "El usuario no existe" });

    await db.query("DELETE FROM usuario WHERE nombreUsuario = ?", [nombreUsuario]);
    res.json({ message: "Usuario eliminado exitosamente", usuarioEliminado: nombreUsuario });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED') return res.status(400).json({ error: "Error", detalle: "El usuario tiene registros asociados" });
    res.status(500).json({ error: "Error al eliminar", detalle: error.message });
  }
});

/**
 * 🔍 GET /api/auth/usuarios/:nombreUsuario
 * PROTEGIDA: Solo Encargadas (ENC)
 */
router.get("/usuarios/:nombreUsuario", verificarToken, verificarRol(['ENC']), async (req, res) => {
  const { nombreUsuario } = req.params;
  try {
    const [usuarios] = await db.query(`SELECT nombreUsuario, nombre, apellidoPaterno, apellidoMaterno, acceso FROM usuario WHERE nombreUsuario = ?`, [nombreUsuario]);
    if (usuarios.length === 0) return res.status(404).json({ error: "No encontrado", detalle: "El usuario no existe" });
    res.json(usuarios[0]);
  } catch (error) {
    res.status(500).json({ error: "Error", detalle: error.message });
  }
});

/**
 * 🎯 GET /api/auth/tipos-acceso
 * PROTEGIDA: Las Encargadas la ocupan para el formulario de crear usuario
 */
router.get("/tipos-acceso", verificarToken, verificarRol(['ENC']), async (req, res) => {
  try {
    const [tiposAcceso] = await db.query(`SELECT codigoAcceso, nombre FROM acceso ORDER BY codigoAcceso`);
    res.json(tiposAcceso);
  } catch (error) {
    res.status(500).json({ error: "Error", detalle: error.message });
  }
});

export default router;