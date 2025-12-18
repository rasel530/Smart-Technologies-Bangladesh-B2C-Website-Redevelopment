const http = require('http');

function checkOllamaStatus() {
  const options = {
    hostname: 'localhost',
    port: 11434,
    path: '/api/tags',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Ollama is running! Status: ${res.statusCode}`);
    if (res.statusCode === 200) {
      console.log('🎉 Ollama service is ready at http://localhost:11434');
      process.exit(0);
    }
  });

  req.on('error', (err) => {
    console.log(`❌ Ollama not available yet: ${err.message}`);
  });

  req.on('timeout', () => {
    console.log('⏱️ Ollama request timed out - still starting...');
    req.destroy();
  });

  req.end();
}

console.log('🔍 Checking Ollama service status...');
checkOllamaStatus();