import express from "express";
import cors from "cors";
import os from "os";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { verificarToken } from "./middlewares/authMiddleware.js";

import materialRoutes from "./routes/materialRoutes.js";
import categoriasRoutes from "./routes/categoriasRoutes.js";
import ubicacionesRoutes from "./routes/ubicacionesRoutes.js";
import marcasRoutes from "./routes/marcasRoutes.js";
import proveedoresRoutes from "./routes/proveedoresRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import alertasRoutes from "./routes/alertasRoutes.js";
import entradasRoutes from "./routes/entradaRoutes.js";
import notificacionesRoutes from "./routes/notificacionesRoutes.js";
import salidasRoutes from "./routes/salidasRoutes.js";
import historialRoutes from "./routes/historialRoutes.js";
import clienteRoutes from "./routes/clienteRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import authRoutes from "./routes/auth.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/uploads", express.static(uploadsDir));

app.use("/api/auth", authRoutes);

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Servidor de almacén funcionando correctamente",
    timestamp: new Date().toISOString()
  });
});

app.use("/api", verificarToken);
app.use("/api/materiales", materialRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/ubicaciones", ubicacionesRoutes);
app.use("/api/marcas", marcasRoutes);
app.use("/api/proveedores", proveedoresRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/alertas", alertasRoutes);
app.use("/api/entradas", entradasRoutes);
app.use("/api/notificaciones", notificacionesRoutes);
app.use("/api/salidas", salidasRoutes);
app.use("/api/historial", historialRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use(/^\/api\/.*/, (req, res) => {
  res.status(404).json({
    error: "Ruta de API no encontrada",
    detalle: `El endpoint ${req.method} ${req.originalUrl} no existe.`
  });
});

app.use((error, req, res, next) => {
  console.error("Error global:", error);
  res.status(500).json({
    error: "Error interno del servidor",
    detalle: process.env.NODE_ENV === 'development' ? error.message : 'Contacte al administrador'
  });
});

const PORT = process.env.PORT || 3000;

const networkInterfaces = os.networkInterfaces();
const localIP = Object.values(networkInterfaces)
  .flat()
  .find(i => i.family === 'IPv4' && !i.internal)?.address || 'localhost';

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Sistema de Almacén Activo (Backend + Frontend)`);
  console.log(`🏠 Para usar en esta PC:   http://localhost:${PORT}`);
  console.log(`🌐 Para usar en la red:    http://${localIP}:${PORT}`);
  console.log(`\n(La API está disponible internamente en la ruta /api)`);
});