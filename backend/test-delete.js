import axios from 'axios';
import jwt from 'jsonwebtoken';

const token = jwt.sign({ id: 2 }, 'expense_tracker_secret', { expiresIn: '7d' });

async function run() {
  try {
    const res = await axios.delete('http://localhost:5000/api/expenses/6', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}
run();
