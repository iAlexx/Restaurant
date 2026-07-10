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
$installerName = "RestaurantPrintSetup-x64.exe"
$installerPath = Join-Path $releaseDir $installerName

function Find-InnoSetupCompiler {
    $candidates = @(
        "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
        "$env:ProgramFiles\Inno Setup 6\ISCC.exe"
    )

    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            return (Resolve-Path $candidate).Path
        }
    }

    return $null
}

function Ensure-DotNetOnPath {
    $userDotnet = Join-Path $env:USERPROFILE ".dotnet\dotnet.exe"
    if (Test-Path $userDotnet) {
        $dotnetDir = Split-Path $userDotnet -Parent
        if ($env:PATH -notlike "*$dotnetDir*") {
            $env:PATH = "$dotnetDir;$env:PATH"
        }
        $env:DOTNET_ROOT = $dotnetDir
    }

    $version = & dotnet --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw @"
.NET SDK not found on PATH.
Install .NET 8 SDK: winget install Microsoft.DotNet.SDK.8
"@
    }

    Write-Host "dotnet SDK: $version"
}

function Write-Failure($message) {
    Write-Host ""
    Write-Host "BUILD FAILED: $message" -ForegroundColor Red
    exit 1
}

Write-Host "== Restaurant Print - full installer build =="
Write-Host "Repo root: $root"
Write-Host "Installer output directory: $releaseDir"

Ensure-DotNetOnPath
New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null

if (-not $SkipAgentBuild) {
    Write-Host ""
    Write-Host '[1/5] Building print-agent release (RestaurantPrintAgent.exe)...'
    Push-Location $agentDir
    try {
        npm run build:release
        if ($LASTEXITCODE -ne 0) {
            Write-Failure ('print-agent build failed (exit ' + $LASTEXITCODE + ')')
        }
    } finally {
        Pop-Location
    }
} else {
    Write-Host ""
    Write-Host '[1/5] Skipping print-agent build (-SkipAgentBuild)'
}

Write-Host ""
Write-Host '[2/5] Running RestaurantPrintTray tests...'
Push-Location (Join-Path $root "print-agent-desktop\RestaurantPrintTray.Tests")
try {
    dotnet restore RestaurantPrintTray.Tests.csproj | Out-Host
    dotnet test -c Release --no-restore 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) {
        Write-Failure ('RestaurantPrintTray tests failed (exit ' + $LASTEXITCODE + ')')
    }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host '[3/5] Publishing RestaurantPrintTray (self-contained win-x64)...'
if (Test-Path $publishDir) {
    Remove-Item $publishDir -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $publishDir | Out-Null

Push-Location $trayDir
try {
    dotnet publish RestaurantPrintTray.csproj `
        -c Release `
        -r win-x64 `
        --self-contained true `
        -p:PublishSingleFile=true `
        -p:IncludeNativeLibrariesForSelfExtract=true `
        -p:EnableCompressionInSingleFile=true `
        -o $publishDir
    if ($LASTEXITCODE -ne 0) {
        Write-Failure ('dotnet publish failed (exit ' + $LASTEXITCODE + ')')
    }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host '[4/5] Verifying installer payload...'
$agentExe = Join-Path $agentDir "release\RestaurantPrintAgent.exe"
$trayExe = Join-Path $publishDir "RestaurantPrintTray.exe"
$fontsDir = Join-Path $agentDir "assets\fonts"

foreach ($required in @($agentExe, $trayExe)) {
    if (-not (Test-Path $required)) {
        Write-Failure ('Missing required file: ' + $required)
    }
    $item = Get-Item $required
    $sizeLabel = '{0:N2} MB' -f ($item.Length / 1MB)
    Write-Host ('  OK ' + $item.FullName + ' (' + $sizeLabel + ')')
}

if (-not (Test-Path $fontsDir)) {
    Write-Failure ('Missing fonts directory: ' + $fontsDir + '. Run: cd print-agent; npm run download-fonts')
}

$requiredFonts = @(
    "Cairo-Variable.ttf",
    "Numeric-Regular.ttf"
)

foreach ($fontName in $requiredFonts) {
    $fontPath = Join-Path $fontsDir $fontName
    if (-not (Test-Path $fontPath)) {
        Write-Failure ('Missing required font: ' + $fontPath + '. Run: cd print-agent; npm run download-fonts')
    }
    $font = Get-Item $fontPath
    Write-Host ('  OK ' + $font.FullName + ' (' + $font.Length + ' bytes)')
}

if ($SkipInstaller) {
    Write-Host ""
    Write-Host 'Installer step skipped (-SkipInstaller).'
    exit 0
}

Write-Host ""
Write-Host '[5/5] Compiling Inno Setup installer...'
$iscc = Find-InnoSetupCompiler
if (-not $iscc) {
    Write-Host ""
    Write-Host "Inno Setup 6 ISCC.exe was not found. Checked:" -ForegroundColor Yellow
    Write-Host "  - ${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe"
    Write-Host "  - $env:ProgramFiles\Inno Setup 6\ISCC.exe"
    Write-Host ""
    Write-Host "Install with:" -ForegroundColor Yellow
    Write-Host '  winget install --id JRSoftware.InnoSetup -e'
    Write-Failure "Inno Setup 6 not installed"
}

Write-Host "  ISCC: $iscc"
Write-Host "  ISS:  $(Join-Path $installerDir 'RestaurantPrint.iss')"
Write-Host ('  OutputDir from ISS: ' + $releaseDir)
Write-Host '  OutputBaseFilename from ISS: RestaurantPrintSetup-x64'

Push-Location $installerDir
try {
    & $iscc "RestaurantPrint.iss"
    if ($LASTEXITCODE -ne 0) {
        Write-Failure ('Inno Setup compile failed (exit ' + $LASTEXITCODE + ')')
    }
} finally {
    Pop-Location
}

if (-not (Test-Path $installerPath)) {
    Write-Failure ('Installer not produced at expected path: ' + $installerPath)
}

$installerItem = Get-Item $installerPath
$sizeBytes = $installerItem.Length
$sizeMb = [math]::Round($sizeBytes / 1MB, 2)

Write-Host ""
Write-Host "SUCCESS - Windows installer built" -ForegroundColor Green
Write-Host '  Type:     Inno Setup installer (NOT the portable agent ZIP)'
Write-Host "  Path:     $($installerItem.FullName)"
Write-Host ('  Size:     ' + $sizeMb + ' MB (' + $sizeBytes + ' bytes)')
Write-Host ""
Write-Host "Contents of $releaseDir :"
Get-ChildItem $releaseDir | ForEach-Object {
    Write-Host ('  {0,-40} {1,12} bytes  ({2:N2} MB)' -f $_.Name, $_.Length, ($_.Length / 1MB))
}

Write-Host ""
Write-Host "NOTE: print-agent\release\ contains the portable agent only."
Write-Host "      The setup installer is always: print-agent-desktop\release\$installerName"
