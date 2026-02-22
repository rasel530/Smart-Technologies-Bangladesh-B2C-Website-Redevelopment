# WSL2 VHDX Compact Operation - Corrected Execution Guide

## Error Encountered
```
Optimize-VHD : Failed to compact the virtual disk.
The process cannot access the file because it is being used by another process. (0x80070020).
```

**Cause:** Docker Desktop is still running and has the VHDX file locked.

## Corrected Execution Steps

### Step 1: Completely Shutdown Docker Desktop
**IMPORTANT:** We must fully stop Docker Desktop before optimizing the VHDX.

**Option A - Using Docker Desktop UI:**
1. Right-click on the Docker Desktop icon in the system tray
2. Select "Quit Docker Desktop"
3. Wait for Docker Desktop to completely shut down (30-60 seconds)
4. Verify Docker is stopped by running in PowerShell:
   ```powershell
   docker ps
   ```
   You should see: "error during connect: This error may indicate that the docker daemon is not running"

**Option B - Using PowerShell (if UI doesn't work):**
```powershell
Stop-Service -Name docker -Force
Stop-Service -Name com.docker.service -Force -ErrorAction SilentlyContinue
```

### Step 2: Verify Docker is Completely Stopped
Run this command to verify no Docker processes are running:
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*docker*"}
```

**Expected Result:** No Docker processes should be listed

### Step 3: Execute the VHDX Compact Command
Now that Docker is stopped, run the optimization command in your elevated PowerShell:

```powershell
Optimize-VHD -Path "C:\Users\User\AppData\Local\Docker\wsl\disk\docker_data.vhdx" -Mode Full
```

**Expected Behavior:**
- The command will take 5-10 minutes to complete
- You will see progress indicators
- No output indicates successful completion

### Step 4: Verify the Optimization
After the command completes, run this command to check the new VHDX size:

```powershell
(Get-Item "C:\Users\User\AppData\Local\Docker\wsl\disk\docker_data.vhdx").Length / 1GB
```

**Expected Result:** The size should be reduced from 63.5625 GB (approximately 5-10 GB reduction)

### Step 5: Check C Drive Free Space
Run this command to verify space recovery:

```powershell
Get-PSDrive C | Select-Object Used,Free
```

**Expected Result:** Free space should increase by approximately 5-10 GB

### Step 6: Restart Docker Desktop
1. Open Docker Desktop from the Start menu
2. Wait for Docker Desktop to start completely (2-3 minutes)
3. Wait for all containers to restart (5-10 minutes total)

### Step 7: Verify Docker Containers
After Docker Desktop restarts, verify all containers are running:

```powershell
docker ps
```

**Expected Result:** All 7 containers should be running and healthy:
- smarttech_frontend
- smarttech_backend (healthy)
- smarttech_pgadmin
- smarttech_postgres (healthy)
- smarttech_redis (healthy)
- smarttech_es_node1 (healthy)
- github-mcp-server

### Step 8: Verify Database Connectivity
Run this command to verify database is operational:

```powershell
docker exec smarttech_postgres pg_isready
```

**Expected Result:** `/var/run/postgresql:5432 - accepting connections`

## Safety Confirmation
- ✅ No database data will be lost
- ✅ All Docker containers will restart automatically
- ✅ Project data at E:\Drive_D_Backup\Smart_Tech_B2C_Website_Redevelopment is unaffected
- ✅ Docker volumes (including smarttech_postgres_data) are preserved
- ✅ This is a temporary shutdown - containers will restart after Docker Desktop is reopened

## Expected Space Recovery
- **Before:** 63.5625 GB VHDX, 48.59 GB free on C drive
- **After:** Approximately 53-58 GB VHDX, 53-58 GB free on C drive
- **Total Recovery:** 5-10 GB

## Troubleshooting

### If "Optimize-VHD : The term 'Optimize-VHD' is not recognized"
This means the Hyper-V module is not loaded. Run:
```powershell
Import-Module Hyper-V
```
Then retry the Optimize-VHD command.

### If Docker Desktop won't quit from UI
Use PowerShell to force stop:
```powershell
Stop-Process -Name "Docker Desktop" -Force
Stop-Process -Name "com.docker.backend" -Force
```

### If Containers don't restart automatically
1. Open Docker Desktop
2. Check if containers are starting in the Dashboard
3. If not, run: `docker-compose up -d` from the project directory

## Post-Execution Verification Checklist
- [ ] Docker Desktop completely stopped
- [ ] VHDX optimization completed successfully
- [ ] VHDX size reduced (check with PowerShell command)
- [ ] C drive free space increased (check with PowerShell command)
- [ ] Docker Desktop restarted
- [ ] All 7 Docker containers running (check with `docker ps`)
- [ ] All containers healthy (check with `docker ps`)
- [ ] Database accepting connections (check with `docker exec smarttech_postgres pg_isready`)
- [ ] Project directory unaffected (verify files exist)

## Report Results
After completing the operation, please report:
1. New VHDX file size (in GB)
2. New C drive free space (in GB)
3. Actual space recovered (in GB)
4. Any issues encountered
5. Confirmation that all containers restarted successfully
