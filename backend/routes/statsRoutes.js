import express from "express";
import pool from "../config/db.js";
import { verificarRol } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * 📊 GET /api/stats/stock-total
 * ACCESO: ENC, EMP, CON
 */
router.get("/stock-total", verificarRol(['ENC', 'EMP', 'CON']), async (req, res) => {
  try {
    const [rows] = await pool.query("CALL sp_contarStockTotal()");
    
    // Manejo de la estructura de respuesta de los Stored Procedures
    const firstResultSet = Array.isArray(rows) ? rows[0] : rows;
    const value = firstResultSet && firstResultSet[0] ? firstResultSet[0].stockTotal : 0;
    
    res.json({ stockTotal: Number(value) });
  } catch (error) {
    console.error("❌ Error al obtener stock total:", error);
    res.status(500).json({ message: "Error al obtener stock total" });
  }
});

/**
 * 📊 GET /api/stats/stock-disponible
 * ACCESO: ENC, EMP, CON
 */
router.get("/stock-disponible", verificarRol(['ENC', 'EMP', 'CON']), async (req, res) => {
  try {
    const [rows] = await pool.query("CALL sp_contarStockDisponible()");
    
    const firstResultSet = Array.isArray(rows) ? rows[0] : rows;
    const value = firstResultSet && firstResultSet[0] ? firstResultSet[0].stockDisponible : 0;
    
    res.json({ stockDisponible: Number(value) });
  } catch (error) {
    console.error("❌ Error al obtener stock disponible:", error);
    res.status(500).json({ message: "Error al obtener stock disponible" });
  }
});

export default router;
