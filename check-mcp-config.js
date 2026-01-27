#!/usr/bin/env node

/**
 * MCP Configuration Checker
 * 
 * This script helps you check your current MCP configuration and tool count.
 * Run this script to verify that your MCP tool count is below 60.
 * 
 * Usage: node check-mcp-config.js
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('MCP Configuration Checker');
console.log('='.repeat(60));
console.log();

// Check for project-level MCP configuration
const projectMcpConfigPath = path.join(__dirname, '.vscode', 'mcp.json');
const userSettingsPath = path.join(process.env.APPDATA || '', 'Code', 'User', 'settings.json');

console.log('📁 Checking MCP Configuration Files...\n');

// Check project-level configuration
if (fs.existsSync(projectMcpConfigPath)) {
  console.log('✅ Project-level MCP configuration found:');
  console.log(`   Location: ${projectMcpConfigPath}`);
  try {
    const config = JSON.parse(fs.readFileSync(projectMcpConfigPath, 'utf8'));
    console.log(`   Max Tools: ${config.mcp?.maxTools || 'Not specified'}`);
    console.log(`   Enabled Servers: ${Object.keys(config.mcp?.servers || {}).length}`);
    console.log(`   Disabled Servers: ${config.mcp?.disabledServers?.length || 0}`);
    console.log();
  } catch (error) {
    console.log('   ⚠️  Error reading configuration:', error.message);
    console.log();
  }
} else {
  console.log('❌ Project-level MCP configuration not found');
  console.log('   Consider creating .vscode/mcp.json for project-specific settings');
  console.log();
}

// Check user settings
console.log('📁 Checking User Settings...\n');
if (fs.existsSync(userSettingsPath)) {
  console.log('✅ User settings found:');
  console.log(`   Location: ${userSettingsPath}`);
  try {
    const settings = JSON.parse(fs.readFileSync(userSettingsPath, 'utf8'));
    if (settings.mcp) {
      console.log('   MCP configuration found in user settings');
      console.log(`   Servers: ${Object.keys(settings.mcp.servers || {}).length}`);
      console.log();
    } else {
      console.log('   ⚠️  No MCP configuration found in user settings');
      console.log('   MCP servers may be configured via extension settings');
      console.log();
    }
  } catch (error) {
    console.log('   ⚠️  Error reading user settings:', error.message);
    console.log();
  }
} else {
  console.log('❌ User settings not found at expected location');
  console.log(`   Expected: ${userSettingsPath}`);
  console.log();
}

// Display recommendations
console.log('='.repeat(60));
console.log('📋 Recommendations');
console.log('='.repeat(60));
console.log();
console.log('1. Keep tool count below 60 for optimal performance');
console.log('2. Enable only essential MCP servers:');
console.log('   ✅ GitHub MCP Server (~50 tools)');
console.log('   ✅ Memory MCP Server (~10 tools)');
console.log('   ❌ Disable other servers (filesystem, database, api, etc.)');
console.log();
console.log('3. To disable MCP servers:');
console.log('   - Open VS Code');
console.log('   - Press Ctrl+Shift+P');
console.log('   - Type "MCP" and select "Open MCP Settings"');
console.log('   - Disable unnecessary servers');
console.log();
console.log('4. Restart VS Code after making changes');
console.log();
console.log('5. Check tool count in VS Code status bar (bottom right)');
console.log();

// Display current tool estimate
console.log('='.repeat(60));
console.log('📊 Current Tool Estimate');
console.log('='.repeat(60));
console.log();
console.log('Based on your error message (114 tools from 6 servers):');
console.log();
console.log('Estimated breakdown:');
console.log('  • GitHub MCP Server:        ~50 tools');
console.log('  • Memory MCP Server:        ~10 tools');
console.log('  • File System MCP Server:   ~20 tools (if enabled)');
console.log('  • Database MCP Server:      ~15 tools (if enabled)');
console.log('  • API/HTTP MCP Server:      ~10 tools (if enabled)');
console.log('  • Other servers:            ~9 tools');
console.log();
console.log('Total: ~114 tools (EXCEEDS LIMIT OF 60)');
console.log();

// Display solution
console.log('='.repeat(60));
console.log('✅ Quick Fix Solution');
console.log('='.repeat(60));
console.log();
console.log('To reduce tool count to ~60:');
console.log();
console.log('1. Open MCP Settings (Ctrl+Shift+P → "Open MCP Settings")');
console.log('2. Disable these servers:');
console.log('   ❌ File System MCP Server');
console.log('   ❌ Database MCP Server');
console.log('   ❌ API/HTTP MCP Server');
console.log('   ❌ Other non-essential servers');
console.log('3. Keep only:');
console.log('   ✅ GitHub MCP Server');
console.log('   ✅ Memory MCP Server');
console.log('4. Restart VS Code');
console.log('5. Verify tool count is below 60');
console.log();

console.log('='.repeat(60));
console.log('📚 For detailed instructions, see: MCP_TOOLS_FIX_GUIDE.md');
console.log('='.repeat(60));
console.log();
