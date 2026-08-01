# Turbopack Cache Clearing Procedure for Windows

## Complete Cache Refresh (Next.js 16.2.7 with Turbopack)

### Step 1: Stop All Development Servers
```powershell
# Stop any running Next.js dev servers
# Press Ctrl+C in all terminal windows running dev servers
# Or kill processes:
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Step 2: Kill Turbopack Daemon Process
```powershell
# Turbopack runs a background daemon that can lock cache files
# Kill it explicitly:
Get-Process turbopack -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Step 3: Delete Cache Directories
```powershell
# Navigate to project root
cd c:\xampp\htdocs\alwaseemhyber-erp-system\al-waseem-pos

# Delete Next.js cache (if exists)
if (Test-Path .next) {
    Remove-Item -Recurse -Force .next
    Write-Host "Deleted .next directory"
}

# Delete Turbopack cache (if exists)
if (Test-Path .turbo) {
    Remove-Item -Recurse -Force .turbo
    Write-Host "Deleted .turbo directory"
}

# Delete node_modules/.cache (if exists)
if (Test-Path node_modules\.cache) {
    Remove-Item -Recurse -Force node_modules\.cache
    Write-Host "Deleted node_modules\.cache directory"
}
```

### Step 4: Clear Turbopack Persistent State
```powershell
# Turbopack stores persistent state in AppData
$turboCachePath = "$env:LOCALAPPDATA\turbo"
if (Test-Path $turboCachePath) {
    Remove-Item -Recurse -Force $turboCachePath
    Write-Host "Deleted Turbopack AppData cache"
}

# Also clear Next.js Turbopack cache
$nextTurboCachePath = "$env:LOCALAPPDATA\Next.js"
if (Test-Path $nextTurboCachePath) {
    Remove-Item -Recurse -Force $nextTurboCachePath
    Write-Host "Deleted Next.js AppData cache"
}
```

### Step 5: Force Rebuild (No Cache)
```powershell
# Start dev server with --no-cache flag to bypass all caching
npm run dev -- --no-cache

# Or if using pnpm:
pnpm dev -- --no-cache

# Or if using yarn:
yarn dev -- --no-cache
```

### Step 6: Alternative - Production Build Clean
```powershell
# If dev server still has issues, try a production build to force regeneration
npm run build
npm start
```

### Step 7: Verify Cache is Cleared
```powershell
# Check that cache directories don't exist
Test-Path .next
Test-Path .turbo
Test-Path node_modules\.cache

# All should return False
```

## One-Script Solution
Save this as `clear-turbopack-cache.ps1` and run it:

```powershell
# Stop processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process turbopack -ErrorAction SilentlyContinue | Stop-Process -Force

# Delete project caches
cd c:\xampp\htdocs\alwaseemhyber-erp-system\al-waseem-pos
@('.next', '.turbo', 'node_modules\.cache') | ForEach-Object {
    if (Test-Path $_) {
        Remove-Item -Recurse -Force $_
        Write-Host "Deleted $_"
    }
}

# Delete AppData caches
@("$env:LOCALAPPDATA\turbo", "$env:LOCALAPPDATA\Next.js") | ForEach-Object {
    if (Test-Path $_) {
        Remove-Item -Recurse -Force $_
        Write-Host "Deleted $_"
    }
}

Write-Host "Cache cleared successfully. Run: npm run dev -- --no-cache"
```

## Important Notes
- **Always stop dev servers before clearing cache** - Turbopack holds file locks
- **Use --no-cache flag** on first restart after clearing
- **If files are locked**, restart your computer as a last resort
- **Turbopack daemon** may restart automatically - monitor process list
