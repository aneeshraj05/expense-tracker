import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import db from './config/db.js';

dotenv.config();

const app = express();

// ─────────────────────────────────────────────
//  MIDDLEWARE
// ─────────────────────────────────────────────
app.use(cors({
  origin: "https://expense-tracker-6vjs.onrender.com",
  credentials: true // Important if you add cookies later
}));

app.use(express.json());

// Rate limiting — 1000 requests per 15 minutes (increased for development)
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests. Please try again later.' }
}));

// ─────────────────────────────────────────────
//  AUTH MIDDLEWARE — protects private routes
// ─────────────────────────────────────────────
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated. Please login.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'expense_tracker_secret', (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
    req.userId = decoded.id;
    next();
  });
}

// ─────────────────────────────────────────────
//  HEALTH CHECK
// ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Expense Tracker API is running!' });
});

// ═════════════════════════════════════════════
//  AUTH ROUTES
// ═════════════════════════════════════════════

// POST /api/auth/register — Create a new user account
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  // Check if email already exists
  db.query('SELECT id FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error.' });
    if (results.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    // Hash the password and insert new user
    const hashedPassword = bcrypt.hashSync(password, 12);
    db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword],
      (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Failed to create account.' });

        const token = jwt.sign(
          { id: result.insertId },
          process.env.JWT_SECRET || 'expense_tracker_secret',
          { expiresIn: '7d' }
        );

        res.status(201).json({
          success: true,
          message: 'Account created successfully.',
          token,
          user: { id: result.insertId, name, email }
        });
      }
    );
  });
});

// POST /api/auth/login — Login and get JWT token
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error.' });
    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = results[0];
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'expense_tracker_secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  });
});

// GET /api/auth/profile — Get logged-in user info (protected)
app.get('/api/auth/profile', verifyToken, (req, res) => {
  db.query('SELECT id, name, email FROM users WHERE id = ?', [req.userId], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error.' });
    if (results.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user: results[0] });
  });
});

// ═════════════════════════════════════════════
//  EXPENSE ROUTES
// ═════════════════════════════════════════════

// GET /api/expenses/stats — Dashboard analytics (must be before /api/expenses/:id)
app.get('/api/expenses/stats', verifyToken, (req, res) => {
  const { month } = req.query;
  let monthFilter = '';
  let monthParams = [];

  if (month) {
    const [year, m] = month.split('-');
    monthFilter = ' AND MONTH(expense_date) = ? AND YEAR(expense_date) = ?';
    monthParams = [parseInt(m), parseInt(year)];
  }

  // 1. Total spent for the selected month
  db.query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? ${monthFilter}`,
    [req.userId, ...monthParams],
    (err, totalResult) => {
      if (err) return res.status(500).json({ success: false, message: 'Failed to load stats.' });

      // 2. Category-wise spending breakdown
      db.query(
        `SELECT category, SUM(amount) as total, COUNT(*) as count
         FROM expenses WHERE user_id = ? ${monthFilter}
         GROUP BY category ORDER BY total DESC`,
        [req.userId, ...monthParams],
        (err, categoryResult) => {
          if (err) return res.status(500).json({ success: false, message: 'Failed to load stats.' });

          // 3. Month-by-month trend (last 6 months)
          db.query(
            `SELECT DATE_FORMAT(expense_date, '%Y-%m') as month,
                    SUM(amount) as total, COUNT(*) as count
             FROM expenses
             WHERE user_id = ? AND expense_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
             GROUP BY DATE_FORMAT(expense_date, '%Y-%m')
             ORDER BY month ASC`,
            [req.userId],
            (err, trendResult) => {
              if (err) return res.status(500).json({ success: false, message: 'Failed to load stats.' });

              // 4. Most recent 5 transactions
              db.query(
                `SELECT * FROM expenses
                 WHERE user_id = ?
                 ORDER BY expense_date DESC, created DESC
                 LIMIT 5`,
                [req.userId],
                (err, recentResult) => {
                  if (err) return res.status(500).json({ success: false, message: 'Failed to load stats.' });

                  res.json({
                    success: true,
                    total: totalResult[0].total,
                    categoryWise: categoryResult,
                    monthlyTrend: trendResult,
                    recent: recentResult
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// GET /api/expenses — Fetch all expenses with optional filters and pagination
app.get('/api/expenses', verifyToken, (req, res) => {
  const { category, month, search, page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = 'SELECT * FROM expenses WHERE user_id = ?';
  let params = [req.userId];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (month) {
    const [year, m] = month.split('-');
    query += ' AND MONTH(expense_date) = ? AND YEAR(expense_date) = ?';
    params.push(parseInt(m), parseInt(year));
  }
  if (search) {
    query += ' AND (title LIKE ? OR category LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  // Get total count for pagination first
  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
  db.query(countQuery, params, (err, countResult) => {
    if (err) return res.status(500).json({ success: false, message: 'Failed to fetch expenses.' });

    const total = countResult[0].total;

    query += ' ORDER BY expense_date DESC, created DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    db.query(query, params, (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Failed to fetch expenses.' });
      res.json({
        success: true,
        expenses: results,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    });
  });
});

// POST /api/expenses — Add a new expense
app.post('/api/expenses', verifyToken, (req, res) => {
  const { title, amount, category, expense_date } = req.body;

  if (!title || !amount || !category || !expense_date) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }
  if (parseFloat(amount) <= 0) {
    return res.status(400).json({ success: false, message: 'Amount must be a positive number.' });
  }

  db.query(
    'INSERT INTO expenses (title, amount, category, expense_date, user_id) VALUES (?, ?, ?, ?, ?)',
    [title, parseFloat(amount), category, expense_date, req.userId],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Failed to add expense.' });

      db.query('SELECT * FROM expenses WHERE id = ?', [result.insertId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: 'Added but failed to fetch.' });
        res.status(201).json({ success: true, message: 'Expense added.', expense: rows[0] });
      });
    }
  );
});

// PUT /api/expenses/:id — Update an existing expense
app.put('/api/expenses/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { title, amount, category, expense_date } = req.body;

  if (!title || !amount || !category || !expense_date) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  db.query(
    'UPDATE expenses SET title = ?, amount = ?, category = ?, expense_date = ? WHERE id = ? AND user_id = ?',
    [title, parseFloat(amount), category, expense_date, id, req.userId],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Failed to update expense.' });
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Expense not found.' });
      }

      db.query('SELECT * FROM expenses WHERE id = ?', [id], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: 'Updated but failed to fetch.' });
        res.json({ success: true, message: 'Expense updated.', expense: rows[0] });
      });
    }
  );
});

// DELETE /api/expenses/:id — Delete an expense
app.delete('/api/expenses/:id', verifyToken, (req, res) => {
  const { id } = req.params;

  db.query(
    'DELETE FROM expenses WHERE id = ? AND user_id = ?',
    [id, req.userId],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Failed to delete expense.' });
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Expense not found.' });
      }
      res.json({ success: true, message: 'Expense deleted.' });
    }
  );
});

// ═════════════════════════════════════════════
//  BUDGET ROUTES
// ═════════════════════════════════════════════

// GET /api/budget — Get budget and spending comparison for a month
app.get('/api/budget', verifyToken, (req, res) => {
  const { month } = req.query;
  if (!month) return res.status(400).json({ success: false, message: 'Month is required.' });

  const [year, m] = month.split('-');

  db.query(
    'SELECT * FROM budgets WHERE user_id = ? AND month = ?',
    [req.userId, month],
    (err, budgetResult) => {
      if (err) return res.status(500).json({ success: false, message: 'Failed to fetch budget.' });

      db.query(
        `SELECT COALESCE(SUM(amount), 0) as spent FROM expenses
         WHERE user_id = ? AND MONTH(expense_date) = ? AND YEAR(expense_date) = ?`,
        [req.userId, parseInt(m), parseInt(year)],
        (err, spentResult) => {
          if (err) return res.status(500).json({ success: false, message: 'Failed to fetch spending.' });

          const budget = budgetResult[0] || null;
          const spent = parseFloat(spentResult[0].spent);
          const budgetAmount = budget ? parseFloat(budget.amount) : 0;
          const remaining = budgetAmount - spent;
          const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
          const exceeded = spent > budgetAmount && budgetAmount > 0;

          res.json({ success: true, budget, spent, remaining, percentage: Math.min(percentage, 100), exceeded });
        }
      );
    }
  );
});

// POST /api/budget — Set or update monthly budget limit
app.post('/api/budget', verifyToken, (req, res) => {
  const { month, amount } = req.body;

  if (!month || !amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ success: false, message: 'Valid month and amount are required.' });
  }

  db.query(
    `INSERT INTO budgets (user_id, month, amount) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE amount = ?`,
    [req.userId, month, parseFloat(amount), parseFloat(amount)],
    (err) => {
      if (err) return res.status(500).json({ success: false, message: 'Failed to set budget.' });

      db.query(
        'SELECT * FROM budgets WHERE user_id = ? AND month = ?',
        [req.userId, month],
        (err, rows) => {
          if (err) return res.status(500).json({ success: false, message: 'Saved but fetch failed.' });
          res.json({ success: true, message: 'Budget updated.', budget: rows[0] });
        }
      );
    }
  );
});

// ─────────────────────────────────────────────
//  START SERVER
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
