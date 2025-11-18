// routes/materialRoutes.js
import express from "express";
import pool from "../config/db.js";

const router = express.Router();


// 🔵 Obtener materiales (con filtros opcionales)
router.get("/", async (req, res) => {
  try {
    const { descripcion, categoria } = req.query;

    const [rows] = await pool.query(
      "CALL sp_inventario(?, ?)",
      [descripcion || null, categoria || null]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error("❌ Error al obtener materiales:", error);
    res.status(500).json({ message: "Error al obtener materiales." });
  }
});



// 🟢 Crear material
router.post("/", async (req, res) => {
  const {
    codigoMaterial,
    descripcion,
    color,
    observaciones,
    unidadMedida,
    stockActual,
    imagen,
    codigoInterno,
    categoria,
    ubicacion,
    marca,
    proveedor,
    stockMinimo
  } = req.body;

  try {
    await pool.query(
      "CALL sp_agregarMaterial(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        codigoMaterial,
        descripcion,
        color,
        observaciones,
        unidadMedida,
        stockActual,
        imagen,
        codigoInterno,
        categoria,
        ubicacion,
        marca,
        proveedor,
        stockMinimo
      ]
    );
    res.status(201).json({ message: "✅ Material agregado correctamente." });
  } catch (error) {
    console.error("❌ Error al agregar material:", error.message);
    res.status(500).json({ error: error.message });
  }
});


// 🟡 Actualizar material
router.put("/:codigoMaterial", async (req, res) => {
  const { codigoMaterial } = req.params;
  const {
    descripcion,
    color,
    observaciones,
    unidadMedida,
    stockActual,
    imagen,
    categoria,
    ubicacion,
    marca,
    proveedor,
    stockMinimo
  } = req.body;

  try {
    await pool.query(
      "CALL sp_actualizarMaterial(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        codigoMaterial,
        descripcion,
        color,
        observaciones,
        unidadMedida,
        stockActual,
        imagen,
        categoria,
        ubicacion,
        marca,
        proveedor,
        stockMinimo
      ]
    );
    res.json({ message: "✅ Material actualizado correctamente." });
  } catch (error) {
    console.error("❌ Error al actualizar material:", error.message);
    res.status(500).json({ error: error.message });
  }
});


// 🔴 Eliminar material
router.delete("/:codigoMaterial", async (req, res) => {
  const { codigoMaterial } = req.params;

  try {
    await pool.query("CALL sp_materialEliminado(?)", [codigoMaterial]);
    res.json({ message: "🗑️ Material eliminado correctamente." });
  } catch (error) {
    console.error("❌ Error al eliminar material:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
