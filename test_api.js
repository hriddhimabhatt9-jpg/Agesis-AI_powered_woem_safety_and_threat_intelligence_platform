const http = require('http');

async function testApi() {
  // 1. Register
  console.log('Registering user...');
  const regReq = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email: `test${Date.now()}@test.com`, password: 'password123', phone: '1234567890' })
  });
  
  const regData = await regReq.json();
  if (!regData.token) {
    console.log('Registration failed:', regData);
    return;
  }
  
  const token = regData.token;
  console.log('Got token:', token.substring(0, 20) + '...');

  // 2. Test Message Analyzer
  console.log('\nTesting Message Analyzer...');
  const aiReq = await fetch('http://localhost:5000/api/ai/analyze-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ text: "I know where you live and I will find you. You can't hide from me." })
  });
  
  const aiData = await aiReq.json();
  console.log(JSON.stringify(aiData, null, 2));
}

testApi();
