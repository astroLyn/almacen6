import express from "express";
import cors from "cors";
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
import materialesApartados from "./routes/materialesApartados.js";
import clienteRoutes from "./routes/clienteRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import authRoutes from "./routes/auth.js";

const app = express();
app.use(cors());
app.use(express.json());

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Prefijo general para los endpoints
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
app.use("/api/material-apartado", materialesApartados);
app.use("/api/clientes", clienteRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/auth", authRoutes);

// Ruta de salud para verificar que el servidor funciona
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Servidor de almacén funcionando correctamente",
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: "/api/auth",
      materiales: "/api/materiales",
      categorias: "/api/categorias",
      ubicaciones: "/api/ubicaciones",
      marcas: "/api/marcas",
      proveedores: "/api/proveedores",
      stats: "/api/stats",
      alertas: "/api/alertas",
      entradas: "/api/entradas",
      notificaciones: "/api/notificaciones",
      salidas: "/api/salidas",
      historial: "/api/historial",
      "material-apartado": "/api/material-apartado",
      clientes: "/api/clientes",
      dashboard: "/api/dashboard"
    }
  });
});

// Ruta raíz
app.get("/", (req, res) => {
  res.json({
    message: "API del Sistema de Almacén",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      dashboard: "/api/dashboard"
    },
    documentation: "Consulte /api/health para más información"
  });
});

// Manejo de rutas no encontradas - FORMA CORRECTA
app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    detalle: `La ruta ${req.method} ${req.originalUrl} no existe en este servidor`,
    sugerencia: "Verifique la URL o consulte /api/health para ver los endpoints disponibles"
  });
});

// Manejo global de errores
app.use((error, req, res, next) => {
  console.error("💥 Error global:", error);
  res.status(500).json({
    error: "Error interno del servidor",
    detalle: process.env.NODE_ENV === 'development' ? error.message : 'Contacte al administrador'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Endpoints disponibles:`);
  console.log(`   🔐 Auth:              http://localhost:${PORT}/api/auth`);
  console.log(`   📦 Materiales:        http://localhost:${PORT}/api/materiales`);
  console.log(`   📈 Dashboard:         http://localhost:${PORT}/api/dashboard`);
  console.log(`   🏢 Clientes:          http://localhost:${PORT}/api/clientes`);
  console.log(`   📍 Ubicaciones:       http://localhost:${PORT}/api/ubicaciones`);
  console.log(`   🏷️  Categorías:        http://localhost:${PORT}/api/categorias`);
  console.log(`   🔖 Marcas:            http://localhost:${PORT}/api/marcas`);
  console.log(`   🏭 Proveedores:       http://localhost:${PORT}/api/proveedores`);
  console.log(`   📊 Stats:             http://localhost:${PORT}/api/stats`);
  console.log(`   ⚠️  Alertas:           http://localhost:${PORT}/api/alertas`);
  console.log(`   📥 Entradas:          http://localhost:${PORT}/api/entradas`);
  console.log(`   🔔 Notificaciones:    http://localhost:${PORT}/api/notificaciones`);
  console.log(`   📤 Salidas:           http://localhost:${PORT}/api/salidas`);
  console.log(`   📋 Historial:         http://localhost:${PORT}/api/historial`);
  console.log(`   🛒 Material-Apartado: http://localhost:${PORT}/api/material-apartado`);
  console.log(`   ❓ Health:            http://localhost:${PORT}/api/health`);
  console.log(`   🏠 Raíz:              http://localhost:${PORT}/`);
});