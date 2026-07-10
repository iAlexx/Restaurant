param(
    [switch]$SkipAgentBuild,
    [switch]$SkipInstaller
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$agentDir = Join-Path $root "print-agent"
$trayDir = Join-Path $root "print-agent-desktop\RestaurantPrintTray"
$installerDir = Join-Path $root "print-agent-desktop\installer"
$publishDir = Join-Path $root "print-agent-desktop\dist\publish"
$releaseDir = Join-Path $root "print-agent-desktop\release"

Write-Host "== Restaurant Print — full installer build =="

if (-not $SkipAgentBuild) {
    Write-Host "[1/4] Building print-agent release..."
    Push-Location $agentDir
    npm run build:release
    if ($LASTEXITCODE -ne 0) { throw "print-agent build failed" }
    Pop-Location
}

Write-Host "[2/4] Publishing RestaurantPrintTray (self-contained win-x64)..."
if (Test-Path $publishDir) {
    Remove-Item $publishDir -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $publishDir | Out-Null

Push-Location $trayDir
dotnet publish RestaurantPrintTray.csproj `
    -c Release `
    -r win-x64 `
    --self-contained true `
    -p:PublishSingleFile=true `
    -p:IncludeNativeLibrariesForSelfExtract=true `
    -p:EnableCompressionInSingleFile=true `
    -o $publishDir
if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed" }
Pop-Location

$agentExe = Join-Path $agentDir "release\RestaurantPrintAgent.exe"
if (-not (Test-Path $agentExe)) {
    throw "Missing $agentExe"
}

Write-Host "[3/4] Verifying payload..."
$trayExe = Join-Path $publishDir "RestaurantPrintTray.exe"
if (-not (Test-Path $trayExe)) {
    throw "Missing $trayExe"
}

$fontsDir = Join-Path $agentDir "assets\fonts"
if (-not (Test-Path $fontsDir)) {
    throw "Missing fonts directory: $fontsDir (run npm run download-fonts)"
}

if ($SkipInstaller) {
    Write-Host "Installer step skipped."
    exit 0
}

Write-Host "[4/4] Compiling Inno Setup installer..."
$isccCandidates = @(
    "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
    "$env:ProgramFiles\Inno Setup 6\ISCC.exe"
)

$iscc = $isccCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $iscc) {
    throw "Inno Setup 6 not found. Install from https://jrsoftware.org/isinfo.php"
}

New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null
Push-Location $installerDir
& $iscc "RestaurantPrint.iss"
if ($LASTEXITCODE -ne 0) { throw "Inno Setup compile failed" }
Pop-Location

$installer = Join-Path $releaseDir "RestaurantPrintSetup-x64.exe"
if (-not (Test-Path $installer)) {
    throw "Installer not produced at $installer"
}

$sizeMb = [math]::Round((Get-Item $installer).Length / 1MB, 2)
Write-Host ""
Write-Host "SUCCESS"
Write-Host "Installer: $installer"
Write-Host "Size: $sizeMb MB"
