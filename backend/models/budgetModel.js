const pool = require('../config/db');

class BudgetModel {
  static async ensureTable() {
    await pool.query(`
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
  }

  static async findByUserAndMonth(userId, month) {
    await this.ensureTable();
    const [rows] = await pool.query(
      'SELECT * FROM budgets WHERE user_id = ? AND month = ?',
      [userId, month]
    );
    return rows[0] || null;
  }

  static async upsert(userId, month, amount) {
    await this.ensureTable();
    await pool.query(
      `INSERT INTO budgets (user_id, month, amount) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE amount = ?`,
      [userId, month, amount, amount]
    );
    return await this.findByUserAndMonth(userId, month);
  }

  static async getAllByUser(userId) {
    await this.ensureTable();
    const [rows] = await pool.query(
      'SELECT * FROM budgets WHERE user_id = ? ORDER BY month DESC',
      [userId]
    );
    return rows;
  }
}

module.exports = BudgetModel;
