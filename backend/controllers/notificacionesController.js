// controllers/notificacionesController.js
import db from "../config/db.js";

export const obtenerNotificaciones = async (req, res) => {
  try {
    // Consulta para alertas activas
    const [alertasRows] = await db.query(`
      SELECT COUNT(*) AS alertas
      FROM vw_alertaMaterialDetalle
      WHERE estadoAlerta = 'ACTIVA'
    `);
    const alertas = alertasRows[0]?.alertas || 0;

    // Consulta para entradas pendientes
    const [entradaRows] = await db.query(`
      SELECT COUNT(*) AS entrada
      FROM entrada
      WHERE estado = 'PEN'
    `);
    const entrada = entradaRows[0]?.entrada || 0;

    // Consulta para salidas pendientes
    const [salidaRows] = await db.query(`
      SELECT COUNT(*) AS salida
      FROM salida
      WHERE estado = 'PEN'
    `);
    const salida = salidaRows[0]?.salida || 0;

    res.json({ 
      alertas: Number(alertas), 
      entrada: Number(entrada), 
      salida: Number(salida) 
    });
  } catch (error) {
    console.error("❌ Error al obtener notificaciones:", error);
    res.status(500).json({ error: "Error al obtener notificaciones" });
  }
};