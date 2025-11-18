// routes/clientesRoutes.js
import express from "express";
import db from "../config/db.js";

const router = express.Router();

// GET - Obtener todos los clientes
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT claveCliente, nombreFiscal FROM cliente");
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener clientes:", error);
    res.status(500).json({ error: "Error al obtener clientes" });
  }
});

// POST - Crear nuevo cliente
router.post("/", async (req, res) => {
  try {
    const { nombreFiscal } = req.body;

    // Validación básica
    if (!nombreFiscal) {
      return res.status(400).json({ 
        error: "El nombre fiscal del cliente es requerido",
        detalle: "Debe proporcionar el nombre fiscal para el cliente"
      });
    }

    const query = `
      INSERT INTO cliente (nombreFiscal) 
      VALUES (?)
    `;
    
    const [result] = await db.execute(query, [
      nombreFiscal.trim()
    ]);

    // Obtener el cliente recién creado
    const [newClient] = await db.query(
      "SELECT claveCliente, nombreFiscal FROM cliente WHERE claveCliente = ?",
      [result.insertId]
    );

    res.status(201).json({
      message: "Cliente creado exitosamente",
      claveCliente: result.insertId,
      ...newClient[0]
    });

  } catch (error) {
    console.error("❌ Error al crear cliente:", error);
    
    // Manejar errores específicos de MySQL
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        error: "Cliente duplicado",
        detalle: "Ya existe un cliente con ese nombre fiscal"
      });
    }
    
    res.status(500).json({ 
      error: "Error al crear cliente",
      detalle: error.message 
    });
  }
});

// GET - Obtener cliente por ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await db.query(
      "SELECT claveCliente, nombreFiscal FROM cliente WHERE claveCliente = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("❌ Error al obtener cliente:", error);
    res.status(500).json({ error: "Error al obtener cliente" });
  }
});

// PUT - Actualizar cliente
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombreFiscal } = req.body;

    if (!nombreFiscal) {
      return res.status(400).json({ 
        error: "El nombre fiscal del cliente es requerido"
      });
    }

    const query = `
      UPDATE cliente 
      SET nombreFiscal = ?
      WHERE claveCliente = ?
    `;
    
    const [result] = await db.execute(query, [
      nombreFiscal.trim(),
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json({ message: "Cliente actualizado exitosamente" });
  } catch (error) {
    console.error("❌ Error al actualizar cliente:", error);
    res.status(500).json({ error: "Error al actualizar cliente" });
  }
});

export default router;