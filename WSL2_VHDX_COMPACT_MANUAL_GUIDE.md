# WSL2 VHDX Compact Operation - Manual Execution Guide

## Current Status
- **Pre-execution Verification:** ✅ Complete
- **All 7 Docker Containers:** ✅ Running and healthy
- **Database Connectivity:** ✅ Confirmed (accepting connections)
- **VHDX File Size:** 63.5625 GB (before optimization)
- **C Drive Free Space:** 48.59 GB (before optimization)

## Manual Execution Steps

### Step 1: Open Elevated PowerShell
1. Right-click on the Start button
2. Select "Windows PowerShell (Admin)" or "Terminal (Admin)"
3. Click "Yes" when prompted by UAC

### Step 2: Execute the VHDX Compact Command
Copy and paste the following command into the elevated PowerShell window:

```powershell
Optimize-VHD -Path "C:\Users\User\AppData\Local\Docker\wsl\disk\docker_data.vhdx" -Mode Full
```

**Expected Behavior:**
- The command will take 5-10 minutes to complete
- You will see progress indicators
- No output indicates successful completion

### Step 3: Verify the Optimization
After the command completes, run this command to check the new VHDX size:

```powershell
(Get-Item "C:\Users\User\AppData\Local\Docker\wsl\disk\docker_data.vhdx").Length / 1GB
```

**Expected Result:** The size should be reduced from 63.5625 GB (approximately 5-10 GB reduction)

### Step 4: Check C Drive Free Space
Run this command to verify space recovery:

```powershell
Get-PSDrive C | Select-Object Used,Free
```

**Expected Result:** Free space should increase by approximately 5-10 GB

### Step 5: Verify Docker Containers
After completing the above steps, verify all containers are running:

```powershell
docker ps
```

**Expected Result:** All 7 containers should be running and healthy

### Step 6: Verify Database Connectivity
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

### If "Access Denied" Error
Ensure you are running PowerShell as Administrator (elevated).

### If Docker Desktop doesn't start automatically
1. Open Docker Desktop from Start menu
2. Wait 5-10 minutes for all containers to restart
3. Verify with `docker ps`

## Post-Execution Verification Checklist
- [ ] VHDX size reduced (check with PowerShell command)
- [ ] C drive free space increased (check with PowerShell command)
- [ ] All 7 Docker containers running (check with `docker ps`)
- [ ] All containers healthy (check with `docker ps`)
- [ ] Database accepting connections (check with `docker exec smarttech_postgres pg_isready`)
- [ ] Project directory unaffected (verify files exist)

## Report Results
After completing the manual operation, please report:
1. New VHDX file size (in GB)
2. New C drive free space (in GB)
3. Actual space recovered (in GB)
4. Any issues encountered
5. Confirmation that all containers restarted successfully
