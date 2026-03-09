const BudgetModel = require('../models/budgetModel');
const ExpenseModel = require('../models/expenseModel');

exports.setBudget = async (req, res) => {
  try {
    const { month, amount } = req.body;
    if (!month || !amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid month and amount required' });
    }
    const budget = await BudgetModel.upsert(req.user.id, month, parseFloat(amount));
    res.json({ success: true, budget });
  } catch (err) {
    console.error('Set budget error:', err);
    res.status(500).json({ success: false, message: 'Failed to set budget' });
  }
};

exports.getBudget = async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) {
      return res.status(400).json({ success: false, message: 'Month is required' });
    }

    const budget = await BudgetModel.findByUserAndMonth(req.user.id, month);
    const spent = await ExpenseModel.getTotalByUser(req.user.id, month);
    const budgetAmount = budget ? parseFloat(budget.amount) : 0;
    const spentAmount = parseFloat(spent);
    const remaining = budgetAmount - spentAmount;
    const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
    const exceeded = spentAmount > budgetAmount && budgetAmount > 0;

    res.json({
      success: true,
      budget: budget || null,
      spent: spentAmount,
      remaining,
      percentage: Math.min(percentage, 100),
      exceeded
    });
  } catch (err) {
    console.error('Get budget error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch budget' });
  }
};

exports.getAllBudgets = async (req, res) => {
  try {
    const budgets = await BudgetModel.getAllByUser(req.user.id);
    res.json({ success: true, budgets });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch budgets' });
  }
};
