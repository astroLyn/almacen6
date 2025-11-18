import express from "express";
import db from "../config/db.js"; // tu conexión MySQL

const router = express.Router();

/**
 * GET /historial
 * Filtra movimientos por código, descripción, tipo y rango de fechas
 */
// En tu backend (routes/historial.js)
router.get("/", async (req, res) => {
  const { codigo, descripcion, tipo, fechaInicio, fechaFin } = req.query;

  try {
    let query = "SELECT * FROM vw_historialMovimientos WHERE 1=1";
    const params = [];

    if (codigo || descripcion) {
      const searchTerm = codigo || descripcion;
      query += " AND (codigoMaterial LIKE ? OR descripcion LIKE ?)";
      params.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }

    if (tipo) {
      query += " AND tipoMovimiento = ?";
      params.push(tipo);
    }

    if (fechaInicio && fechaFin) {
      query += " AND fecha BETWEEN ? AND ?";
      params.push(fechaInicio, fechaFin);
    }

    query += " ORDER BY fecha DESC";

    console.log("📝 Query final:", query);
    console.log("🔢 Parámetros:", params);

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({ error: "Error al obtener el historial de movimientos" });
  }
});

/**
 * GET /historial/totales
 * Llama al procedimiento almacenado sp_obtenerTotalesMovimientos()
 */
router.get("/totales", async (req, res) => {
  try {
    const [rows] = await db.query("CALL sp_obtenerTotalesMovimientos()");
    // El resultado de un CALL viene anidado, así que tomamos la primera parte
    res.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener totales:", error);
    res.status(500).json({ error: "Error al obtener totales de movimientos" });
  }
});

export default router;
