import express from "express";
import pool from "../config/db.js";
import { verificarRol } from "../middlewares/authMiddleware.js"; // 🔒 Seguridad

const router = express.Router();

/**
 * 🔵 GET /api/proveedores
 * ACCESO: ENC, EMP, CON
 */
router.get("/", verificarRol(['ENC', 'EMP', 'CON']), async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT claveProveedor AS codigo, nombre FROM proveedor");
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener proveedores:", error);
    res.status(500).json({ message: "Error al obtener proveedores" });
  }
});

/**
 * 🟢 POST /api/proveedores
 * ACCESO: ENC, EMP
 */
router.post("/", verificarRol(['ENC', 'EMP']), async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({ message: "El nombre del proveedor es obligatorio" });
    }

    const [result] = await pool.query(
      "INSERT INTO proveedor (nombre) VALUES (?)",
      [nombre.trim()]
    );

    // 💡 IMPORTANTE: Devolvemos el objeto completo para que React lo seleccione de inmediato
    res.status(201).json({ 
      message: "Proveedor agregado correctamente",
      codigo: result.insertId,
      nombre: nombre.trim()
    });
  } catch (error) {
    console.error("❌ Error al agregar proveedor:", error);
    res.status(500).json({ message: "Error al agregar proveedor" });
  }
});

export default router;