const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});
console.log('=== CONFIGURACIÓN DB ===');
console.log('Host:', process.env.DB_HOST);
console.log('User:', process.env.DB_USER);
console.log('Database:', process.env.DB_NAME);
console.log('Port:', process.env.DB_PORT);
console.log('========================');

// Conexión a MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: false,
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true  // ← Agregar esta línea
});

console.log('Intentando conectar a MySQL...');

// ✅ VERSIÓN MEJORADA - No salir del proceso si falla la conexión inicial
db.connect(err => {
  if (err) {
    console.error("❌ Error inicial de conexión:", err.message);
    console.log("⚠️  La aplicación continuará e intentará reconectarse automáticamente");
    // NO usar process.exit(1) - dejar que se recupere
  } else {
    console.log("✅ Conectado a MySQL correctamente!");
  }
});

// ✅ Manejar reconexiones automáticas
db.on('error', (err) => {
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('🔄 Conexión perdida, reconectando...');
  } else {
    console.error('❌ Error de MySQL:', err.message);
  }
});

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Backend funcionando 🚀");
});

// Ruta de health check mejorada
app.get("/api/health", (req, res) => {
  db.query("SELECT 1 as test", (err, results) => {
    if (err) {
      return res.status(500).json({ 
        status: "error", 
        message: "Database error",
        error: err.message 
      });
    }
    res.json({ 
      status: "ok", 
      message: "Backend and database working",
      database: results[0] 
    });
  });
});

// Ruta para probar datos reales
app.get("/api/test-data", (req, res) => {
  db.query("SELECT COUNT(*) as total FROM material", (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ 
      message: "Conexión a datos funcionando",
      total_materiales: results[0].total 
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📍 Test data: http://localhost:${PORT}/api/test-data`);
});
