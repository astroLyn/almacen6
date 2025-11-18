import express from "express";
import db from "../config/db.js";

const router = express.Router();

/**
 * ✅ Buscar materiales usando la vista vw_materiales_activos
 */
router.get("/materiales/buscar", async (req, res) => {
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
 * ✅ Registrar una nueva entrada con materiales
 * Usa los procedimientos sp_agregarEntrada y sp_registroEntradaMaterial.
 */
router.post("/", async (req, res) => {
  const { OS, fecha, proveedor, cliente, materiales, notas } = req.body;

  if (!OS || !fecha || !proveedor || !Array.isArray(materiales)) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // 1️⃣ Crear la entrada principal usando el SP
    await connection.query("CALL sp_agregarEntrada(?, ?, ?, ?)", [
      OS,
      fecha,
      proveedor,
      cliente || null
    ]);

    // 2️⃣ Obtener el ID de la entrada recién creada
    const [[lastEntrada]] = await connection.query(
      "SELECT LAST_INSERT_ID() AS noEntrada"
    );
    const noEntrada = lastEntrada.noEntrada;

    // 3️⃣ Registrar los materiales asociados
    for (const mat of materiales) {
      if (!mat.codigoMaterial || !mat.cantidad) continue;

      await connection.query("CALL sp_registroEntradaMaterial(?, ?, ?)", [
        noEntrada,
        mat.codigoMaterial,
        mat.cantidad,
      ]);
    }

    await connection.commit();
    res.json({ message: "✅ Entrada registrada correctamente", noEntrada });
  } catch (error) {
    await connection.rollback();
    console.error("❌ Error al registrar entrada:", error);
    res.status(500).json({
      error: error.sqlMessage || "Error al registrar entrada de materiales",
    });
  } finally {
    connection.release();
  }
});

/**
 * ✅ Entradas pendientes de aprobación
 * Muestra todas las entradas que están en estado 'PEN'
 */
router.get("/pendientes", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        e.noEntrada,
        e.OS,
        e.fecha,
        p.nombre,
        p.claveProveedor AS proveedorId,
        c.claveCliente AS clienteId,
        c.nombreFiscal,
        e.estado,
        COUNT(em.codigoMaterial) AS totalMateriales
      FROM entrada e
      LEFT JOIN proveedor p ON e.proveedor = p.claveProveedor
      LEFT JOIN cliente c ON e.cliente = c.claveCliente
      LEFT JOIN entradaMaterial em ON e.noEntrada = em.noEntrada
      WHERE e.estado = 'PEN'
      GROUP BY e.noEntrada
      ORDER BY e.fecha DESC;
    `);

    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener entradas pendientes:", error);
    res.status(500).json({ error: "Error al obtener entradas pendientes" });
  }
});

/**
 * ✅ Aprobar una entrada (ejecuta trigger que agrega materiales)
 */
router.put("/:noEntrada/aprobar", async (req, res) => {
  const { noEntrada } = req.params;

  try {
    // Verificar si existe la entrada
    const [[entrada]] = await db.query(
      "SELECT estado FROM entrada WHERE noEntrada = ?",
      [noEntrada]
    );

    if (!entrada) {
      return res.status(404).json({ error: "Entrada no encontrada" });
    }

    if (entrada.estado !== "PEN") {
      return res.status(400).json({
        error: "Solo se pueden aprobar entradas pendientes",
      });
    }

    // Cambiar estado a 'APR' (Aprobada)
    await db.query(
      "UPDATE entrada SET estado = 'APR' WHERE noEntrada = ?",
      [noEntrada]
    );

    res.json({ message: "✅ Entrada aprobada correctamente" });
  } catch (error) {
    console.error("❌ Error al aprobar entrada:", error);
    res.status(500).json({ error: "Error al aprobar entrada" });
  }
});

export default router;