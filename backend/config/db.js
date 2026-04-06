import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create a single database connection (not a pool)
const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

console.log('✅ MySQL Database connected!');

export default db;
