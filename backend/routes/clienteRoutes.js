import express from "express";
import db from "../config/db.js";
import { verificarRol } from "../middlewares/authMiddleware.js"; // 🔒 Seguridad

const router = express.Router();

/**
 * 🔵 GET /api/clientes
 * ACCESO: ENC, EMP, CON (Necesario para catálogos y búsquedas)
 */
router.get("/", verificarRol(['ENC', 'EMP', 'CON']), async (req, res) => {
  try {
    const [rows] = await db.query("SELECT claveCliente, nombreFiscal FROM cliente");
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener clientes:", error);
    res.status(500).json({ error: "Error al obtener clientes" });
  }
});

/**
 * 🟢 POST /api/clientes
 * ACCESO: ENC, EMP
 */
router.post("/", verificarRol(['ENC', 'EMP']), async (req, res) => {
  try {
    const { nombreFiscal } = req.body;

    if (!nombreFiscal) {
      return res.status(400).json({ error: "El nombre fiscal es requerido" });
    }

    const query = `INSERT INTO cliente (nombreFiscal) VALUES (?)`;
    const [result] = await db.execute(query, [nombreFiscal.trim()]);

    // Devolvemos el objeto completo para actualizar el estado en el frontend inmediatamente
    res.status(201).json({
      message: "Cliente creado exitosamente",
      claveCliente: result.insertId,
      nombreFiscal: nombreFiscal.trim()
    });

  } catch (error) {
    console.error("❌ Error al crear cliente:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: "Ya existe un cliente con ese nombre" });
    }
    res.status(500).json({ error: "Error al crear cliente" });
  }
});

/**
 * 🟡 PUT /api/clientes/:id
 * ACCESO: ENC, EMP
 */
router.put("/:id", verificarRol(['ENC', 'EMP']), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombreFiscal } = req.body;

    if (!nombreFiscal) return res.status(400).json({ error: "Nombre requerido" });

    const [result] = await db.execute(
      "UPDATE cliente SET nombreFiscal = ? WHERE claveCliente = ?",
      [nombreFiscal.trim(), id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: "Cliente no encontrado" });

    res.json({ message: "Cliente actualizado exitosamente" });
  } catch (error) {
    console.error("❌ Error al actualizar cliente:", error);
    res.status(500).json({ error: "Error al actualizar cliente" });
  }
});

export default router;