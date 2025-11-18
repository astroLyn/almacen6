import express from "express";
import pool from "../config/db.js";

const router = express.Router();


// ✅ Obtener todas las marcas
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT claveMarca AS codigo, nombre FROM marca");
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener marcas:", error);
    res.status(500).json({ message: "Error al obtener marcas" });
  }
});


// ✅ Agregar nueva marca
router.post("/", async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({ message: "Nombre es obligatorio" });
    }

    await pool.query(
      "INSERT INTO marca (nombre) VALUES (?)",
      [nombre]
    );

    res.status(201).json({ message: "Marca agregada correctamente" });
  } catch (error) {
    console.error("❌ Error al agregar marca:", error);
    res.status(500).json({ message: "Error al agregar marca" });
  }
});

export default router;
