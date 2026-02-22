const { execSync } = require('child_process');
const fs = require('fs');

// Login and get token
function loginAdmin() {
  const loginData = { identifier: 'admin@smarttech.com', password: 'AdminPassword123' };
  fs.writeFileSync('temp-login.json', JSON.stringify(loginData));
  
  const output = execSync('curl -s -X POST http://localhost:3001/api/v1/auth/login -H "Content-Type: application/json" -d @temp-login.json', { encoding: 'utf8' });
  fs.unlinkSync('temp-login.json');
  
  const response = JSON.parse(output);
  return response.token;
}

// Get EMI providers
function getProviders(token) {
  const output = execSync(`curl -s http://localhost:3001/api/v1/admin/emi/providers -H "Authorization: Bearer ${token}"`, { encoding: 'utf8' });
  return JSON.parse(output);
}

// Get EMI plans
function getPlans(token) {
  const output = execSync(`curl -s http://localhost:3001/api/v1/admin/emi/plans -H "Authorization: Bearer ${token}"`, { encoding: 'utf8' });
  return JSON.parse(output);
}

// Main execution
try {
  console.log('Logging in as admin...');
  const token = loginAdmin();
  console.log('Token obtained:', token.substring(0, 50) + '...');
  
  console.log('\nFetching EMI providers...');
  const providers = getProviders(token);
  console.log('Providers response:', JSON.stringify(providers, null, 2));
  
  console.log('\nFetching EMI plans...');
  const plans = getPlans(token);
  console.log('Plans response:', JSON.stringify(plans, null, 2));
  
} catch (error) {
  console.error('Error:', error.message);
}
