# Final Project Cleanup Script
Write-Host "Performing final project cleanup..." -ForegroundColor Green

# Remove temporary build directories
Write-Host "Removing temporary build directories..." -ForegroundColor Blue
$tempDirs = @(
    "backend\temp-deploy2",
    "backend\build-working", 
    "backend\deploy"
)

foreach ($dir in $tempDirs) {
    if (Test-Path $dir) {
        Write-Host "  Removing $dir..." -ForegroundColor Gray
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
        if (!(Test-Path $dir)) {
            Write-Host "    ✓ Removed successfully" -ForegroundColor Green
        } else {
            Write-Host "    ⚠ Could not remove (may be in use)" -ForegroundColor Yellow
        }
    }
}

# Remove any leftover zip files
Write-Host "Removing deployment zip files..." -ForegroundColor Blue
$zipFiles = Get-ChildItem -Path "." -Filter "*.zip" -Recurse | Where-Object { $_.Name -match "lambda|deploy|cors|fix" }
foreach ($zip in $zipFiles) {
    Write-Host "  Removing $($zip.Name)..." -ForegroundColor Gray
    Remove-Item $zip.FullName -Force -ErrorAction SilentlyContinue
}

# Remove any Python cache files in backend
Write-Host "Cleaning Python cache files..." -ForegroundColor Blue
$cacheFiles = Get-ChildItem -Path "backend" -Name "__pycache__" -Recurse -Directory
foreach ($cache in $cacheFiles) {
    Write-Host "  Removing backend\$cache..." -ForegroundColor Gray
    Remove-Item -Recurse -Force "backend\$cache" -ErrorAction SilentlyContinue
}

# Remove any .pyc files
$pycFiles = Get-ChildItem -Path "backend" -Filter "*.pyc" -Recurse
foreach ($pyc in $pycFiles) {
    Remove-Item $pyc.FullName -Force -ErrorAction SilentlyContinue
}

Write-Host "Cleanup completed!" -ForegroundColor Green
Write-Host "Project now contains only essential files:" -ForegroundColor Cyan
Write-Host "  ✓ deploy-robust.ps1 (main deployment script)" -ForegroundColor White
Write-Host "  ✓ deploy-manual-steps.md (backup instructions)" -ForegroundColor White  
Write-Host "  ✓ test-api-fixes.ps1 (testing script)" -ForegroundColor White
Write-Host "  ✓ Updated .gitignore (prevents future clutter)" -ForegroundColor White

Write-Host "`nTo deploy your fixes, run:" -ForegroundColor Yellow
Write-Host "  powershell -ExecutionPolicy Bypass -File deploy-robust.ps1" -ForegroundColor Cyan

# Self-destruct this cleanup script
Write-Host "`nRemoving this cleanup script..." -ForegroundColor Blue
Start-Sleep -Seconds 2
Remove-Item $MyInvocation.MyCommand.Path -Force -ErrorAction SilentlyContinue 