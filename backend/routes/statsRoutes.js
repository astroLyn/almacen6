// backend/routes/statsRoutes.js
import express from "express";
import pool from "../config/db.js"; // ajusta según export en tu db.js

const router = express.Router();

// GET /api/stats/stock-total
router.get("/stock-total", async (req, res) => {
  try {
    const [rows] = await pool.query("CALL sp_contarStockTotal()");
    // rows puede venir como [ [ { stockTotal: 123 } ], ... ] o similar
    const firstResultSet = Array.isArray(rows) ? rows[0] : rows;
    const value = firstResultSet && firstResultSet[0] ? firstResultSet[0].stockTotal : 0;
    res.json({ stockTotal: Number(value) });
  } catch (error) {
    console.error("Error al obtener stock total:", error);
    res.status(500).json({ message: "Error al obtener stock total" });
  }
});

// GET /api/stats/stock-disponible
router.get("/stock-disponible", async (req, res) => {
  try {
    const [rows] = await pool.query("CALL sp_contarStockDisponible()");
    const firstResultSet = Array.isArray(rows) ? rows[0] : rows;
    const value = firstResultSet && firstResultSet[0] ? firstResultSet[0].stockDisponible : 0;
    res.json({ stockDisponible: Number(value) });
  } catch (error) {
    console.error("Error al obtener stock disponible:", error);
    res.status(500).json({ message: "Error al obtener stock disponible" });
  }
});

export default router;
