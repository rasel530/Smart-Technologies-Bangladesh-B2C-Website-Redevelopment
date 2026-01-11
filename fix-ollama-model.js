#!/usr/bin/env node

/**
 * Ollama Model Fix Script
 * 
 * This script pulls the required nomic-embed-text:latest model
 * to fix the "codebase indexing" error.
 */

const { spawn } = require('child_process');
const http = require('http');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkOllamaStatus() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 11434,
      path: '/api/tags',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ success: true, models: response.models || [] });
        } catch (error) {
          resolve({ success: false, error: error.message });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Request timeout' });
    });

    req.end();
  });
}

function pullModel() {
  return new Promise((resolve) => {
    log('\n🔄 Pulling nomic-embed-text:latest model...', 'cyan');
    log('This may take a few minutes depending on your internet connection.', 'yellow');
    
    const pullProcess = spawn('docker', [
      'exec',
      'smarttech_ollama',
      'ollama',
      'pull',
      'nomic-embed-text:latest'
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    pullProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      // Show progress dots
      process.stdout.write('.');
    });
    
    pullProcess.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      // Some progress info comes through stderr
      if (text.includes('%') || text.includes('downloading')) {
        process.stdout.write('.');
      }
    });
    
    pullProcess.on('close', (code) => {
      process.stdout.write('\n');
      if (code === 0) {
        log('✅ Model pull completed successfully!', 'green');
        resolve({ success: true });
      } else {
        log(`❌ Model pull failed with code: ${code}`, 'red');
        if (errorOutput) {
          log(`Error: ${errorOutput}`, 'red');
        }
        resolve({ success: false, error: `Exit code ${code}` });
      }
    });
    
    pullProcess.on('error', (err) => {
      log(`❌ Failed to start pull process: ${err.message}`, 'red');
      resolve({ success: false, error: err.message });
    });
  });
}

async function main() {
  log('═══════════════════════════════════════════════════════════════', 'bright');
  log('  Ollama Model Fix - nomic-embed-text:latest', 'bright');
  log('═══════════════════════════════════════════════════════════════', 'bright');
  
  // Step 1: Check Ollama status
  log('\n📋 Step 1: Checking Ollama service status...', 'blue');
  const status = await checkOllamaStatus();
  
  if (!status.success) {
    log(`❌ Cannot connect to Ollama: ${status.error}`, 'red');
    log('\n💡 Possible solutions:', 'yellow');
    log('   1. Make sure Docker is running', 'yellow');
    log('   2. Start the services: docker-compose up -d', 'yellow');
    log('   3. Check if Ollama container is running: docker ps | grep ollama', 'yellow');
    process.exit(1);
  }
  
  log('✅ Ollama service is running', 'green');
  
  // Step 2: Check for nomic-embed-text model
  log('\n📋 Step 2: Checking for nomic-embed-text model...', 'blue');
  const nomicModel = status.models.find(m => m.name.includes('nomic-embed-text'));
  
  if (nomicModel) {
    log(`✅ nomic-embed-text model is already available: ${nomicModel.name}`, 'green');
    log('\n🎉 No action needed! Your codebase indexing should work now.', 'green');
    process.exit(0);
  }
  
  log('❌ nomic-embed-text model NOT found', 'red');
  log(`   Available models: ${status.models.map(m => m.name).join(', ') || 'None'}`, 'yellow');
  
  // Step 3: Pull the model
  log('\n📋 Step 3: Pulling the required model...', 'blue');
  const pullResult = await pullModel();
  
  if (!pullResult.success) {
    log('\n❌ Failed to pull the model', 'red');
    log('\n💡 Manual fix:', 'yellow');
    log('   Run this command in your terminal:', 'cyan');
    log('   docker exec smarttech_ollama ollama pull nomic-embed-text:latest', 'cyan');
    process.exit(1);
  }
  
  // Step 4: Verify the model was pulled
  log('\n📋 Step 4: Verifying the model...', 'blue');
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for model to be registered
  
  const newStatus = await checkOllamaStatus();
  const newNomicModel = newStatus.models?.find(m => m.name.includes('nomic-embed-text'));
  
  if (newNomicModel) {
    log(`✅ nomic-embed-text model is now available: ${newNomicModel.name}`, 'green');
    log('\n═══════════════════════════════════════════════════════════════', 'bright');
    log('  🎉 SUCCESS! Codebase indexing should now work properly.', 'bright');
    log('═══════════════════════════════════════════════════════════════', 'bright');
  } else {
    log('⚠️ Model pull completed but model not yet visible', 'yellow');
    log('   Please wait a moment and try running your codebase indexing again.', 'yellow');
  }
}

main().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
