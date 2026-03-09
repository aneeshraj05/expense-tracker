const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');
const { expenseValidation } = require('../middleware/validators');

router.use(protect);

router.get('/', expenseController.getExpenses);
router.get('/stats', expenseController.getStats);
router.post('/', expenseValidation, expenseController.addExpense);
router.put('/:id', expenseValidation, expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
