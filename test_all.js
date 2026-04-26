const http = require('http');

async function testAll() {
  console.log('--- AEGESIS API INTEGRATION TEST ---');
  
  // 1. Register
  console.log('1. Registering user...');
  const regReq = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email: `test${Date.now()}@test.com`, password: 'password123', phone: '1234567890' })
  });
  
  const regData = await regReq.json();
  const token = regData.token;
  console.log(token ? '✅ Registration successful' : '❌ Registration failed');
  
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  // 2. Intent Decoder
  console.log('2. Testing Intent Decoder...');
  const intentReq = await fetch('http://localhost:5000/api/ai/decode-intent', {
    method: 'POST', headers, body: JSON.stringify({ conversation: "You're nothing without me." })
  });
  const intentData = await intentReq.json();
  console.log(intentData.analysis ? '✅ Intent Decoder successful' : '❌ Intent Decoder failed');

  // 3. Escalation Tracker
  console.log('3. Testing Escalation Tracker...');
  const escReq = await fetch('http://localhost:5000/api/ai/check-escalation', {
    method: 'POST', headers, body: JSON.stringify({ previousAnalyses: [{text:"hello", date:"2023-01-01"}, {text:"I will kill you", date:"2023-01-02"}] })
  });
  const escData = await escReq.json();
  console.log(escData.analysis ? '✅ Escalation Tracker successful' : '❌ Escalation Tracker failed');

  // 4. Digital Shadow
  console.log('4. Testing Digital Shadow...');
  const dsReq = await fetch('http://localhost:5000/api/ai/digital-shadow', {
    method: 'POST', headers, body: JSON.stringify({ query: "test@example.com" })
  });
  const dsData = await dsReq.json();
  console.log(dsData.analysis ? '✅ Digital Shadow successful' : '❌ Digital Shadow failed');

  // 5. Impersonation Detector
  console.log('5. Testing Impersonation Detector...');
  const impReq = await fetch('http://localhost:5000/api/ai/detect-impersonation', {
    method: 'POST', headers, body: JSON.stringify({ profile: {name: "a", bio: ""} })
  });
  const impData = await impReq.json();
  console.log(impData.analysis ? '✅ Impersonation Detector successful' : '❌ Impersonation Detector failed');

  // 6. Attack Simulation
  console.log('6. Testing Attack Simulation...');
  const simReq = await fetch('http://localhost:5000/api/ai/simulate-attack', {
    method: 'POST', headers, body: JSON.stringify({ scenario: "grooming" })
  });
  const simData = await simReq.json();
  console.log(simData.analysis ? '✅ Attack Simulation successful' : '❌ Attack Simulation failed');

  // 7. Emotional Support
  console.log('7. Testing Emotional Support...');
  const emoReq = await fetch('http://localhost:5000/api/ai/emotional-support', {
    method: 'POST', headers, body: JSON.stringify({ message: "I am very anxious and scared" })
  });
  const emoData = await emoReq.json();
  console.log(emoData.support ? '✅ Emotional Support successful' : '❌ Emotional Support failed');

  // 8. Panic Button
  console.log('8. Testing Panic Alert...');
  const panicReq = await fetch('http://localhost:5000/api/alerts/panic', {
    method: 'POST', headers, body: JSON.stringify({ location: {lat:0, lng:0}, contacts: [{name:"Test", phone:"123"}] })
  });
  const panicData = await panicReq.json();
  console.log(panicData.message ? '✅ Panic Alert successful' : '❌ Panic Alert failed');
}

testAll().catch(console.error);
