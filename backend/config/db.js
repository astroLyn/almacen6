import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

// Conexión con soporte de Promises
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verificar conexión
try {
  const connection = await pool.getConnection();
  console.log("✅ Conexión a la base de datos establecida correctamente.");
  connection.release();
} catch (err) {
  console.error("❌ Error al conectar con la base de datos:", err);
}

export default pool;
