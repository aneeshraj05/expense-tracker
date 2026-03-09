import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Aneesh@123',
  database: process.env.DB_NAME || 'expenses',
  waitForConnections: true,
  connectionLimit: 10
});

// Test connection on startup
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ MySQL Database connected!');
    connection.release();
  }
});

export default db;
