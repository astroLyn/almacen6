import express from "express";
import db from "../config/db.js"; // Unificado a db
import { verificarRol } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * 🔵 GET /api/marcas
 * ACCESO: ENC, EMP, CON
 */
router.get("/", verificarRol(['ENC', 'EMP', 'CON']), async (req, res) => {
  try {
    const [rows] = await db.query("SELECT claveMarca AS codigo, nombre FROM marca");
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener marcas:", error);
    res.status(500).json({ message: "Error al obtener marcas" });
  }
});

/**
 * 🟢 POST /api/marcas
 * ACCESO: ENC, EMP
 */
router.post("/", verificarRol(['ENC', 'EMP']), async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({ message: "Nombre es obligatorio" });
    }

    const [result] = await db.query(
      "INSERT INTO marca (nombre) VALUES (?)",
      [nombre.trim()]
    );

    // 💡 IMPORTANTE: Devolvemos el objeto con el nuevo ID para el frontend
    res.status(201).json({ 
      message: "Marca agregada correctamente",
      codigo: result.insertId,
      nombre: nombre.trim()
    });
  } catch (error) {
    console.error("❌ Error al agregar marca:", error);
    res.status(500).json({ message: "Error al agregar marca" });
  }
});

export default router;