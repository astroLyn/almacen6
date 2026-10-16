import db from "../config/db.js";

// ✅ Obtener alertas (usando la vista vw_alertaMaterialDetalle)
export const obtenerAlertas = async (req, res) => {
  try {
    const { tipo, estado, visto } = req.query;

    // Base query desde la vista
    let query = `
      SELECT *
      FROM vw_alertaMaterialDetalle
      WHERE 1=1
    `;
    const params = [];

    // Aplicar filtros si vienen en la query
    if (tipo) {
      query += " AND tipoAlerta = ?";
      params.push(tipo);
    }
    if (estado) {
      query += " AND estadoAlerta = ?";
      params.push(estado);
    }
    if (visto !== undefined) {
      query += " AND visto = ?";
      params.push(visto === "true" ? 1 : 0);
    }

    query += " ORDER BY fechaAlerta DESC";

    // Ejecutar la consulta de alertas
    const [alertas] = await db.query(query, params);

    // ✅ Enviar respuesta estructurada para que React la lea como res.data.alertas
    res.json({
      alertas,
    });
  } catch (error) {
    console.error("❌ Error al obtener alertas:", error);
    res.status(500).json({ error: "Error al obtener alertas" });
  }
};

// 👁️ Marcar una alerta como vista
export const marcarAlertaComoVista = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query(
      "UPDATE alertaMaterial SET visto = 1 WHERE idAlerta = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Alerta no encontrada" });
    }

    res.json({ message: "Alerta marcada como vista correctamente" });
  } catch (error) {
    console.error("❌ Error al marcar alerta como vista:", error);
    res.status(500).json({ error: "Error al actualizar alerta" });
  }
};

// 📴 Cerrar alerta manualmente
export const cerrarAlerta = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query(
      "UPDATE alertaMaterial SET estado = 'CERRADA' WHERE idAlerta = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Alerta no encontrada" });
    }

    res.json({ message: "Alerta cerrada correctamente" });
  } catch (error) {
    console.error("❌ Error al cerrar alerta:", error);
    res.status(500).json({ error: "Error al cerrar alerta" });
  }
};