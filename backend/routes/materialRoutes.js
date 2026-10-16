import express from "express";
import pool from "../config/db.js";
import { verificarRol } from "../middlewares/authMiddleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// 🌟 CONFIGURACIÓN DE MULTER PARA GUARDAR IMÁGENES
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.resolve('uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Le damos un nombre único para evitar que fotos con el mismo nombre se sobreescriban
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.get("/", verificarRol(['ENC', 'EMP', 'CON']), async (req, res) => {
  try {
    const { descripcion, categoria, ubicacion, marca } = req.query;

    // 🌟 EL TRUCO: Unimos tu vista (v) con tu tabla original (m) solo para robar la columna 'imagen'
    let query = `
      SELECT 
        v.codigoMaterial,
        v.descripcion,
        v.color,
        v.unidadMedida,
        v.stockActual,
        v.stockMinimo,
        v.stockReservado,
        v.observaciones,
        v.estado,
        v.codigoCategoria,
        v.categoria,
        v.codigoUbicacion,
        v.ubicacion,
        v.codigoMarca,
        v.marca,
        v.codigoProveedor,
        v.proveedor,
        m.imagen
      FROM vw_stockActual v
      LEFT JOIN material m ON v.codigoMaterial = m.codigoMaterial
      WHERE 1=1
    `;
    const params = [];

    // Filtros
    if (descripcion) {
      query += ` AND (v.codigoMaterial LIKE ? OR v.descripcion LIKE ?)`;
      params.push(`%${descripcion}%`, `%${descripcion}%`);
    }
    if (categoria) {
      query += ` AND v.codigoCategoria = ?`;
      params.push(categoria);
    }
    if (ubicacion) {
      query += ` AND v.codigoUbicacion = ?`;
      params.push(ubicacion);
    }
    if (marca) {
      query += ` AND v.codigoMarca = ?`;
      params.push(marca);
    }

    query += ` ORDER BY v.descripcion ASC`;

    const [rows] = await pool.query(query, params);
    res.json(rows); 
    
  } catch (error) {
    console.error("❌ Error al obtener materiales:", error);
    res.status(500).json({ message: "Error al obtener materiales." });
  }
});

// 🌟 NUEVA RUTA: Endpoint exclusivo para subir/actualizar la foto de un material
router.post("/:codigoMaterial/imagen", verificarRol(['ENC', 'EMP']), upload.single('imagen'), async (req, res) => {
  const { codigoMaterial } = req.params;
  let connection;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó ninguna imagen." });
    }

    const nombreImagen = req.file.filename;
    connection = await pool.getConnection();

    // 1. Buscamos si ya tenía una foto antes para borrarla del disco duro y no acumular basura
    const [old] = await connection.query("SELECT imagen FROM material WHERE codigoMaterial = ?", [codigoMaterial]);
    
    // 2. Actualizamos la base de datos con el nombre de la nueva foto
    await connection.query("UPDATE material SET imagen = ? WHERE codigoMaterial = ?", [nombreImagen, codigoMaterial]);
    
    // 3. Borramos el archivo físico viejo (si existía)
    if (old.length > 0 && old[0].imagen) {
      const oldPath = path.resolve('uploads', old[0].imagen);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    res.json({ message: "Imagen actualizada correctamente", imagen: nombreImagen });
  } catch (error) {
    console.error("❌ Error al procesar imagen:", error);
    res.status(500).json({ error: "Error interno al procesar la imagen" });
  } finally {
    if (connection) connection.release();
  }
});

router.post("/", verificarRol(['ENC', 'EMP']), async (req, res) => {
  const { codigoMaterial, descripcion, color, observaciones, unidadMedida, stockActual, codigoInterno, categoria, ubicacion, marca, proveedor, stockMinimo } = req.body;
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [existing] = await connection.query("SELECT estado FROM material WHERE codigoMaterial = ?", [codigoMaterial]);

    if (existing.length > 0) {
      if (existing[0].estado === 'INA') {
        await connection.query(
          "CALL sp_actualizarMaterial(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [codigoMaterial, codigoMaterial, descripcion, color, observaciones, unidadMedida, stockActual, categoria, ubicacion, marca, proveedor, stockMinimo]
        );
        await connection.query("UPDATE material SET estado = 'ACT' WHERE codigoMaterial = ?", [codigoMaterial]);
        await connection.commit();
        return res.status(201).json({ message: "✅ Material reactivado y actualizado correctamente." });
      }
      await connection.rollback();
      return res.status(400).json({ error: "Este código de material ya existe y se encuentra activo." });
    }

    await connection.query(
      "CALL sp_agregarMaterial(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [codigoMaterial, descripcion, color, observaciones, unidadMedida, stockActual, codigoInterno, categoria, ubicacion, marca, proveedor, stockMinimo]
    );
    await connection.commit();
    res.status(201).json({ message: "✅ Material agregado correctamente." });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("❌ Error al agregar material:", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

router.put("/:codigoMaterial", verificarRol(['ENC', 'EMP']), async (req, res) => {
  const { codigoMaterial } = req.params;
  const { nuevoCodigoMaterial, descripcion, color, observaciones, unidadMedida, stockActual, categoria, ubicacion, marca, proveedor, stockMinimo } = req.body;
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.query(
      "CALL sp_actualizarMaterial(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [codigoMaterial, nuevoCodigoMaterial || codigoMaterial, descripcion, color, observaciones, unidadMedida, stockActual, categoria, ubicacion, marca, proveedor, stockMinimo]
    );
    await connection.commit();
    res.json({ message: "✅ Material actualizado correctamente." });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("❌ Error al actualizar material:", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

router.put("/:codigoMaterial/reactivar", verificarRol(['ENC', 'EMP']), async (req, res) => {
  const { codigoMaterial } = req.params;
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.query("UPDATE material SET estado = 'ACT' WHERE codigoMaterial = ?", [codigoMaterial]);
    await connection.commit();
    res.status(200).json({ message: "Material reactivado exitosamente." });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("❌ Error al reactivar material:", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

router.delete("/:codigoMaterial", verificarRol(['ENC']), async (req, res) => {
  const { codigoMaterial } = req.params;
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [movimientos] = await connection.query(
      `SELECT 
        (SELECT COUNT(*) FROM entradaMaterial WHERE codigoMaterial = ?) +
        (SELECT COUNT(*) FROM salidaMaterial WHERE codigoMaterial = ?) AS totalMovimientos`,
      [codigoMaterial, codigoMaterial]
    );

    const totalMovimientos = movimientos[0].totalMovimientos;

    if (totalMovimientos > 0) {
      await connection.query("CALL sp_materialEliminado(?)", [codigoMaterial]);
      await connection.commit();
      return res.status(200).json({ message: "Material marcado como inactivo para proteger el historial." });
    }

    await connection.query("DELETE FROM material WHERE codigoMaterial = ?", [codigoMaterial]);
    await connection.commit();
    res.status(200).json({ message: "Material eliminado permanentemente del sistema." });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("❌ Error al eliminar material:", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

export default router;