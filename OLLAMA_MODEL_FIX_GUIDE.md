# Ollama Model Fix Guide

## Issue
**Error:** `codebase indexing show Error - Ollama model not found: nomic-embed-text:latest`

## Root Cause
The `nomic-embed-text:latest` embedding model is not installed in your Ollama container. This model is required for codebase indexing features.

## Solutions

### Option 1: Automated Fix (Recommended)
Run the automated fix script:
```bash
node fix-ollama-model.js
```

### Option 2: Manual Fix
Pull the model directly using Docker:
```bash
docker exec smarttech_ollama ollama pull nomic-embed-text:latest
```

### Option 3: Using the Existing Diagnostic Script
Run the diagnostic script which includes auto-pull functionality:
```bash
node debug-ollama-models.js
```

## Verification
After pulling the model, verify it's available:

### Using the diagnostic script:
```bash
node debug-ollama-models.js
```

### Using curl:
```bash
curl http://localhost:11434/api/tags
```

You should see `nomic-embed-text:latest` in the models list.

## Model Information
- **Model:** nomic-embed-text:latest
- **Purpose:** Text embedding for codebase indexing
- **Size:** Approximately 274MB
- **Download Time:** Varies by internet connection (typically 2-5 minutes)

## Troubleshooting

### If Ollama is not running:
```bash
docker-compose up -d ollama
```

### If Docker is not running:
Start Docker Desktop on Windows.

### If the pull fails:
1. Check your internet connection
2. Verify the Ollama container is running:
   ```bash
   docker ps | grep ollama
   ```
3. Check Ollama logs:
   ```bash
   docker logs smarttech_ollama
   ```

## Related Scripts
- `check-ollama-status.js` - Quick Ollama status check
- `debug-ollama-models.js` - Comprehensive diagnostics with auto-fix
- `monitor-ollama.js` - Monitor Ollama service startup
- `fix-ollama-model.js` - Automated model pull script

## Next Steps
After successfully pulling the model:
1. Restart your codebase indexing process
2. The error should be resolved
3. If issues persist, check backend logs for additional errors

## Container Details
- **Container Name:** smarttech_ollama
- **Image:** ollama/ollama:latest
- **Port:** 11434
- **Volume:** ollama_data (persistent storage for models)
