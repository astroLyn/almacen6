// routes/materialApartadoRoutes.js
import express from "express";
import db from "../config/db.js";

const router = express.Router();

/**
 * POST /api/material-apartado
 * Crear un nuevo material apartado
 */
router.post("/", async (req, res) => {
  const { OS, fecha, cotizacion, cliente, estado } = req.body;

  try {
    console.log("📥 Datos recibidos para crear apartado:", req.body);

    const [result] = await db.query(
      "CALL sp_crearMaterialApartado(?, ?, ?, ?, ?)",
      [OS, fecha, cotizacion, cliente, estado || 'ACT']
    );

    console.log("📋 Resultado del procedimiento almacenado:", result);

    // Diferentes formas de obtener el noApartado según la estructura del resultado
    let noApartado;
    
    // Intentar obtener el noApartado de diferentes formas posibles
    if (result && result[0] && result[0][0]) {
      // Si el procedimiento devuelve un resultado en el primer conjunto
      noApartado = result[0][0].noApartado || result[0][0].LAST_INSERT_ID || result[0][0].id;
    } else if (result && result[0]) {
      // Si el procedimiento devuelve directamente el valor
      noApartado = result[0].noApartado;
    }

    // Si aún no tenemos el noApartado, intentar obtener el último insertado
    if (!noApartado) {
      console.log("🔄 No se obtuvo noApartado del procedimiento, buscando último insertado...");
      try {
        const [lastInsert] = await db.query("SELECT LAST_INSERT_ID() as noApartado");
        noApartado = lastInsert[0]?.noApartado;
        console.log("📌 Último ID insertado:", noApartado);
      } catch (lastInsertError) {
        console.error("❌ Error al obtener último ID:", lastInsertError);
      }
    }

    // Si aún no tenemos noApartado, buscar el máximo noApartado en la tabla
    if (!noApartado) {
      console.log("🔄 Buscando máximo noApartado en la tabla...");
      try {
        const [maxResult] = await db.query("SELECT MAX(noApartado) as noApartado FROM materialApartado");
        noApartado = maxResult[0]?.noApartado;
        console.log("📌 Máximo noApartado encontrado:", noApartado);
      } catch (maxError) {
        console.error("❌ Error al obtener máximo noApartado:", maxError);
      }
    }

    if (!noApartado) {
      console.error("❌ No se pudo obtener el número de apartado de ninguna forma");
      return res.status(500).json({ 
        error: "Error al crear material apartado",
        detalle: "No se pudo obtener el número de apartado generado"
      });
    }

    console.log("✅ Apartado creado exitosamente, noApartado:", noApartado);

    res.status(201).json({
      message: "Material apartado creado exitosamente",
      noApartado: noApartado
    });
  } catch (error) {
    console.error("❌ Error al crear material apartado:", error);
    res.status(500).json({ 
      error: "Error al crear material apartado",
      detalle: error.message 
    });
  }
});

/**
 * POST /api/material-apartado/:id/materiales
 * Agregar material a un apartado existente
 */
router.post("/:id/materiales", async (req, res) => {
  const { id } = req.params;
  const { codigoMaterial, cantidad, observaciones, alerta } = req.body;

  try {
    console.log("📥 Agregando material al apartado:", { id, codigoMaterial, cantidad });

    await db.query(
      "CALL sp_agregarDetalleApartado(?, ?, ?, ?, ?)",
      [codigoMaterial, id, cantidad, observaciones, alerta || false]
    );

    console.log("✅ Material agregado exitosamente al apartado:", id);

    res.status(201).json({
      message: "Material agregado al apartado exitosamente"
    });
  } catch (error) {
    console.error("❌ Error al agregar material al apartado:", error);
    
    // Manejar errores específicos del procedimiento almacenado
    let statusCode = 500;
    let errorMessage = error.message;

    if (error.message.includes('El número de apartado no existe')) {
      statusCode = 404;
    } else if (error.message.includes('El código de material no existe')) {
      statusCode = 404;
    } else if (error.message.includes('La cantidad debe ser mayor a 0') || 
               error.message.includes('Stock insuficiente')) {
      statusCode = 400;
    }

    res.status(statusCode).json({ 
      error: "Error al agregar material al apartado",
      detalle: errorMessage 
    });
  }
});

/**
 * POST /api/material-apartado/:id/generar-salida
 * Generar salida usando el procedimiento almacenado
 */
router.post("/:id/generar-salida", async (req, res) => {
  const { id } = req.params;

  try {
    console.log("📤 Generando salida para apartado:", id);

    // Llamar al procedimiento almacenado
    const [result] = await db.query(
      "CALL GenerarSalidaDesdeApartado(?)",
      [id]
    );

    console.log("📋 Resultado de generar salida:", result);

    // El procedimiento devuelve el número de salida generado
    const noSalida = result[0]?.[0]?.noSalidaGenerada;

    if (!noSalida) {
      console.error("❌ No se pudo obtener el número de salida generado");
      return res.status(500).json({
        error: "Error al generar salida",
        detalle: "No se pudo obtener el número de salida generado"
      });
    }

    console.log("✅ Salida generada exitosamente:", noSalida);

    res.json({
      message: "Salida generada exitosamente",
      noSalida: noSalida
    });
  } catch (error) {
    console.error("❌ Error al generar salida:", error);
    
    // Manejar errores específicos del procedimiento almacenado
    let statusCode = 500;
    let errorMessage = error.message;

    if (error.message.includes('no existe')) {
      statusCode = 404;
    } else if (error.message.includes('no está activo') || 
               error.message.includes('ya se generó') || 
               error.message.includes('no tiene materiales') ||
               error.message.includes('Stock reservado insuficiente') ||
               error.message.includes('Material no encontrado')) {
      statusCode = 400;
    }

    res.status(statusCode).json({ 
      error: "Error al generar salida",
      detalle: errorMessage 
    });
  }
});

/**
 * GET /api/material-apartado
 * Obtener todos los materiales apartados
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        ma.noApartado,
        ma.OS,
        ma.fecha,
        ma.cotizacion,
        ma.cliente,
        c.nombreFiscal AS nombreCliente,
        ma.estado,
        ma.darSalida,
        COUNT(am.codigoMaterial) AS totalMateriales,
        SUM(am.cantidad) AS totalCantidad
      FROM materialApartado ma
      LEFT JOIN apartadoMaterial am ON ma.noApartado = am.noApartado
      LEFT JOIN cliente c ON ma.cliente = c.claveCliente
      GROUP BY ma.noApartado
      ORDER BY ma.fecha DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener materiales apartados:", error);
    res.status(500).json({ error: "Error al obtener materiales apartados" });
  }
});

/**
 * GET /api/material-apartado/:id
 * Obtener un material apartado específico con sus detalles
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener encabezado del apartado
    const [apartadoRows] = await db.query(`
      SELECT 
        ma.*,
        c.nombreFiscal AS nombreCliente,
        e.nombre AS nombreEstado
      FROM materialApartado ma
      LEFT JOIN cliente c ON ma.cliente = c.claveCliente
      LEFT JOIN estado e ON ma.estado = e.codigoEstado
      WHERE ma.noApartado = ?
    `, [id]);

    if (apartadoRows.length === 0) {
      return res.status(404).json({ error: "Material apartado no encontrado" });
    }

    // Obtener materiales del apartado
    const [materialesRows] = await db.query(`
      SELECT 
        am.*,
        m.descripcion,
        m.unidadMedida,
        m.stockActual,
        m.stockReservado
      FROM apartadoMaterial am
      LEFT JOIN material m ON am.codigoMaterial = m.codigoMaterial
      WHERE am.noApartado = ?
    `, [id]);

    const apartado = apartadoRows[0];
    apartado.materiales = materialesRows;

    res.json(apartado);
  } catch (error) {
    console.error("❌ Error al obtener material apartado:", error);
    res.status(500).json({ error: "Error al obtener material apartado" });
  }
});

/**
 * GET /api/material-apartado/:id/salida-generada
 * Verificar si se generó la salida para este apartado
 */
router.get("/:id/salida-generada", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(`
      SELECT 
        s.noSalida,
        s.fecha,
        s.estado,
        COUNT(sm.codigoMaterial) AS totalMateriales
      FROM salida s
      LEFT JOIN salidaMaterial sm ON s.noSalida = sm.noSalida
      WHERE s.materialApartado = ?
      GROUP BY s.noSalida
    `, [id]);

    res.json(rows);
  } catch (error) {
    console.error("❌ Error al verificar salida generada:", error);
    res.status(500).json({ error: "Error al verificar salida generada" });
  }
});

/**
 * PUT /api/material-apartado/:id/estado
 * Actualizar el estado de un material apartado
 */
router.put("/:id/estado", async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    const [result] = await db.query(
      "UPDATE materialApartado SET estado = ? WHERE noApartado = ?",
      [estado, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Material apartado no encontrado" });
    }

    res.json({ message: "Estado actualizado correctamente" });
  } catch (error) {
    console.error("❌ Error al actualizar estado:", error);
    res.status(500).json({ error: "Error al actualizar estado" });
  }
});

/**
 * DELETE /api/material-apartado/:id/materiales/:codigoMaterial
 * Eliminar un material de un apartado usando el procedimiento almacenado
 */
router.delete("/:id/materiales/:codigoMaterial", async (req, res) => {
  const { id, codigoMaterial } = req.params;

  try {
    console.log("🗑️ Eliminando material del apartado:", { id, codigoMaterial });

    // Llamar al procedimiento almacenado para eliminar el detalle
    await db.query(
      "CALL sp_eliminarDetalleApartado(?, ?)",
      [codigoMaterial, id]
    );

    console.log("✅ Material eliminado exitosamente");

    res.json({ message: "Material eliminado del apartado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar material del apartado:", error);
    
    // Manejar errores específicos del procedimiento almacenado
    let statusCode = 500;
    let errorMessage = error.message;

    if (error.message.includes('no existe') || 
        error.message.includes('El detalle de apartado no existe')) {
      statusCode = 404;
    } else if (error.message.includes('El stock reservado es menor')) {
      statusCode = 400;
    }

    res.status(statusCode).json({ 
      error: "Error al eliminar material del apartado",
      detalle: errorMessage 
    });
  }
});

export default router;