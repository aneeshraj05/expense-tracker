const pool = require('./config/db');

async function initDB() {
  try {
    console.log('Initializing database tables...');
    
    // Users table (ensure password VARCHAR is large enough for bcrypt)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50),
        email VARCHAR(50) UNIQUE,
        password VARCHAR(255)
      )
    `);
    console.log('✅ Users table ready');

    // Expenses table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(50),
        amount DECIMAL(10,2),
        category VARCHAR(30),
        expense_date DATE,
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id INT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('✅ Expenses table ready');

    // Budgets table (just in case)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        month VARCHAR(7) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE KEY unique_user_month (user_id, month)
      )
    `);
    console.log('✅ Budgets table ready');

    process.exit(0);
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
    process.exit(1);
  }
}

initDB();
