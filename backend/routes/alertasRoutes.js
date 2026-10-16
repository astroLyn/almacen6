import express from "express";
import {
  obtenerAlertas,
  marcarAlertaComoVista,
  cerrarAlerta,
} from "../controllers/alertasController.js";
import db from "../config/db.js";
// 🔒 IMPORTANTE: Importamos el middleware de seguridad
import { verificarRol } from "../middlewares/authMiddleware.js"; 

const router = express.Router();

// ✅ Obtener todas las alertas activas o filtradas 
// 🟢 ACCESO: Todos los roles (Encargada, Empleado, Consultante)
router.get("/", verificarRol(['ENC', 'EMP', 'CON']), obtenerAlertas);

// ✅ Consultar solo el promedio general de stock
// 🟢 ACCESO: Todos los roles
router.get("/promedio", verificarRol(['ENC', 'EMP', 'CON']), async (req, res) => {
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
// 🔴 ACCESO ESTRICTO: SÓLO Encargadas ('ENC')
router.put("/:id/vista", verificarRol(['ENC']), marcarAlertaComoVista);

// 📴 Cerrar una alerta manualmente
// 🔴 ACCESO ESTRICTO: SÓLO Encargadas ('ENC')
router.put("/:id/cerrar", verificarRol(['ENC']), cerrarAlerta);

export default router;
