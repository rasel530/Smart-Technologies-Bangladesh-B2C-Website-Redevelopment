# Fix removeChild calls to add null checks
# This prevents TypeError during logout when document.body becomes null

$files = @(
    "frontend/src/app/account/corporate/invoices/page.tsx",
    "frontend/src/app/admin/comparisons/analytics/page.tsx",
    "frontend/src/app/admin/comparisons/page.tsx",
    "frontend/src/app/admin/elasticsearch/synonyms/page.tsx",
    "frontend/src/app/admin/invoices/page.tsx",
    "frontend/src/app/admin/notifications/stats/page.tsx",
    "frontend/src/app/admin/notifications/page.tsx",
    "frontend/src/app/admin/orders/sharing/page.tsx",
    "frontend/src/app/admin/orders/page.tsx",
    "frontend/src/app/admin/payments/analytics/page.tsx",
    "frontend/src/app/admin/payments/logs/page.tsx",
    "frontend/src/app/admin/payments/page.tsx",
    "frontend/src/app/admin/search/analytics/page.tsx",
    "frontend/src/app/admin/search/users/[id]/page.tsx",
    "frontend/src/app/admin/wishlists/analytics/page.tsx",
    "frontend/src/app/admin/wishlists/users/page.tsx",
    "frontend/src/app/orders/[id]/page.tsx",
    "frontend/src/app/search/analytics/page.tsx",
    "frontend/src/components/account/DataExportSection.tsx",
    "frontend/src/components/admin/cart/CartDetail.tsx",
    "frontend/src/components/admin/cart/CartList.tsx",
    "frontend/src/components/admin/cart/InventoryImpact.tsx",
    "frontend/src/components/admin/cartWishlist/CartWishlistAnalytics.tsx",
    "frontend/src/components/admin/cartWishlist/CartWishlistSyncDashboard.tsx",
    "frontend/src/components/admin/cartWishlist/SyncConflictResolver.tsx",
    "frontend/src/components/admin/cartWishlist/UserBehaviorTracker.tsx",
    "frontend/src/components/admin/checkout/CheckoutAbandonmentTable.tsx",
    "frontend/src/components/admin/checkout/CheckoutSessionTable.tsx",
    "frontend/src/components/admin/checkout/GuestCheckoutTable.tsx",
    "frontend/src/components/comparisons/ExportComparison.tsx"
)

$count = 0
$modified = 0

foreach ($file in $files) {
    $count++
    Write-Host "Processing [$count/$($files.Count)] $file..."

    if (Test-Path $file) {
        $content = Get-Content $file -Raw -Encoding UTF8

        # Check if file contains the pattern
        if ($content -match 'document\.body\.removeChild\(') {
            Write-Host "  Found removeChild, fixing..."

            # Replace document.body.removeChild(element) with safe version
            # Pattern: document.body.removeChild(a) or document.body.removeChild(link)
            $oldPattern = '(\s+)(document\.body\.appendChild\([^)]+\);)\s+(\w+)\.click\(\);\s+(document\.body\.removeChild\(\w+\);)'
            $newReplacement = '$1$2$3.click();$1// Safe removal with null check to prevent error during logout$1if (document.body && $3.parentNode === document.body) {$1$4$1}'

            $newContent = $content -replace $oldPattern, $newReplacement

            # Only write if content changed
            if ($newContent -ne $content) {
                Set-Content $file -Value $newContent -Encoding UTF8 -NoNewline
                $modified++
                Write-Host "  Fixed!"
            } else {
                Write-Host "  No change needed"
            }
        } else {
            Write-Host "  No removeChild found"
        }
    } else {
        Write-Host "  File not found"
    }
}

Write-Host "`n=== Summary ==="
Write-Host "Total files processed: $count"
Write-Host "Files modified: $modified"
