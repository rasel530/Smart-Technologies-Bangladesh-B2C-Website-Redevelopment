# Search Pages API Test Script
# Tests all endpoints for Analytics, Performance, and Optimization pages

$baseUrl = "http://localhost:3001"
$results = @()

function Test-Endpoint {
    param([string]$name, [string]$endpoint, [bool]$requiresAuth)
    $url = "$baseUrl$endpoint"
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 10 -ErrorAction SilentlyContinue
        $statusCode = $response.StatusCode
        $content = $response.Content | ConvertFrom-Json
        $success = $true
        if ($requiresAuth -and $statusCode -eq 401) {
            $success = $true  # Expected behavior for unauthenticated requests
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        if (-not $statusCode) { $statusCode = "Error" }
        $success = $false
    }
    return [PSCustomObject]@{
        Name = $name
        Endpoint = $endpoint
        StatusCode = $statusCode
        Success = $success
    }
}

Write-Host "=== ANALYTICS ENDPOINTS ===" -ForegroundColor Cyan
$results += Test-Endpoint "Metrics" "/api/v1/search-analytics/metrics?timeRange=week" $false
$results += Test-Endpoint "Popular" "/api/v1/search-analytics/popular?limit=10" $false
$results += Test-Endpoint "Trends" "/api/v1/search-analytics/trends?timeRange=week" $false
$results += Test-Endpoint "Zero Results" "/api/v1/search-performance/zero-results?limit=10" $false

Write-Host "`n=== PERFORMANCE ENDPOINTS ===" -ForegroundColor Cyan
$results += Test-Endpoint "Comparison" "/api/v1/search-performance/comparison?currentRange=week&previousRange=previous_week" $true
$results += Test-Endpoint "Response Time Distribution" "/api/v1/search-performance/response-time-distribution?timeRange=week" $true
$results += Test-Endpoint "Realtime" "/api/v1/search-performance/realtime" $true
$results += Test-Endpoint "Alerts" "/api/v1/search-performance/alerts?severity=high" $true
$results += Test-Endpoint "Cache Stats" "/api/v1/search-performance/cache-stats?timeRange=week" $true

Write-Host "`n=== OPTIMIZATION ENDPOINTS ===" -ForegroundColor Cyan
$results += Test-Endpoint "Insights" "/api/v1/search-optimization/insights?timeRange=week" $true
$results += Test-Endpoint "Relevance Metrics" "/api/v1/search-optimization/relevance-metrics?timeRange=week" $true
$results += Test-Endpoint "Patterns" "/api/v1/search-optimization/patterns?timeRange=week" $true
$results += Test-Endpoint "Experiments" "/api/v1/search-optimization/experiments?limit=20" $true

Write-Host "`n=== RESULTS SUMMARY ===" -ForegroundColor Cyan
$results | Format-Table -AutoSize

$passed = ($results | Where-Object { $_.Success }).Count
$total = $results.Count
Write-Host "`nPassed: $passed / $total" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Yellow" })

# Export results to JSON
$results | ConvertTo-Json | Out-File -FilePath "test-results.json" -Encoding utf8
Write-Host "`nResults exported to test-results.json"
