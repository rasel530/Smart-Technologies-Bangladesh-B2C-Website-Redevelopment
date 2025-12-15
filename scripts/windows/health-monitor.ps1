# Smart Technologies Bangladesh - PowerShell Health Monitor Script
# This script provides health checks for all services

Write-Host "========================================
Write-Host "Smart Technologies Health Monitor"
Write-Host "========================================"
Write-Host "Health check at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""

# Set working directory to project root
Set-Location "$PSScriptRoot\..\.."

# Initialize counters
$healthyCount = 0
$totalCount = 0

# Function to check service health
function Test-ServicePort {
    param(
        [string]$ServiceName,
        [int]$Port
    )
    
    $totalCount++
    
    Write-Host "Checking $ServiceName..."
    
    # Check if service is listening on port
    $portCheck = netstat -an | find ":$Port" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ $ServiceName (port $Port) - Listening"
        $healthyCount++
        Write-Host "   [$((Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))] ✓ $ServiceName is listening" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $ServiceName (port $Port) - Not listening"
        Write-Host "   [$((Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))] ✗ $ServiceName is not listening" -ForegroundColor Red
    }
}

# Function to check Docker Desktop
function Test-DockerDesktop {
    Write-Host "Docker Desktop Status:"
    
    try {
        $dockerVersion = docker --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✓ Docker Desktop is running"
            Write-Host "   $dockerVersion"
            $healthyCount++
        } else {
            Write-Host "   ✗ Docker Desktop is not running"
            Write-Host "   [$((Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))] ✗ Docker Desktop is not running" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ✗ Docker Desktop check failed: $_"
        Write-Host "   [$((Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))] ✗ Docker Desktop check failed" -ForegroundColor Red
    }
}

# Function to check Docker Compose services
function Test-DockerComposeServices {
    Write-Host "Docker Compose Services Status:"
    
    try {
        $services = docker-compose ps --format "table {{.Names}}" 2>$null
        if ($services) {
            Write-Host "Services found:"
            $services | ForEach-Object {
                Write-Host "   - $($_.Names)"
                $totalCount++
            }
        } else {
            Write-Host "   No services found"
        }
    } catch {
        Write-Host "   ✗ Docker Compose check failed: $_"
        Write-Host "   [$((Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))] ✗ Docker Compose check failed" -ForegroundColor Red
    }
}

# Function to check system resources
function Test-SystemResources {
    Write-Host "System Resource Usage:"
    
    # Memory usage
    try {
        $memoryInfo = Get-CimInstance Win32_OperatingSystem | Select-Object TotalVisibleMemorySize,FreePhysicalMemory
        if ($memoryInfo) {
            $totalMemory = [math]::Round($memoryInfo.TotalVisibleMemorySize / 1GB, 2)
            $freeMemory = [math]::Round($memoryInfo.FreePhysicalMemory / 1GB, 2)
            $usedMemory = $totalMemory - $freeMemory
            $memoryUsagePercent = [math]::Round(($usedMemory / $totalMemory) * 100, 0)
            
            Write-Host "   Total Memory: $([math]::Round($totalMemory, 2)) GB"
            Write-Host "   Used Memory: $([math]::Round($usedMemory, 2)) GB ($memoryUsagePercent%)"
            Write-Host "   Free Memory: $([math]::Round($freeMemory, 2)) GB"
            
            if ($memoryUsagePercent -gt 85) {
                Write-Host "   ⚠ High memory usage detected" -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host "   ✗ Memory check failed: $_"
        Write-Host "   [$((Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))] ✗ Memory check failed" -ForegroundColor Red
    }
    
    # Disk usage
    try {
        Write-Host "Disk usage for Docker:"
        docker system df | ForEach-Object {
            Write-Host "   $($_.Type) $($_.Size) $($_.SizePercent)"
        }
    } catch {
        Write-Host "   ✗ Disk check failed: $_"
        Write-Host "   [$((Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))] ✗ Disk check failed" -ForegroundColor Red
    }
}

# Function to display service URLs
function Show-ServiceURLs {
    Write-Host ""
    Write-Host "Service Access URLs:"
    Write-Host "   Frontend: http://localhost:3000"
    Write-Host "   Backend API: http://localhost:3001"
    Write-Host "   PgAdmin: http://localhost:5050 (admin@smarttech.com / admin123)"
    Write-Host "   Elasticsearch: http://localhost:9200"
    Write-Host "   Qdrant: http://localhost:6333"
    Write-Host "   Redis CLI: redis-cli -h localhost -p 6379"
    Write-Host "   PostgreSQL: psql -h localhost -p 5432 -U smart_dev -d smart_ecommerce_dev"
}

# Function to calculate health score
function Calculate-HealthScore {
    if ($totalCount -gt 0) {
        $healthScore = [math]::Round(($healthyCount / $totalCount) * 100, 0)
    } else {
        $healthScore = 0
    }
}

# Function to display overall status
function Show-OverallStatus {
    Write-Host ""
    Write-Host "Health Summary:"
    Write-Host "   Total Services: $totalCount"
    Write-Host "   Healthy Services: $healthyCount"
    Write-Host "   Health Score: $healthScore%"
    
    if ($healthScore -ge 80) {
        Write-Host "OVERALL STATUS: EXCELLENT" -ForegroundColor Green
        Write-Host "   All systems are operating normally."
    } elseif ($healthScore -ge 60) {
        Write-Host "OVERALL STATUS: GOOD" -ForegroundColor Yellow
        Write-Host "   Most systems are operating normally with minor issues."
    } elseif ($healthScore -ge 40) {
        Write-Host "OVERALL STATUS: FAIR" -ForegroundColor Red
        Write-Host "   Some systems have issues that need attention."
    } else {
        Write-Host "OVERALL STATUS: POOR" -ForegroundColor Red
        Write-Host "   Multiple systems have critical issues requiring immediate attention."
    }
}

# Function to display troubleshooting info
function Show-TroubleshootingInfo {
    Write-Host ""
    Write-Host "To troubleshoot:"
    Write-Host "   Start all services: scripts\windows\startup-services-enhanced.bat"
    Write-Host "   Stop all services: scripts\windows\stop-services.bat"
    Write-Host "   View logs: docker-compose logs -f [service-name]"
    Write-Host "   Restart specific service: docker-compose restart [service-name]"
}

# Main execution
try {
    Write-Host "========================================"
    Write-Host "Starting health checks..."
    
    # Check Docker Desktop
    Test-DockerDesktop
    
    # Check Docker Compose services
    Test-DockerComposeServices
    
    # Check individual service ports
    Write-Host "Port Availability Check:"
    Test-ServicePort "PostgreSQL" 5432
    Test-ServicePort "Redis" 6379
    Test-ServicePort "Elasticsearch" 9200
    Test-ServicePort "Qdrant" 6333
    Test-ServicePort "Backend API" 3001
    Test-ServicePort "Frontend" 3000
    Test-ServicePort "PgAdmin" 5050
    
    # Check system resources
    Test-SystemResources
    
    # Display service URLs
    Show-ServiceURLs
    
    # Calculate and display health summary
    Calculate-HealthScore
    Show-OverallStatus
    
    # Display troubleshooting info
    Show-TroubleshootingInfo
    
    Write-Host "========================================"
    Write-Host "Health Check Complete!"
    Write-Host ""
    Write-Host "Press any key to continue..."
    
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
} catch {
    Write-Host "✗ Health check failed: $_" -ForegroundColor Red
    Write-Host "[$((Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))] ✗ Health check failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Press any key to continue..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

Write-Host ""
Write-Host "To exit, press Ctrl+C"