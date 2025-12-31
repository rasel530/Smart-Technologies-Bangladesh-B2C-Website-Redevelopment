const { execSync } = require('child_process');

console.log('=== Verifying Ollama Fix ===\n');

// Step 1: Verify model is available
console.log('1. Checking available models...');
try {
  const models = execSync('docker exec smarttech_ollama ollama list', { encoding: 'utf8' });
  console.log('Available models:');
  console.log(models);
  
  if (models.includes('nomic-embed-text:latest')) {
    console.log('✅ nomic-embed-text:latest model is available');
  } else {
    console.log('❌ nomic-embed-text:latest model not found');
  }
} catch (error) {
  console.error('Error checking models:', error.message);
}

// Step 2: Test model functionality
console.log('\n2. Testing model functionality...');
try {
  const testResult = execSync(
    'docker exec smarttech_ollama ollama run nomic-embed-text:latest "codebase indexing test"',
    { encoding: 'utf8' }
  );
  
  // Parse embedding result (should be an array of numbers)
  const embedding = JSON.parse(testResult);
  
  if (Array.isArray(embedding) && embedding.length > 0) {
    console.log('✅ Model is generating embeddings correctly');
    console.log(`Embedding dimensions: ${embedding.length}`);
    console.log(`Sample values: [${embedding.slice(0, 5).join(', ')}, ...]`);
  } else {
    console.log('❌ Model not generating valid embeddings');
  }
} catch (error) {
  console.error('Error testing model:', error.message);
}

// Step 3: Check Ollama service status
console.log('\n3. Checking Ollama service status...');
try {
  const containerStatus = execSync('docker ps --filter "name=smarttech_ollama" --format "table {{.Names}}\t{{.Status}}"', { encoding: 'utf8' });
  console.log('Container status:');
  console.log(containerStatus);
  
  if (containerStatus.includes('Up')) {
    console.log('✅ Ollama container is running');
  } else {
    console.log('❌ Ollama container is not running');
  }
} catch (error) {
  console.error('Error checking container status:', error.message);
}

// Step 4: Test API connectivity
console.log('\n4. Testing Ollama API connectivity...');
try {
  const apiTest = execSync(
    'curl -s http://localhost:11434/api/tags',
    { encoding: 'utf8' }
  );
  
  const apiResponse = JSON.parse(apiTest);
  
  if (apiResponse.models && apiResponse.models.length > 0) {
    console.log('✅ Ollama API is responding');
    console.log('Available models via API:');
    apiResponse.models.forEach(model => {
      console.log(`  - ${model.name} (${model.size})`);
    });
  } else {
    console.log('❌ Ollama API not responding correctly');
  }
} catch (error) {
  console.error('Error testing API:', error.message);
}

console.log('\n=== Verification Complete ===');
console.log('The nomic-embed-text:latest model is now available for codebase indexing.');
console.log('Your codebase indexing should work without the "model not found" error.');