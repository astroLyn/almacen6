import express from "express";
import db from "../config/db.js";

const router = express.Router();

/**
 * ✅ Buscar materiales disponibles usando la vista vw_materiales_activos
 * (Misma lógica, útil para seleccionar materiales antes de registrar una salida)
 */
router.get("/material/buscar", async (req, res) => {
  const { search } = req.query;

  try {
    let query = `
      SELECT 
        codigoMaterial,
        descripcion,
        unidadMedida,
        color,
        stockActual,
        stockMinimo,
        ubicacion,
        stockReservado
      FROM vw_materiales_activos
      WHERE 1=1
    `;
    const params = [];
    if (search) {
      query += ` AND (
        codigoMaterial LIKE ? 
        OR descripcion LIKE ?
      )`;
      params.push(`%${search}%`, `%${search}%`);
    }
    query += ` ORDER BY descripcion ASC`;
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al buscar materiales:", error);
    res.status(500).json({ error: "Error al buscar materiales" });
  }
});

/**
 * ✅ Registrar una nueva salida con materiales
 * Usa los procedimientos sp_agregarSalida y sp_registroSalidaMaterial.
 */
router.post("/", async (req, res) => {
  const { OS, fecha, cotizacion, cliente, materialApartado, materiales, notas } = req.body;

  if (!OS || !fecha || !cliente || !Array.isArray(materiales)) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // 1️⃣ Crear la salida principal usando el SP
    await connection.query("CALL sp_agregarSalida(?, ?, ?, ?, ?)", [
      OS,
      fecha,
      cotizacion || null,
      materialApartado || null,
      cliente
    ]);

    // 2️⃣ Obtener el ID de la salida recién creada
    const [[lastSalida]] = await connection.query(
      "SELECT LAST_INSERT_ID() AS noSalida"
    );
    const noSalida = lastSalida.noSalida;

    // 3️⃣ Registrar los materiales asociados
    for (const mat of materiales) {
      if (!mat.codigoMaterial || !mat.cantidad) continue;

      await connection.query("CALL sp_registroSalidaMaterial(?, ?, ?, ?)", [
        noSalida,
        mat.codigoMaterial,
        mat.cantidad,
        notas || ""
      ]);
    }

    await connection.commit();
    res.json({ message: "✅ Salida registrada correctamente", noSalida });
  } catch (error) {
    await connection.rollback();
    console.error("❌ Error al registrar salida:", error);
    res.status(500).json({
      error: error.sqlMessage || "Error al registrar salida de materiales",
    });
  } finally {
    connection.release();
  }
});

/**
 * ✅ Salidas pendientes de aprobación
 * Muestra todas las salidas que están en estado 'PEN'
 */
router.get("/pendientes", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        s.noSalida,
        s.OS,
        s.fecha,
        s.cotizacion,
        c.nombreFiscal AS cliente,
        s.estado,
        COUNT(sm.codigoMaterial) AS totalMateriales
      FROM salida s
      LEFT JOIN cliente c ON s.cliente = c.claveCliente
      LEFT JOIN salidaMaterial sm ON s.noSalida = sm.noSalida
      WHERE s.estado = 'PEN'
      GROUP BY s.noSalida
      ORDER BY s.fecha DESC;
    `);

    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener salidas pendientes:", error);
    res.status(500).json({ error: "Error al obtener salidas pendientes" });
  }
});

/**
 * ✅ Aprobar una salida (puede ejecutar trigger para actualizar stock)
 */
router.put("/:noSalida/aprobar", async (req, res) => {
  const { noSalida } = req.params;

  try {
    // Verificar si existe la salida
    const [[salida]] = await db.query(
      "SELECT estado FROM salida WHERE noSalida = ?",
      [noSalida]
    );

    if (!salida) {
      return res.status(404).json({ error: "Salida no encontrada" });
    }

    if (salida.estado !== "PEN") {
      return res.status(400).json({
        error: "Solo se pueden aprobar salidas pendientes",
      });
    }

    // Cambiar estado a 'APR' (Aprobada)
    await db.query(
      "UPDATE salida SET estado = 'APR' WHERE noSalida = ?",
      [noSalida]
    );

    res.json({ message: "✅ Salida aprobada correctamente" });
  } catch (error) {
    console.error("❌ Error al aprobar salida:", error);
    res.status(500).json({ error: "Error al aprobar salida" });
  }
});

/**
 * ✅ Consultar historial de salidas (usa la vista vw_historialSalidas)
 */
router.get("/historial", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM vw_historialSalidas");
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener historial de salidas:", error);
    res.status(500).json({ error: "Error al obtener historial de salidas" });
  }
});

export default router;
