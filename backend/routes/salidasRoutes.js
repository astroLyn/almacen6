import express from "express";
import db from "../config/db.js";
import { verificarRol } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/material/buscar", async (req, res) => {
  // 🌟 1. Extraemos search, marca y ubicacion
  const { search, marca, ubicacion } = req.query;

  try {
    // 🌟 2. Agregamos 'marca' al SELECT
    let query = `
      SELECT 
        codigoMaterial,
        descripcion,
        unidadMedida,
        color,
        stockActual,
        stockMinimo,
        categoria,
        ubicacion,
        marca,
        stockReservado
      FROM vw_stockActual 
      WHERE estado = 'ACT'
    `;
    const params = [];
    
    // Filtro original de texto
    if (search) {
      query += ` AND (codigoMaterial LIKE ? OR descripcion LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // 🌟 3. Filtro dinámico de Ubicación (usando el ID)
    if (ubicacion) {
      query += ` AND codigoUbicacion = ?`;
      params.push(ubicacion);
    }

    // 🌟 4. Filtro dinámico de Marca (usando el ID)
    if (marca) {
      query += ` AND codigoMarca = ?`;
      params.push(marca);
    }

    query += ` ORDER BY descripcion ASC`;
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al buscar materiales:", error);
    res.status(500).json({ error: "Error al buscar materiales" });
  }
});

router.post("/", verificarRol(['EMP', 'ENC']), async (req, res) => {
  const { OS, fecha, cotizacion, cliente, materiales, notas } = req.body;
  
  const usuarioAlta = req.usuario.nombreUsuario;
  const rolUsuario = req.usuario.acceso;

  if (!OS || !fecha || !cliente || !Array.isArray(materiales)) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    await connection.query("CALL sp_agregarSalida(?, ?, ?, ?, ?)", [
      OS || null,
      fecha,
      cotizacion || null,
      cliente,
      usuarioAlta
    ]);

    const [[lastSalida]] = await connection.query("SELECT LAST_INSERT_ID() AS noSalida");
    const noSalida = lastSalida.noSalida;

    for (const mat of materiales) {
      if (!mat.codigoMaterial || !mat.cantidad) continue;
      await connection.query("CALL sp_registrosalidaMaterial(?, ?, ?, ?)", [
        noSalida,
        mat.codigoMaterial,
        mat.cantidad,
        notas || ""
      ]);
    }

    if (rolUsuario === 'ENC') {
      await connection.query("CALL sp_aprobarSalida(?, ?)", [noSalida, usuarioAlta]);
      await connection.commit();
      return res.status(201).json({ 
        message: "✅ Salida registrada y aprobada automáticamente", 
        noSalida,
        estado: 'APR'
      });
    }

    await connection.commit();
    res.status(201).json({ 
      message: "⏳ Salida registrada correctamente. En espera de aprobación.", 
      noSalida,
      estado: 'PEN' 
    });

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

router.get("/pendientes", verificarRol(['ENC']), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        s.noSalida,
        s.OS,
        s.fecha,
        s.cotizacion,
        c.nombreFiscal AS cliente,
        s.estado,
        s.usuarioSolicita,
        COUNT(sm.codigoMaterial) AS totalMateriales
      FROM salida s
      LEFT JOIN cliente c ON s.cliente = c.claveCliente
      LEFT JOIN salidaMaterial sm ON s.noSalida = sm.noSalida
      WHERE s.estado = 'PEN'
      GROUP BY s.noSalida
      ORDER BY s.fecha ASC;
    `);
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener salidas pendientes:", error);
    res.status(500).json({ error: "Error al obtener salidas pendientes" });
  }
});

/**
 * 📋 GET /api/salidas/:noSalida/materiales
 * NUEVO ENDPOINT: Usado por la sub-tabla de React para ver el detalle antes de aprobar
 * PROTEGIDO: Solo Encargadas
 */
router.get("/:noSalida/materiales", verificarRol(['ENC']), async (req, res) => {
  const { noSalida } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT 
        sm.codigoMaterial, 
        m.descripcion, 
        sm.cantidad, 
        m.stockActual
      FROM salidaMaterial sm
      INNER JOIN material m ON sm.codigoMaterial = m.codigoMaterial
      WHERE sm.noSalida = ?
    `, [noSalida]);
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al cargar materiales de salida:", error);
    res.status(500).json({ error: "Error al cargar detalle" });
  }
});

/**
 * ✅ PUT /api/salidas/:noSalida/aprobar
 * PROTEGIDO: Solo Encargadas
 */
router.put("/:noSalida/aprobar", verificarRol(['ENC']), async (req, res) => {
  const { noSalida } = req.params;
  const usuarioAprueba = req.usuario.nombreUsuario; // Quién hizo clic en aprobar

  try {
    // Usamos el nuevo procedimiento almacenado que descuenta el stock
    await db.query("CALL sp_aprobarSalida(?, ?)", [noSalida, usuarioAprueba]);
    res.json({ message: "✅ Salida aprobada correctamente y stock actualizado" });
  } catch (error) {
    console.error("❌ Error al aprobar salida:", error);
    // Si el SP lanza un SIGNAL SQLSTATE '45000', lo atrapamos aquí
    res.status(400).json({ error: error.sqlMessage || "Error al aprobar salida" });
  }
});

/**
 * ❌ PUT /api/salidas/:noSalida/rechazar
 * PROTEGIDO: Solo Encargadas
 */
router.put("/:noSalida/rechazar", verificarRol(['ENC']), async (req, res) => {
  const { noSalida } = req.params;
  const usuarioAprueba = req.usuario.nombreUsuario;

  try {
    const [[salida]] = await db.query("SELECT estado FROM salida WHERE noSalida = ?", [noSalida]);

    if (!salida) return res.status(404).json({ error: "Salida no encontrada" });
    if (salida.estado !== "PEN") return res.status(400).json({ error: "Solo se pueden rechazar salidas pendientes" });

    // Cambiar estado a 'REC' y registrar quién la rechazó
    await db.query(
      "UPDATE salida SET estado = 'REC', usuarioAprueba = ?, fechaAprobacion = NOW() WHERE noSalida = ?",
      [usuarioAprueba, noSalida]
    );

    // Auditoría
    await db.query("CALL sp_registrarAuditoria(?, 'RECHAZAR', 'SALIDAS', ?)", [
      usuarioAprueba,
      `Rechazo de Salida #${noSalida}. El inventario no se vio afectado.`
    ]);

    res.json({ message: "✅ Salida rechazada correctamente" });
  } catch (error) {
    console.error("❌ Error al rechazar salida:", error);
    res.status(500).json({ error: "Error al rechazar salida", detalle: error.message });
  }
});

/**
 * 📊 GET /api/salidas/historial
 * PÚBLICO (Interno)
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

/**
 * 📑 GET /api/salidas/:noSalida
 * Detalle completo (limpio de apartados)
 */
router.get("/:noSalida", async (req, res) => {
  const { noSalida } = req.params;

  try {
    const [salidaRows] = await db.query(`
      SELECT s.*, c.nombreFiscal AS nombreCliente
      FROM salida s
      LEFT JOIN cliente c ON s.cliente = c.claveCliente
      WHERE s.noSalida = ?
    `, [noSalida]);

    if (salidaRows.length === 0) return res.status(404).json({ error: "Salida no encontrada" });

    const [materialesRows] = await db.query(`
      SELECT sm.*, m.descripcion, m.unidadMedida
      FROM salidaMaterial sm
      LEFT JOIN material m ON sm.codigoMaterial = m.codigoMaterial
      WHERE sm.noSalida = ?
    `, [noSalida]);

    const salida = salidaRows[0];
    salida.materiales = materialesRows;

    res.json(salida);
  } catch (error) {
    console.error("❌ Error al obtener detalle de salida:", error);
    res.status(500).json({ error: "Error al obtener detalle de salida" });
  }
});

/**
 * 📋 GET /api/salidas
 * Filtros generales (limpio de apartados)
 */
router.get("/", async (req, res) => {
  const { estado, fechaDesde, fechaHasta, cliente } = req.query;

  try {
    let query = `
      SELECT 
        s.noSalida, s.OS, s.fecha, s.cotizacion,
        c.nombreFiscal AS cliente, s.estado, s.usuarioSolicita, s.usuarioAprueba,
        COUNT(sm.codigoMaterial) AS totalMateriales,
        SUM(sm.cantidad) AS totalCantidad
      FROM salida s
      LEFT JOIN cliente c ON s.cliente = c.claveCliente
      LEFT JOIN salidaMaterial sm ON s.noSalida = sm.noSalida
      WHERE 1=1
    `;
    const params = [];

    if (estado) { query += " AND s.estado = ?"; params.push(estado); }
    if (fechaDesde) { query += " AND s.fecha >= ?"; params.push(fechaDesde); }
    if (fechaHasta) { query += " AND s.fecha <= ?"; params.push(fechaHasta); }
    if (cliente) { query += " AND (c.nombreFiscal LIKE ? OR c.claveCliente = ?)"; params.push(`%${cliente}%`, cliente); }

    query += " GROUP BY s.noSalida ORDER BY s.fecha DESC, s.noSalida DESC";

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener salidas:", error);
    res.status(500).json({ error: "Error al obtener salidas" });
  }
});

export default router;