import express from "express";
import pool from "../config/db.js";
// 🔒 Importamos la protección de roles
import { verificarRol } from "../middlewares/authMiddleware.js"; 

const router = express.Router();

router.get("/", verificarRol(['ENC', 'EMP', 'CON']), async (req, res) => {
  try {
    // Ejecutamos el procedimiento
    const [results] = await pool.query("CALL sp_dashboardGeneral();");

    // Mapeo exacto de los 7 conjuntos de resultados que devuelve el SP
    const data = {
      totalesMateriales: results[0]?.[0] || {},
      alertas: results[1]?.[0] || {},
      aprobacionesPendientes: results[2]?.[0] || {},
      movimientosHoy: results[3]?.[0] || {}, 
      movimientosSemanales: results[4] || [],
      stockPorCategoria: results[5] || [],
      totalMovimientosHoy: results[6]?.[0] || {},
    };

    res.json(data);
  } catch (error) {
    console.error("❌ Error al obtener datos del dashboard:", error);
    res.status(500).json({ error: "Error al obtener datos del dashboard" });
  }
});

export default router;