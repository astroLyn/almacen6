import express from "express";
import pool from "../config/db.js";

const router = express.Router();

// 🟢 Obtener ubicaciones desde la vista
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT codigo, ubicacion, color FROM vw_ubicacionMateriales;");
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener ubicaciones:", error);
    res.status(500).json({ message: "Error al obtener ubicación" });
  }
});

export default router;