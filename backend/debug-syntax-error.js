const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNOSTIC: Analyzing syntax error and configuration issues...\n');

// 1. Check auth.js syntax
try {
  console.log('📋 Checking auth.js syntax...');
  const authPath = path.join(__dirname, 'middleware', 'auth.js');
  const authContent = fs.readFileSync(authPath, 'utf8');
  
  // Check for common syntax issues around line 914
  const lines = authContent.split('\n');
  const targetLine = 914;
  const contextStart = Math.max(0, targetLine - 5);
  const contextEnd = Math.min(lines.length, targetLine + 5);
  
  console.log(`\n📍 Context around line ${targetLine}:`);
  for (let i = contextStart; i < contextEnd; i++) {
    const marker = i === targetLine - 1 ? '>>> ' : '    ';
    console.log(`${marker}${i + 1}: ${lines[i]}`);
  }
  
  // Check for missing semicolons/braces
  const beforeError = lines.slice(0, targetLine - 1).join('\n');
  const openBraces = (beforeError.match(/\{/g) || []).length;
  const closeBraces = (beforeError.match(/\}/g) || []).length;
  
  console.log(`\n🔢 Brace balance before line ${targetLine}:`);
  console.log(`   Open braces: {${openBraces}`);
  console.log(`   Close braces: }${closeBraces}`);
  console.log(`   Balance: ${openBraces - closeBraces}`);
  
  if (openBraces !== closeBraces) {
    console.log('⚠️  BRACE IMBALANCE DETECTED!');
  }
  
} catch (error) {
  console.log('❌ Error reading auth.js:', error.message);
}

// 2. Check .env configuration
try {
  console.log('\n📋 Checking .env configuration...');
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const requiredConfigs = [
    'BKASH_API_KEY',
    'BKASH_API_SECRET', 
    'NAGAD_API_KEY',
    'NAGAD_API_SECRET',
    'ROCKET_API_KEY',
    'ROCKET_API_SECRET',
    'SMTP_HOST',
    'SMTP_USER', 
    'SMTP_PASS'
  ];
  
  console.log('\n🔍 Required configurations:');
  requiredConfigs.forEach(config => {
    const exists = envContent.includes(`${config}=`);
    const status = exists ? '✅' : '❌';
    console.log(`   ${status} ${config}`);
  });
  
} catch (error) {
  console.log('❌ Error reading .env:', error.message);
}

// 3. Try to import auth module
try {
  console.log('\n📋 Testing auth module import...');
  const authModule = require('./middleware/auth');
  console.log('✅ auth.js imported successfully');
  console.log('📦 Exported items:', Object.keys(authModule));
  
  if (authModule.errorLogger) {
    console.log('✅ errorLogger function found');
  } else {
    console.log('❌ errorLogger function NOT found in exports');
  }
  
} catch (error) {
  console.log('❌ Error importing auth module:', error.message);
  console.log('📍 Stack trace:', error.stack);
}

console.log('\n🔍 DIAGNOSTIC COMPLETE');