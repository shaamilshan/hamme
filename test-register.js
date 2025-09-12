const axios = require('axios');

async function testRegister() {
  try {
    console.log('Testing registration...');
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      email: 'test2@example.com',
      password: 'password123',
      name: 'Test User 2'
    });
    console.log('Registration response:', response.data);
  } catch (error) {
    console.log('Registration error:', error.response?.data || error.message);
  }
}

testRegister();