const ExpenseModel = require('./models/expenseModel');
const pool = require('./config/db');

async function testStats() {
  try {
    const userId = 1;
    
    console.log('Testing getMonthlyTrend with userId=1...');
    const trend = await ExpenseModel.getMonthlyTrend(userId);
    console.log('Trend:', trend);

    console.log('Testing getRecent with userId=1, limit=5...');
    const recent = await ExpenseModel.getRecent(userId, 5);
    console.log('Recent:', recent);

    process.exit(0);
  } catch (err) {
    console.error('Test failed with error object:', err);
    process.exit(1);
  }
}

testStats();
