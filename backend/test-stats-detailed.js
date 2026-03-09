const ExpenseModel = require('./models/expenseModel');
const pool = require('./config/db');

async function testStats() {
  try {
    // Get the first user ID dynamically if possible
    const [users] = await pool.query('SELECT id FROM users LIMIT 1');
    if (users.length === 0) {
      console.log('No users found. Please register a user first.');
      process.exit(0);
    }
    const userId = users[0].id;
    const month = '2026-03';
    
    console.log(`Testing stats for userId=${userId}, month=${month}...`);
    
    try {
        const total = await ExpenseModel.getTotalByUser(userId, month);
        console.log('Total:', total);
    } catch (e) { console.error('getTotalByUser failed:', e); }

    try {
        const cat = await ExpenseModel.getCategoryWise(userId, month);
        console.log('CategoryWise:', cat);
    } catch (e) { console.error('getCategoryWise failed:', e); }

    try {
        const trend = await ExpenseModel.getMonthlyTrend(userId);
        console.log('Trend:', trend);
    } catch (e) { console.error('getMonthlyTrend failed:', e); }

    try {
        const recent = await ExpenseModel.getRecent(userId, 5);
        console.log('Recent:', recent);
    } catch (e) { console.error('getRecent failed:', e); }

    process.exit(0);
  } catch (err) {
    console.error('Test failed with major error:', err);
    process.exit(1);
  }
}

testStats();
