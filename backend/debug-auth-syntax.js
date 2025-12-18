const fs = require('fs');
const path = require('path');

console.log('=== Auth.js Syntax Diagnosis ===');

// Read the auth.js file
const authPath = path.join(__dirname, 'middleware', 'auth.js');
const content = fs.readFileSync(authPath, 'utf8');

// Check line 914 area
const lines = content.split('\n');
console.log('\n--- Lines around 914 ---');
for (let i = 910; i <= 920 && i < lines.length; i++) {
  console.log(`${i}: ${lines[i-1]}`);
}

// Check for common syntax issues
console.log('\n--- Syntax Analysis ---');

// Check for balanced braces
let openBraces = 0;
let openParens = 0;
let openBrackets = 0;

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  if (char === '{') openBraces++;
  else if (char === '}') openBraces--;
  else if (char === '(') openParens++;
  else if (char === ')') openParens--;
  else if (char === '[') openBrackets++;
  else if (char === ']') openBrackets--;
}

console.log(`Brace balance: ${openBraces} (should be 0)`);
console.log(`Parentheses balance: ${openParens} (should be 0)`);
console.log(`Bracket balance: ${openBrackets} (should be 0)`);

// Check for loggerService scope issues
console.log('\n--- Scope Analysis ---');
const loggerServiceMatches = content.match(/loggerService/g);
console.log(`loggerService references: ${loggerServiceMatches ? loggerServiceMatches.length : 0}`);

const requireStatements = content.match(/require\(['"][^'"]+['"]\)/g);
console.log('Require statements:');
if (requireStatements) {
  requireStatements.forEach(req => console.log(`  ${req}`));
}

// Check the errorLogger function specifically
console.log('\n--- errorLogger Function Analysis ---');
const errorLoggerMatch = content.match(/function errorLogger\(\)[\s\S]*?^}/m);
if (errorLoggerMatch) {
  console.log('Found errorLogger function:');
  console.log(errorLoggerMatch[0]);
} else {
  console.log('errorLogger function not found with expected pattern');
}

// Try to parse with Node.js to get exact error
try {
  require(authPath);
  console.log('\n✅ File parsed successfully');
} catch (error) {
  console.log(`\n❌ Parse error: ${error.message}`);
  console.log(`Stack: ${error.stack}`);
}