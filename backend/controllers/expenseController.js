const { validationResult } = require('express-validator');
const ExpenseModel = require('../models/expenseModel');

exports.getExpenses = async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      month: req.query.month,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search,
      page: req.query.page || 1,
      limit: req.query.limit || 10
    };

    const result = await ExpenseModel.findAllByUser(req.user.id, filters);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Get expenses error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch expenses' });
  }
};

exports.addExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, amount, category, expense_date } = req.body;
    const expense = await ExpenseModel.create({
      title, amount, category, expense_date, userId: req.user.id
    });

    res.status(201).json({ success: true, message: 'Expense added', expense });
  } catch (err) {
    console.error('Add expense error:', err);
    res.status(500).json({ success: false, message: 'Failed to add expense' });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const existing = await ExpenseModel.findById(id, req.user.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const { title, amount, category, expense_date } = req.body;
    const expense = await ExpenseModel.update(id, req.user.id, { title, amount, category, expense_date });

    res.json({ success: true, message: 'Expense updated', expense });
  } catch (err) {
    console.error('Update expense error:', err);
    res.status(500).json({ success: false, message: 'Failed to update expense' });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ExpenseModel.delete(id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) {
    console.error('Delete expense error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete expense' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const { month } = req.query;
    const [total, categoryWise, monthlyTrend, recent] = await Promise.all([
      ExpenseModel.getTotalByUser(req.user.id, month),
      ExpenseModel.getCategoryWise(req.user.id, month),
      ExpenseModel.getMonthlyTrend(req.user.id),
      ExpenseModel.getRecent(req.user.id, 5)
    ]);

    res.json({ success: true, total, categoryWise, monthlyTrend, recent });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};
