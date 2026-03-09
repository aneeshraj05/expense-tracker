const pool = require('../config/db');

class ExpenseModel {
  static async findAllByUser(userId, filters = {}) {
    let query = `
      SELECT id, title, amount, category, expense_date, created
      FROM expenses
      WHERE user_id = ?
    `;
    const params = [userId];

    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.month) {
      query += ' AND MONTH(expense_date) = ? AND YEAR(expense_date) = ?';
      const [year, month] = filters.month.split('-');
      params.push(parseInt(month), parseInt(year));
    }

    if (filters.startDate && filters.endDate) {
      query += ' AND expense_date BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    if (filters.search) {
      query += ' AND (title LIKE ? OR category LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY expense_date DESC, created DESC';

    // Get total count for pagination
    const countQuery = query.replace(
      'SELECT id, title, amount, category, expense_date, created',
      'SELECT COUNT(*) as total'
    ).replace(' ORDER BY expense_date DESC, created DESC', '');
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Apply pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    return { expenses: rows, total, page, limit };
  }

  static async findById(id, userId) {
    const [rows] = await pool.query(
      'SELECT * FROM expenses WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0] || null;
  }

  static async create({ title, amount, category, expense_date, userId }) {
    const [result] = await pool.query(
      'INSERT INTO expenses (title, amount, category, expense_date, user_id) VALUES (?, ?, ?, ?, ?)',
      [title, amount, category, expense_date, userId]
    );
    const [rows] = await pool.query('SELECT * FROM expenses WHERE id = ?', [result.insertId]);
    return rows[0];
  }

  static async update(id, userId, { title, amount, category, expense_date }) {
    await pool.query(
      'UPDATE expenses SET title = ?, amount = ?, category = ?, expense_date = ? WHERE id = ? AND user_id = ?',
      [title, amount, category, expense_date, id, userId]
    );
    return await this.findById(id, userId);
  }

  static async delete(id, userId) {
    const [result] = await pool.query(
      'DELETE FROM expenses WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  static async getTotalByUser(userId, month = null) {
    let query = 'SELECT SUM(amount) as total FROM expenses WHERE user_id = ?';
    const params = [userId];
    if (month) {
      const [year, m] = month.split('-');
      query += ' AND MONTH(expense_date) = ? AND YEAR(expense_date) = ?';
      params.push(parseInt(m), parseInt(year));
    }
    const [rows] = await pool.query(query, params);
    return rows[0].total || 0;
  }

  static async getCategoryWise(userId, month = null) {
    let query = `
      SELECT category, SUM(amount) as total, COUNT(*) as count
      FROM expenses
      WHERE user_id = ?
    `;
    const params = [userId];
    if (month) {
      const [year, m] = month.split('-');
      query += ' AND MONTH(expense_date) = ? AND YEAR(expense_date) = ?';
      params.push(parseInt(m), parseInt(year));
    }
    query += ' GROUP BY category ORDER BY total DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async getMonthlyTrend(userId) {
    const [rows] = await pool.query(`
      SELECT 
        DATE_FORMAT(expense_date, '%Y-%m') as month,
        SUM(amount) as total,
        COUNT(*) as count
      FROM expenses
      WHERE user_id = ? AND expense_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(expense_date, '%Y-%m')
      ORDER BY month ASC
    `, [userId]);
    return rows;
  }

  static async getRecent(userId, limit = 5) {
    const [rows] = await pool.query(
      'SELECT * FROM expenses WHERE user_id = ? ORDER BY expense_date DESC, created DESC LIMIT ?',
      [userId, limit]
    );
    return rows;
  }
}

module.exports = ExpenseModel;
