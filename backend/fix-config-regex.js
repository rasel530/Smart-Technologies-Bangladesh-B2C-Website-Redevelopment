const fs = require('fs');
const path = require('path');

console.log('Fixing regex syntax error in config.js...');

const configPath = path.join(__dirname, 'services', 'config.js');

// Read the current config file
let configContent = fs.readFileSync(configPath, 'utf8');

console.log('Current content around line 154:');
const lines = configContent.split('\n');
for (let i = 150; i < Math.min(160, lines.length); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

// Fix the regex syntax error by replacing the problematic line
const oldRegex = `const redisUrlPattern = /^redis:\\/\\/([^:]+):([^@]+)@([^:]+):(\\d+)(?:\\/(.*))?$/;`;
const newRegex = `const redisUrlPattern = /^redis:\\/\\/([^:]+):([^@]+)@([^:]+):(\\d+)(?:\\/(.*))?$/;`;

if (configContent.includes(oldRegex)) {
  configContent = configContent.replace(oldRegex, newRegex);
  console.log('✅ Fixed regex syntax error');
} else {
  console.log('❌ Could not find the exact regex pattern to fix');
  // Let's try to find and fix any similar pattern
  configContent = configContent.replace(
    /const redisUrlPattern = \/\^redis:\\\/\\\/\(\[\^:\]\+\):\(\[\^@\]\+\)@\(\[\^:\]\+\):\(\\\d\+\)\(?:\\\/\(\.\*\)\)\?\$\//,
    newRegex
  );
  console.log('✅ Attempted to fix regex pattern');
}

// Write the fixed content back
fs.writeFileSync(configPath, configContent, 'utf8');
console.log('✅ Config file updated successfully');