import express from "express";
import db from "../config/db.js"; // Unificamos a 'db' para consistencia
import { verificarRol } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * 🟢 GET /api/categorias
 * ACCESO: ENC, EMP, CON
 */
router.get("/", verificarRol(['ENC', 'EMP', 'CON']), async (req, res) => {
  try {
    const [rows] = await db.query("SELECT codigo, categoria FROM vw_materialesCategorias");
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener categorías:", error);
    res.status(500).json({ message: "Error al obtener categorías" });
  }
});

export default router;
