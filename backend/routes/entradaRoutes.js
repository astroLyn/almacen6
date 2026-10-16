import express from "express";
import db from "../config/db.js";
import { verificarRol } from "../middlewares/authMiddleware.js"; 

const router = express.Router();

/**
 * 🔍 GET /api/entradas/materiales/buscar
 * PÚBLICO (Interno): Todos los roles pueden buscar materiales
 */
router.get("/materiales/buscar", async (req, res) => {
  // 🌟 1. Ahora extraemos también marca y ubicación desde la petición
  const { search, marca, ubicacion } = req.query;

  try {
    // 🌟 2. Agregamos 'marca' a la consulta (asegúrate de que tu vista vw_stockActual tenga esta columna)
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

    // 🌟 Filtro dinámico de Ubicación (usando el ID)
    if (ubicacion) {
      query += ` AND codigoUbicacion = ?`;
      params.push(ubicacion);
    }

    // 🌟 Filtro dinámico de Marca (usando el ID)
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

/**
 * 📦 POST /api/entradas
 * PROTEGIDO: Solo Empleados y Encargadas pueden registrar entradas
 */
router.post("/", verificarRol(['EMP', 'ENC']), async (req, res) => {
  const { OS, fecha, proveedor, cliente, materiales, notas } = req.body;
  
  // Extraemos quién está haciendo la petición desde el token
  const usuarioAlta = req.usuario.nombreUsuario;
  const rolUsuario = req.usuario.acceso;

  if (!OS || !fecha || !proveedor || !Array.isArray(materiales)) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // 1️⃣ Crear la entrada principal (¡Ahora enviando el usuario desde el inicio!)
    await connection.query("CALL sp_agregarEntrada(?, ?, ?, ?, ?)", [
      OS,
      fecha,
      proveedor,
      cliente || null,
      usuarioAlta // 👈 Aquí pasamos el usuarioSolicita directamente
    ]);

    // 2️⃣ Obtener el ID de la entrada recién creada
    const [[lastEntrada]] = await connection.query("SELECT LAST_INSERT_ID() AS noEntrada");
    const noEntrada = lastEntrada.noEntrada;

    // 3️⃣ Registrar los materiales asociados
    for (const mat of materiales) {
      if (!mat.codigoMaterial || !mat.cantidad) continue;
      await connection.query("CALL sp_registroentradaMaterial(?, ?, ?)", [
        noEntrada,
        mat.codigoMaterial,
        mat.cantidad,
      ]);
    }

    // 🌟 4️⃣ AUTO-APROBACIÓN PARA ENCARGADAS
    if (rolUsuario === 'ENC') {
      await connection.query("CALL sp_aprobarEntrada(?, ?)", [noEntrada, usuarioAlta]);
      await connection.commit();
      return res.status(201).json({ 
        message: "✅ Entrada registrada y aprobada automáticamente", 
        noEntrada,
        estado: 'APR'
      });
    }

    // Si es Empleado (EMP), se queda como Pendiente
    await connection.commit();
    res.status(201).json({ 
      message: "⏳ Entrada registrada correctamente. En espera de aprobación.", 
      noEntrada,
      estado: 'PEN' 
    });

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
 * ⏳ GET /api/entradas/pendientes
 * PROTEGIDO: Solo Encargadas pueden ver las entradas pendientes
 */
router.get("/pendientes", verificarRol(['ENC']), async (req, res) => {
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
        e.usuarioSolicita,
        COUNT(em.codigoMaterial) AS totalMateriales
      FROM entrada e
      LEFT JOIN proveedor p ON e.proveedor = p.claveProveedor
      LEFT JOIN cliente c ON e.cliente = c.claveCliente
      LEFT JOIN entradaMaterial em ON e.noEntrada = em.noEntrada
      WHERE e.estado = 'PEN'
      GROUP BY e.noEntrada
      ORDER BY e.fecha ASC;
    `);
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener entradas pendientes:", error);
    res.status(500).json({ error: "Error al obtener entradas pendientes" });
  }
});

/**
 * 📋 GET /api/entradas/:noEntrada/materiales
 * NUEVO ENDPOINT: Usado por la sub-tabla de React para ver el detalle antes de aprobar
 * PROTEGIDO: Solo Encargadas
 */
router.get("/:noEntrada/materiales", verificarRol(['ENC']), async (req, res) => {
  const { noEntrada } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT 
        em.codigoMaterial, 
        m.descripcion, 
        em.cantidad, 
        m.stockActual
      FROM entradaMaterial em
      INNER JOIN material m ON em.codigoMaterial = m.codigoMaterial
      WHERE em.noEntrada = ?
    `, [noEntrada]);
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al cargar materiales de entrada:", error);
    res.status(500).json({ error: "Error al cargar detalle" });
  }
});

/**
 * ✅ PUT /api/entradas/:noEntrada/aprobar
 * PROTEGIDO: Solo Encargadas
 */
router.put("/:noEntrada/aprobar", verificarRol(['ENC']), async (req, res) => {
  const { noEntrada } = req.params;
  const usuarioAprueba = req.usuario.nombreUsuario;

  try {
    // Usamos el procedimiento almacenado que suma el stock (igual que en salidas)
    await db.query("CALL sp_aprobarEntrada(?, ?)", [noEntrada, usuarioAprueba]);
    res.json({ message: "✅ Entrada aprobada correctamente y stock actualizado" });
  } catch (error) {
    console.error("❌ Error al aprobar entrada:", error);
    res.status(400).json({ error: error.sqlMessage || "Error al aprobar entrada" });
  }
});

/**
 * ❌ PUT /api/entradas/:noEntrada/rechazar
 * PROTEGIDO: Solo Encargadas
 */
router.put("/:noEntrada/rechazar", verificarRol(['ENC']), async (req, res) => {
  const { noEntrada } = req.params;
  const usuarioAprueba = req.usuario.nombreUsuario;

  try {
    const [[entrada]] = await db.query("SELECT estado FROM entrada WHERE noEntrada = ?", [noEntrada]);

    if (!entrada) return res.status(404).json({ error: "Entrada no encontrada" });
    if (entrada.estado !== "PEN") return res.status(400).json({ error: "Solo se pueden rechazar entradas pendientes" });

    // Cambiar estado a 'REC' y registrar quién la rechazó
    await db.query(
      "UPDATE entrada SET estado = 'REC', usuarioAprueba = ?, fechaAprobacion = NOW() WHERE noEntrada = ?",
      [usuarioAprueba, noEntrada]
    );

    // Auditoría
    await db.query("CALL sp_registrarAuditoria(?, 'RECHAZAR', 'ENTRADAS', ?)", [
      usuarioAprueba,
      `Rechazo de Entrada #${noEntrada}. El inventario no se vio afectado.`
    ]);

    res.json({ 
      message: "✅ Entrada rechazada correctamente",
      detalles: "La entrada ha sido marcada como rechazada. No se realizaron cambios en el inventario."
    });
  } catch (error) {
    console.error("❌ Error al rechazar entrada:", error);
    res.status(500).json({ error: "Error al rechazar entrada", detalle: error.message });
  }
});

/**
 * 📑 GET /api/entradas/:noEntrada
 * Detalle completo
 */
router.get("/:noEntrada", async (req, res) => {
  const { noEntrada } = req.params;

  try {
    const [entradaRows] = await db.query(`
      SELECT 
        e.*, p.nombre AS nombreProveedor, c.nombreFiscal AS nombreCliente
      FROM entrada e
      LEFT JOIN proveedor p ON e.proveedor = p.claveProveedor
      LEFT JOIN cliente c ON e.cliente = c.claveCliente
      WHERE e.noEntrada = ?
    `, [noEntrada]);

    if (entradaRows.length === 0) return res.status(404).json({ error: "Entrada no encontrada" });

    const [materialesRows] = await db.query(`
      SELECT 
        em.*, m.descripcion, m.unidadMedida
      FROM entradaMaterial em
      LEFT JOIN material m ON em.codigoMaterial = m.codigoMaterial
      WHERE em.noEntrada = ?
    `, [noEntrada]);

    const entrada = entradaRows[0];
    entrada.materiales = materialesRows;

    res.json(entrada);
  } catch (error) {
    console.error("❌ Error al obtener detalle de entrada:", error);
    res.status(500).json({ error: "Error al obtener detalle de entrada" });
  }
});

/**
 * 📊 GET /api/entradas/historial
 * PÚBLICO (Interno)
 */
router.get("/historial", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        e.noEntrada, e.OS, e.fecha, p.nombre AS proveedor,
        c.nombreFiscal AS cliente, e.estado,
        COUNT(em.codigoMaterial) AS totalMateriales,
        SUM(em.cantidad) AS totalCantidad
      FROM entrada e
      LEFT JOIN proveedor p ON e.proveedor = p.claveProveedor
      LEFT JOIN cliente c ON e.cliente = c.claveCliente
      LEFT JOIN entradaMaterial em ON e.noEntrada = em.noEntrada
      GROUP BY e.noEntrada
      ORDER BY e.fecha DESC, e.noEntrada DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener historial de entradas:", error);
    res.status(500).json({ error: "Error al obtener historial de entradas" });
  }
});

/**
 * 📋 GET /api/entradas
 * Filtros generales
 */
router.get("/", async (req, res) => {
  const { estado, fechaDesde, fechaHasta, proveedor, cliente } = req.query;

  try {
    let query = `
      SELECT 
        e.noEntrada, e.OS, e.fecha, p.nombre AS proveedor,
        c.nombreFiscal AS cliente, e.estado, e.usuarioSolicita, e.usuarioAprueba,
        COUNT(em.codigoMaterial) AS totalMateriales,
        SUM(em.cantidad) AS totalCantidad
      FROM entrada e
      LEFT JOIN proveedor p ON e.proveedor = p.claveProveedor
      LEFT JOIN cliente c ON e.cliente = c.claveCliente
      LEFT JOIN entradaMaterial em ON e.noEntrada = em.noEntrada
      WHERE 1=1
    `;
    const params = [];

    if (estado) { query += " AND e.estado = ?"; params.push(estado); }
    if (fechaDesde) { query += " AND e.fecha >= ?"; params.push(fechaDesde); }
    if (fechaHasta) { query += " AND e.fecha <= ?"; params.push(fechaHasta); }
    if (proveedor) { query += " AND (p.nombre LIKE ? OR e.proveedor = ?)"; params.push(`%${proveedor}%`, proveedor); }
    if (cliente) { query += " AND (c.nombreFiscal LIKE ? OR e.cliente = ?)"; params.push(`%${cliente}%`, cliente); }

    query += " GROUP BY e.noEntrada ORDER BY e.fecha DESC, e.noEntrada DESC";

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener entradas:", error);
    res.status(500).json({ error: "Error al obtener entradas" });
  }
});

export default router;