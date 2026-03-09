import axios from 'axios';

async function login() {
  try {
    await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'wrongpassword'
    });
  } catch (err) {
    console.log('Status:', err.response.status);
    console.log('Data:', err.response.data);
  }
}

login();
