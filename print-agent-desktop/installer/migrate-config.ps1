$ErrorActionPreference = "Stop"

$legacy = Join-Path $env:USERPROFILE ".restaurant-print"
$target = Join-Path $env:LOCALAPPDATA "RestaurantPrint"

if (-not (Test-Path $legacy)) {
    exit 0
}

New-Item -ItemType Directory -Force -Path $target | Out-Null

$files = @(
    "config.json",
    "device-token.dpapi",
    "pending-acks.json"
)

foreach ($file in $files) {
    $from = Join-Path $legacy $file
    $to = Join-Path $target $file
    if ((Test-Path $from) -and -not (Test-Path $to)) {
        Copy-Item $from $to
    }
}

Get-ChildItem -Path $legacy -Filter "*.log" -ErrorAction SilentlyContinue | ForEach-Object {
    $dest = Join-Path $target $_.Name
    if (-not (Test-Path $dest)) {
        Copy-Item $_.FullName $dest
    }
}

# Disable legacy scheduled task if present
schtasks /Query /TN "RestaurantPrintAgent" 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    schtasks /Change /TN "RestaurantPrintAgent" /DISABLE 2>$null | Out-Null
    schtasks /Delete /TN "RestaurantPrintAgent" /F 2>$null | Out-Null
}
