const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', budgetController.getBudget);
router.get('/all', budgetController.getAllBudgets);
router.post('/', budgetController.setBudget);

module.exports = router;
