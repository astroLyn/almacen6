import express from "express";
import pool from "../config/db.js";

const router = express.Router();

// 🟢 Obtener categorías desde la vista
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT codigo, categoria FROM vw_materialesCategorias");
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener categorías:", error);
    res.status(500).json({ message: "Error al obtener categorías" });
  }
});

export default router;
