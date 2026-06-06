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
  origin: [
    "http://localhost:3000",
    "https://expense-tracker-zn8u.onrender.com"
  ],
  credentials: true
}));
app.use(express.json());

// Rate limiting — 1000 requests per 15 minutes (increased for development)
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests. Please try again later.' }
}));

app.get("/", (req, res) => {
  res.send("Expense Tracker API is running");
});

// 
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
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Check if email already exists
    const { rows: existingUsers } = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    // Hash the password and insert new user
    const hashedPassword = bcrypt.hashSync(password, 12);
    const { rows: insertResult } = await db.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
      [name, email, hashedPassword]
    );

    const insertId = insertResult[0].id;

    const token = jwt.sign(
      { id: insertId },
      process.env.JWT_SECRET || 'expense_tracker_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: { id: insertId, name, email }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error.' });
  }
});

// POST /api/auth/login — Login and get JWT token
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const { rows: results } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error.' });
  }
});

// GET /api/auth/profile — Get logged-in user info (protected)
app.get('/api/auth/profile', verifyToken, async (req, res) => {
  try {
    const { rows: results } = await db.query('SELECT id, name, email FROM users WHERE id = $1', [req.userId]);
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user: results[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error.' });
  }
});

// ═════════════════════════════════════════════
//  EXPENSE ROUTES
// ═════════════════════════════════════════════

// GET /api/expenses/stats — Dashboard analytics (must be before /api/expenses/:id)
app.get('/api/expenses/stats', verifyToken, async (req, res) => {
  try {
    const { month } = req.query;
    let monthFilter = '';
    let monthParams = [];
    let paramOffset = 1;

    if (month) {
      const [year, m] = month.split('-');
      monthFilter = ` AND EXTRACT(MONTH FROM expense_date) = $2 AND EXTRACT(YEAR FROM expense_date) = $3`;
      monthParams = [parseInt(m), parseInt(year)];
    }

    // 1. Total spent for the selected month
    const { rows: totalResult } = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = $1 ${monthFilter}`,
      [req.userId, ...monthParams]
    );

    // 2. Category-wise spending breakdown
    const { rows: categoryResult } = await db.query(
      `SELECT category, SUM(amount) as total, COUNT(*) as count
       FROM expenses WHERE user_id = $1 ${monthFilter}
       GROUP BY category ORDER BY total DESC`,
      [req.userId, ...monthParams]
    );

    // 3. Month-by-month trend (last 6 months)
    const { rows: trendResult } = await db.query(
      `SELECT TO_CHAR(expense_date, 'YYYY-MM') as month,
              SUM(amount) as total, COUNT(*) as count
       FROM expenses
       WHERE user_id = $1 AND expense_date >= CURRENT_DATE - INTERVAL '6 months'
       GROUP BY TO_CHAR(expense_date, 'YYYY-MM')
       ORDER BY month ASC`,
      [req.userId]
    );

    // 4. Most recent 5 transactions
    const { rows: recentResult } = await db.query(
      `SELECT * FROM expenses
       WHERE user_id = $1
       ORDER BY expense_date DESC, created DESC
       LIMIT 5`,
      [req.userId]
    );

    res.json({
      success: true,
      total: totalResult[0].total,
      categoryWise: categoryResult,
      monthlyTrend: trendResult,
      recent: recentResult
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to load stats.' });
  }
});

// GET /api/expenses — Fetch all expenses with optional filters and pagination
app.get('/api/expenses', verifyToken, async (req, res) => {
  try {
    const { category, month, search, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = 'SELECT * FROM expenses WHERE user_id = $1';
    let countQuery = 'SELECT COUNT(*) as total FROM expenses WHERE user_id = $1';
    let params = [req.userId];
    let pIdx = 2;

    if (category) {
      query += ` AND category = $${pIdx}`;
      countQuery += ` AND category = $${pIdx}`;
      params.push(category);
      pIdx++;
    }
    if (month) {
      const [year, m] = month.split('-');
      query += ` AND EXTRACT(MONTH FROM expense_date) = $${pIdx} AND EXTRACT(YEAR FROM expense_date) = $${pIdx+1}`;
      countQuery += ` AND EXTRACT(MONTH FROM expense_date) = $${pIdx} AND EXTRACT(YEAR FROM expense_date) = $${pIdx+1}`;
      params.push(parseInt(m), parseInt(year));
      pIdx += 2;
    }
    if (search) {
      query += ` AND (title ILIKE $${pIdx} OR category ILIKE $${pIdx})`;
      countQuery += ` AND (title ILIKE $${pIdx} OR category ILIKE $${pIdx})`;
      params.push(`%${search}%`);
      pIdx++;
    }

    // Get total count for pagination first
    const { rows: countResult } = await db.query(countQuery, params);
    const total = countResult[0].total;

    query += ` ORDER BY expense_date DESC, created DESC LIMIT $${pIdx} OFFSET $${pIdx+1}`;
    params.push(parseInt(limit), offset);

    const { rows: results } = await db.query(query, params);

    res.json({
      success: true,
      expenses: results,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch expenses.' });
  }
});

// POST /api/expenses — Add a new expense
app.post('/api/expenses', verifyToken, async (req, res) => {
  try {
    const { title, amount, category, expense_date } = req.body;

    if (!title || !amount || !category || !expense_date) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number.' });
    }

    const { rows } = await db.query(
      'INSERT INTO expenses (title, amount, category, expense_date, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, parseFloat(amount), category, expense_date, req.userId]
    );

    res.status(201).json({ success: true, message: 'Expense added.', expense: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to add expense.' });
  }
});

// PUT /api/expenses/:id — Update an existing expense
app.put('/api/expenses/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, category, expense_date } = req.body;

    if (!title || !amount || !category || !expense_date) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const result = await db.query(
      'UPDATE expenses SET title = $1, amount = $2, category = $3, expense_date = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
      [title, parseFloat(amount), category, expense_date, id, req.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }

    res.json({ success: true, message: 'Expense updated.', expense: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update expense.' });
  }
});

// DELETE /api/expenses/:id — Delete an expense
app.delete('/api/expenses/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }
    
    res.json({ success: true, message: 'Expense deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete expense.' });
  }
});

// ═════════════════════════════════════════════
//  BUDGET ROUTES
// ═════════════════════════════════════════════

// GET /api/budget — Get budget and spending comparison for a month
app.get('/api/budget', verifyToken, async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ success: false, message: 'Month is required.' });

    const [year, m] = month.split('-');

    const { rows: budgetResult } = await db.query(
      'SELECT * FROM budgets WHERE user_id = $1 AND month = $2',
      [req.userId, month]
    );

    const { rows: spentResult } = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as spent FROM expenses
       WHERE user_id = $1 AND EXTRACT(MONTH FROM expense_date) = $2 AND EXTRACT(YEAR FROM expense_date) = $3`,
      [req.userId, parseInt(m), parseInt(year)]
    );

    const budget = budgetResult[0] || null;
    const spent = parseFloat(spentResult[0].spent);
    const budgetAmount = budget ? parseFloat(budget.amount) : 0;
    const remaining = budgetAmount - spent;
    const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
    const exceeded = spent > budgetAmount && budgetAmount > 0;

    res.json({ success: true, budget, spent, remaining, percentage: Math.min(percentage, 100), exceeded });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch budget.' });
  }
});


// POST /api/budget — Set or update monthly budget limit
app.post('/api/budget', verifyToken, async (req, res) => {
  try {
    const { month, amount } = req.body;

    if (!month || !amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid month and amount are required.' });
    }

    const { rows } = await db.query(
      `INSERT INTO budgets (user_id, month, amount) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, month) DO UPDATE SET amount = $4 RETURNING *`,
      [req.userId, month, parseFloat(amount), parseFloat(amount)]
    );

    res.json({ success: true, message: 'Budget updated.', budget: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to set budget.' });
  }
});

// ─────────────────────────────────────────────
//  START SERVER
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
