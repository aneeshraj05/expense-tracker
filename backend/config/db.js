import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Create a database connection pool for PostgreSQL
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test the connection immediately
db.connect()
  .then(client => {
    console.log('✅ PostgreSQL Database connected!');
    client.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

export default db;
