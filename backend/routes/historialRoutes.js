import express from "express";
import db from "../config/db.js";
// 🔒 Importamos el middleware de roles
import { verificarRol } from "../middlewares/authMiddleware.js"; 

const router = express.Router();

/**
 * 📅 GET /api/historial
 * ACCESO: ENC, EMP, CON
 */
router.get("/", verificarRol(['ENC', 'EMP', 'CON']), async (req, res) => {
  const { search, tipo, fechaInicio, fechaFin } = req.query;

  try {
    // 1️⃣ Cambiamos el nombre de la vista a la nueva y unificada
    let query = "SELECT * FROM vw_historialGlobal WHERE 1=1";
    const params = [];

    // 2️⃣ Actualizamos las columnas de búsqueda
    if (search) {
      query += " AND (idReferencia LIKE ? OR accion LIKE ? OR detalle LIKE ? OR nombreUsuario LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    // 3️⃣ Cambiamos 'tipoMovimiento' por 'modulo'
    if (tipo && tipo !== 'Todos') {
      query += " AND modulo = ?";
      params.push(tipo);
    }

    if (fechaInicio && fechaFin) {
      query += " AND fecha BETWEEN ? AND ?";
      params.push(fechaInicio, fechaFin);
    }

    query += " ORDER BY fecha DESC";

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener historial:", error);
    res.status(500).json({ error: "Error al obtener el historial de movimientos" });
  }
});

/**
 * 📊 GET /api/historial/totales
 * ACCESO: ENC, EMP, CON
 */
router.get("/totales", verificarRol(['ENC', 'EMP', 'CON']), async (req, res) => {
  try {
    // Llamamos al SP que limpia los conteos
    const [rows] = await db.query("CALL sp_obtenerTotalesMovimientos()");
    
    // Los resultados de CALL vienen en un array de arrays. 
    // rows[0] contiene el primer conjunto de resultados.
    res.json(rows[0][0] || { totalMovimientos: 0, totalEntradas: 0, totalSalidas: 0 });
  } catch (error) {
    console.error("❌ Error al obtener totales:", error);
    res.status(500).json({ error: "Error al obtener totales de movimientos" });
  }
});

export default router;
