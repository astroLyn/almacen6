import express from "express";
import pool from "../config/db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [results] = await pool.query("CALL sp_dashboardGeneral();");

    const data = {
      totalesMateriales: results[0]?.[0] || {},
      alertas: results[1]?.[0] || {},
      aprobacionesPendientes: results[2]?.[0] || {},
      movimientosHoy: results[3]?.[0] || {}, // ✅ incluye entradasHoy, salidasHoy y totalHoy
      movimientosSemanales: results[4] || [],
      stockPorCategoria: results[5] || [],
      totalMovimientosHoy: results[6]?.[0] || {},
    };

    res.json(data);
  } catch (error) {
    console.error("Error al obtener datos del dashboard:", error);
    res.status(500).json({ error: "Error al obtener datos del dashboard" });
  }
});

export default router;

