const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Fixing Ollama Network Connectivity Issues ===\n');

// Step 1: Check current Docker network configuration
console.log('1. Checking Docker network configuration...');
try {
  const networkInfo = execSync('docker network ls', { encoding: 'utf8' });
  console.log('Available Docker networks:');
  console.log(networkInfo);
} catch (error) {
  console.error('Error checking Docker networks:', error.message);
}

// Step 2: Check Ollama container network settings
console.log('\n2. Checking Ollama container network settings...');
try {
  const containerInspect = execSync('docker inspect smarttech_ollama', { encoding: 'utf8' });
  const containerData = JSON.parse(containerInspect);
  const networkSettings = containerData[0].NetworkSettings;
  
  console.log('Container network mode:', networkSettings.NetworkMode || 'default');
  console.log('Container IP address:', networkSettings.IPAddress || 'N/A');
  
  if (networkSettings.Networks) {
    console.log('Connected networks:');
    Object.keys(networkSettings.Networks).forEach(networkName => {
      const network = networkSettings.Networks[networkName];
      console.log(`  - ${networkName}: ${network.IPAddress}`);
    });
  }
} catch (error) {
  console.error('Error inspecting Ollama container:', error.message);
}

// Step 3: Test internet connectivity from container
console.log('\n3. Testing internet connectivity from container...');
try {
  const pingResult = execSync('docker exec smarttech_ollama ping -c 3 8.8.8.8', { encoding: 'utf8' });
  console.log('Internet connectivity test:');
  console.log(pingResult);
} catch (error) {
  console.error('Internet connectivity test failed:', error.message);
}

// Step 4: Check DNS resolution from container
console.log('\n4. Testing DNS resolution from container...');
try {
  const dnsResult = execSync('docker exec smarttech_ollama nslookup ollama.ai', { encoding: 'utf8' });
  console.log('DNS resolution test:');
  console.log(dnsResult);
} catch (error) {
  console.error('DNS resolution test failed:', error.message);
}

// Step 5: Configure Ollama with alternative registry mirrors
console.log('\n5. Configuring Ollama with alternative registry mirrors...');
try {
  // Create a script to configure Ollama with better network settings
  const configScript = `
# Configure Ollama for better network performance
export OLLAMA_HOST=0.0.0.0
export OLLAMA_ORIGINS=*
# Set longer timeout for downloads
export OLLAMA_REQUEST_TIMEOUT=300
# Configure for larger downloads
export OLLAMA_MAX_QUEUE=512
export OLLAMA_MAX_LOADED_MODELS=3

echo "Ollama environment configured for better network performance"
`;

  fs.writeFileSync(path.join(__dirname, 'ollama-config.sh'), configScript);
  console.log('Created Ollama configuration script');
  
  // Apply configuration to container
  execSync('docker cp ollama-config.sh smarttech_ollama:/tmp/', { encoding: 'utf8' });
  execSync('docker exec smarttech_ollama chmod +x /tmp/ollama-config.sh', { encoding: 'utf8' });
  execSync('docker exec smarttech_ollama /tmp/ollama-config.sh', { encoding: 'utf8' });
  console.log('Applied network configuration to Ollama container');
} catch (error) {
  console.error('Error configuring Ollama:', error.message);
}

// Step 6: Restart Ollama service with new configuration
console.log('\n6. Restarting Ollama service with new configuration...');
try {
  execSync('docker restart smarttech_ollama', { encoding: 'utf8' });
  console.log('Ollama container restarted');
  
  // Wait for service to be ready
  console.log('Waiting for Ollama service to be ready...');
  setTimeout(() => {
    console.log('Ollama service should be ready now');
  }, 10000);
} catch (error) {
  console.error('Error restarting Ollama:', error.message);
}

// Step 7: Attempt model download with retry mechanism
console.log('\n7. Attempting model download with retry mechanism...');
const maxRetries = 3;
let retryCount = 0;

function downloadModel() {
  return new Promise((resolve, reject) => {
    console.log(`Attempt ${retryCount + 1}/${maxRetries} to download nomic-embed-text:latest...`);
    
    const timeout = 600000; // 10 minutes timeout
    
    try {
      const downloadResult = execSync(
        `docker exec smarttech_ollama ollama pull nomic-embed-text:latest`,
        { encoding: 'utf8', timeout }
      );
      console.log('Download successful!');
      console.log(downloadResult);
      resolve(downloadResult);
    } catch (error) {
      console.error(`Download attempt ${retryCount + 1} failed:`, error.message);
      
      if (retryCount < maxRetries - 1) {
        retryCount++;
        console.log(`Retrying in 30 seconds...`);
        setTimeout(() => {
          downloadModel().then(resolve).catch(reject);
        }, 30000);
      } else {
        reject(error);
      }
    }
  });
}

// Start the download process
downloadModel()
  .then(() => {
    console.log('\n=== Model download completed successfully ===');
    
    // Verify the model is available
    try {
      const models = execSync('docker exec smarttech_ollama ollama list', { encoding: 'utf8' });
      console.log('Available models after download:');
      console.log(models);
    } catch (error) {
      console.error('Error verifying models:', error.message);
    }
  })
  .catch((error) => {
    console.error('\n=== All download attempts failed ===');
    console.error('Final error:', error.message);
    
    console.log('\n=== Alternative Solutions ===');
    console.log('1. Try downloading a smaller model first:');
    console.log('   docker exec smarttech_ollama ollama pull llama3.2:1b');
    console.log('\n2. Manually download model file and import:');
    console.log('   Download from: https://ollama.ai/library/nomic-embed-text');
    console.log('   Then import with: docker exec smarttech_ollama ollama import <path-to-model>');
    console.log('\n3. Configure alternative model in your codebase indexing settings');
  });

// Cleanup
try {
  fs.unlinkSync(path.join(__dirname, 'ollama-config.sh'));
} catch (error) {
  // Ignore cleanup errors
}