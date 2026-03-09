# Simple fix for removeChild calls - adds null check before document.body.removeChild

# Pattern to find and replace:
# OLD: document.body.removeChild(a);
# NEW: if (document.body && a.parentNode === document.body) { document.body.removeChild(a); }

$files = Get-ChildItem -Path "frontend/src" -Recurse -Include *.tsx,*.ts | Select-String -Pattern "document\.body\.removeChild\(" | Select-Object -Unique Path

$count = 0
$modified = 0

foreach ($match in $files) {
    $file = $match.Path
    $count++
    Write-Host "[$count] Processing: $file"

    $content = Get-Content $file -Raw -Encoding UTF8

    # Find all removeChild calls and extract the variable name
    $pattern = 'document\.body\.removeChild\((\w+)\);'
    $matches = [regex]::Matches($content, $pattern)

    if ($matches.Count -gt 0) {
        Write-Host "  Found $($matches.Count) removeChild call(s)"

        # Process each match in reverse order to preserve positions
        foreach ($match in ($matches | Sort-Object Index -Descending)) {
            $varName = $match.Groups[1].Value
            $oldText = $match.Value
            $newText = "if (document.body && $varName.parentNode === document.body) { document.body.removeChild($varName); }"

            $content = $content.Remove($match.Index, $match.Length).Insert($match.Index, $newText)
        }

        Set-Content $file -Value $content -Encoding UTF8 -NoNewline
        $modified++
        Write-Host "  Fixed!"
    }
}

Write-Host "`n=== Summary ==="
Write-Host "Total files with removeChild: $count"
Write-Host "Files modified: $modified"
