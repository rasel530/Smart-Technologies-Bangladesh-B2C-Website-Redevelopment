# MCP Tools Fix Guide - Permanent Solution

## Problem
You have 114 tools enabled via 6 MCP servers, which exceeds the recommended limit of 60 tools. This can cause confusion and errors in the AI model.

## Root Cause
MCP (Model Context Protocol) servers are configured in your global VS Code settings, not in the project. You have too many MCP servers enabled simultaneously.

## Current MCP Servers (Based on Available Tools)

Based on the tools available, you likely have these MCP servers enabled:

1. **GitHub MCP Server** (~50+ tools)
   - Repository operations (commits, branches, PRs, issues)
   - Code search
   - User management
   - Release management

2. **Memory MCP Server** (~10+ tools)
   - Knowledge graph management
   - Entity and relation operations
   - Node search and retrieval

3. **Other potential servers** (estimated ~50+ tools combined)
   - File system operations
   - Database operations
   - API integrations
   - Development tools

## Permanent Solution

### Step 1: Access MCP Settings

1. Open VS Code
2. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
3. Type "MCP" and select "Open MCP Settings" or "MCP: Configure Servers"

### Step 2: Review and Disable Unnecessary MCP Servers

In the MCP Settings, you'll see a list of enabled servers. **Disable the following servers to reduce tool count:**

#### Recommended Configuration (Keep These Enabled):

✅ **Keep: GitHub MCP Server** (if you need GitHub operations)
- Essential for repository management
- Tools: ~50

✅ **Keep: Memory MCP Server** (if you need knowledge graph)
- Useful for context management
- Tools: ~10

#### Recommended to Disable:

❌ **Disable: File System MCP Server** (if enabled)
- File operations are available natively
- Tools: ~20

❌ **Disable: Database MCP Server** (if enabled)
- Use native database tools instead
- Tools: ~15

❌ **Disable: API/HTTP MCP Server** (if enabled)
- Use native fetch/axios instead
- Tools: ~10

❌ **Disable: Development/Testing MCP Servers** (if enabled)
- Use native VS Code extensions
- Tools: ~10+

### Step 3: Alternative - Configure Tool-Level Filtering

If you need all MCP servers but want to reduce tool count, you can configure tool-level filtering:

```json
// In your VS Code settings.json (User settings)
{
  "mcp.servers": {
    "github": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN", "-e", "GITHUB_TOOLSETS", "-e", "GITHUB_READ_ONLY", "ghcr.io/github/github-mcp-server"],
      "disabledTools": [
        "mcp_github_get_file_contents",
        "mcp_github_list_branches",
        // Add tools you don't need
      ]
    }
  }
}
```

### Step 4: Verify Tool Count

After disabling servers:
1. Restart VS Code
2. Check the tool count in the status bar or MCP settings
3. Ensure it's below 60 tools

## Project-Level MCP Configuration

If you want project-specific MCP settings (recommended for this project), create a `.vscode/mcp.json` file:

```json
{
  "mcp": {
    "servers": {
      "github": {
        "enabled": true,
        "command": "docker",
        "args": ["run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN", "-e", "GITHUB_TOOLSETS", "-e", "GITHUB_READ_ONLY", "ghcr.io/github/github-mcp-server"],
        "env": {
          "GITHUB_PERSONAL_ACCESS_TOKEN": "${env:GITHUB_PERSONAL_ACCESS_TOKEN}",
          "GITHUB_TOOLSETS": "issues,pull_requests,commits,repositories",
          "GITHUB_READ_ONLY": "true"
        }
      },
      "memory": {
        "enabled": true,
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-memory"]
      }
    }
  }
}
```

## Quick Fix Steps (For Immediate Relief)

If you need an immediate fix, follow these steps:

1. **Open MCP Settings**: `Ctrl+Shift+P` → "Open MCP Settings"
2. **Disable all MCP servers except:**
   - GitHub MCP Server
   - Memory MCP Server
3. **Restart VS Code**
4. **Verify tool count is below 60**

## Monitoring Tool Count

To keep track of your tool count:

1. Look at the VS Code status bar (bottom right)
2. You should see an MCP indicator showing the number of tools
3. If it exceeds 60, consider disabling more servers

## Best Practices

1. **Only enable MCP servers you actively use**
2. **Use project-specific MCP configurations** when possible
3. **Regularly review and disable unused servers**
4. **Prefer native VS Code features** over MCP tools when available
5. **Keep tool count under 60** for optimal performance

## Troubleshooting

### Tool count still high after disabling servers?

1. Make sure you restarted VS Code after changes
2. Check both user settings and workspace settings
3. Look for multiple MCP configuration files
4. Clear VS Code cache: `Ctrl+Shift+P` → "Developer: Reload Window"

### Can't find MCP Settings?

1. Ensure you have the MCP extension installed
2. Check VS Code extensions marketplace for "MCP"
3. Look for "Model Context Protocol" in settings

## Summary

To permanently fix the "Too many tools enabled" issue:

1. ✅ Disable unnecessary MCP servers in VS Code settings
2. ✅ Keep only essential servers (GitHub + Memory = ~60 tools)
3. ✅ Restart VS Code to apply changes
4. ✅ Verify tool count is below 60
5. ✅ Consider project-specific MCP configuration

This will provide a permanent solution and prevent the issue from recurring.
