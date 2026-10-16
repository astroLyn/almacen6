import express from "express";
import pool from "../config/db.js";
import { verificarRol } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * 📍 GET /api/ubicaciones
 * ACCESO: ENC, EMP, CON
 */
router.get("/", verificarRol(['ENC', 'EMP', 'CON']), async (req, res) => {
  try {
    // Se consultan los datos necesarios para renderizar los Tags de colores en React
    const [rows] = await pool.query("SELECT codigo, ubicacion, color FROM vw_ubicacionMateriales;");
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener ubicaciones:", error);
    res.status(500).json({ message: "Error al obtener ubicación" });
  }
});

export default router;