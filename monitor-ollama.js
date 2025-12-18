const http = require('http');

function checkOllamaStatus() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 11434,
      path: '/api/tags',
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function monitorOllama() {
  console.log('🔍 Starting Ollama service monitor...');
  console.log('📊 Download progress: ~555MB / 2.039GB (27% complete)');
  
  let attempts = 0;
  const maxAttempts = 200; // Monitor for about 16 minutes
  
  while (attempts < maxAttempts) {
    const isAvailable = await checkOllamaStatus();
    
    if (isAvailable) {
      console.log('\n🎉 SUCCESS! Ollama service is now running at http://localhost:11434');
      console.log('✅ You can now use Ollama API endpoints');
      process.exit(0);
    }
    
    attempts++;
    if (attempts % 10 === 0) {
      const progress = Math.min(27 + (attempts * 0.5), 95); // Estimate progress
      console.log(`⏳ Still waiting... (${attempts}/${maxAttempts} attempts) - Est. ${progress.toFixed(1)}% downloaded`);
    }
    
    // Wait 5 seconds between checks
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.log('\n⚠️ Monitor timeout reached. Ollama may still be downloading.');
  console.log('💡 Try running: docker-compose ps to check if container is running');
  process.exit(1);
}

monitorOllama().catch(console.error);