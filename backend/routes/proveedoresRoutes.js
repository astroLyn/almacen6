import express from "express";
import pool from "../config/db.js";

const router = express.Router();


// ✅ Obtener todos los proveedores
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT claveProveedor AS codigo, nombre FROM proveedor");
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener proveedores:", error);
    res.status(500).json({ message: "Error al obtener proveedores" });
  }
});


// ✅ Agregar nuevo proveedor
router.post("/", async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({ message: "Nombre es obligatorio" });
    }

    await pool.query(
      "INSERT INTO proveedor (nombre) VALUES (?)",
      [nombre]
    );

    res.status(201).json({ message: "Proveedor agregado correctamente" });
  } catch (error) {
    console.error("❌ Error al agregar proveedor:", error);
    res.status(500).json({ message: "Error al agregar proveedor" });
  }
});

export default router;
