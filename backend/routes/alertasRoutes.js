import express from "express";
import {
  obtenerAlertas,
  marcarAlertaComoVista,
  cerrarAlerta,
} from "../controllers/alertasController.js";
import db from "../config/db.js";

const router = express.Router();

// ✅ Obtener todas las alertas activas o filtradas + promedio general
router.get("/", obtenerAlertas);

// ✅ Consultar solo el promedio general de stock
router.get("/promedio", async (req, res) => {
  try {
    const [rows] = await db.query("CALL sp_promedioGeneralStock()");
    
    // Manejar la estructura compleja de respuesta del procedimiento almacenado
    const firstResultSet = Array.isArray(rows) ? rows[0] : rows;
    const value = firstResultSet && firstResultSet[0] ? firstResultSet[0].promedioGeneralStock : 0;

    res.json({ promedioGeneralStock: Number(value) });
  } catch (error) {
    console.error("❌ Error al obtener promedio general:", error);
    res.status(500).json({ error: "Error al obtener promedio general de stock" });
  }
});

// 👁️ Marcar una alerta como vista
router.put("/:id/vista", marcarAlertaComoVista);

// 📴 Cerrar una alerta manualmente
router.put("/:id/cerrar", cerrarAlerta);

export default router;
