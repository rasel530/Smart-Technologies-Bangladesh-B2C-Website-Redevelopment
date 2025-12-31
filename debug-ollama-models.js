const http = require('http');

function checkOllamaAPI() {
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
          console.log('🔍 OLLAMA API DIAGNOSTIC RESULTS:');
          console.log('=====================================');
          console.log('✅ Ollama API Status:', res.statusCode);
          console.log('📊 Available Models:', response.models ? response.models.length : 0);
          
          if (response.models && response.models.length > 0) {
            console.log('\n📋 Model List:');
            response.models.forEach((model, index) => {
              console.log(`  ${index + 1}. ${model.name} (Size: ${model.size || 'unknown'})`);
            });
          } else {
            console.log('\n❌ No models found in Ollama');
          }
          
          // Check for nomic-embed-text specifically
          const nomicModel = response.models ? response.models.find(m => m.name.includes('nomic-embed-text')) : null;
          if (nomicModel) {
            console.log('\n✅ nomic-embed-text model found:', nomicModel.name);
          } else {
            console.log('\n❌ nomic-embed-text model NOT found');
            console.log('💡 This is likely causing the "codebase indexing" error');
          }
          
          resolve(response);
        } catch (error) {
          console.log('❌ Error parsing Ollama response:', error.message);
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Ollama API Error:', err.message);
      resolve(null);
    });

    req.on('timeout', () => {
      console.log('⏱️ Ollama API request timed out');
      req.destroy();
      resolve(null);
    });

    req.end();
  });
}

function testModelPull() {
  console.log('\n🔄 Testing model pull command...');
  const { spawn } = require('child_process');
  
  const pullProcess = spawn('docker', ['exec', 'smarttech_ollama', 'ollama', 'pull', 'nomic-embed-text:latest'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  pullProcess.stdout.on('data', (data) => {
    console.log('📥 Pull output:', data.toString());
  });
  
  pullProcess.stderr.on('data', (data) => {
    console.log('❌ Pull error:', data.toString());
  });
  
  pullProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Model pull completed successfully');
    } else {
      console.log(`❌ Model pull failed with code: ${code}`);
    }
  });
}

async function runDiagnostics() {
  console.log('🚀 Starting Ollama Model Diagnostics...');
  console.log('=====================================');
  
  const apiResponse = await checkOllamaAPI();
  
  if (apiResponse && apiResponse.models) {
    const nomicModel = apiResponse.models.find(m => m.name.includes('nomic-embed-text'));
    
    if (!nomicModel) {
      console.log('\n🔧 DIAGNOSIS: nomic-embed-text model is missing');
      console.log('💡 SOLUTION: Pull the model using: docker exec smarttech_ollama ollama pull nomic-embed-text:latest');
      console.log('\n🔄 Attempting automatic pull...');
      testModelPull();
    } else {
      console.log('\n✅ DIAGNOSIS: nomic-embed-text model is available');
      console.log('💡 The issue might be elsewhere in the codebase indexing pipeline');
    }
  } else {
    console.log('\n❌ DIAGNOSIS: Cannot connect to Ollama API');
    console.log('💡 SOLUTION: Check if Ollama container is running properly');
  }
}

runDiagnostics().catch(console.error);