param(
  [string]$Version = "0.3.12"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$AppSource = Join-Path $RepoRoot "app"
$BuildRoot = Join-Path $RepoRoot "build"
$PortableRoot = Join-Path $BuildRoot "portable"
$DistRoot = Join-Path $RepoRoot "dist"
$ElectronDist = Join-Path $RepoRoot "dist-electron"
$SetupExe = Join-Path $DistRoot "LittleBirdSetup.exe"
$PortableZip = Join-Path $DistRoot "little-bird-local-app.zip"

function Reset-Directory($Path) {
  if (Test-Path $Path) {
    Remove-Item -LiteralPath $Path -Recurse -Force
  }
  New-Item -ItemType Directory -Force -Path $Path | Out-Null
}

function Copy-App($Destination) {
  Reset-Directory $Destination
  Get-ChildItem -LiteralPath $AppSource -Force |
    Where-Object { $_.Name -notin @(".env", ".little-bird-tokens.json", ".little-bird-oauth-state.json") } |
    ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $Destination -Recurse -Force }
}

function Compress-Directory($Source, $Destination) {
  if (Test-Path $Destination) {
    Remove-Item -LiteralPath $Destination -Force
  }
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  [System.IO.Compression.ZipFile]::CreateFromDirectory($Source, $Destination, [System.IO.Compression.CompressionLevel]::Optimal, $false)
}

if (-not (Test-Path (Join-Path $RepoRoot "node_modules"))) {
  Push-Location $RepoRoot
  try {
    if (Test-Path (Join-Path $RepoRoot "package-lock.json")) {
      npm ci
    } else {
      npm install
    }
  } finally {
    Pop-Location
  }
}

Reset-Directory $DistRoot
if (Test-Path $ElectronDist) {
  Remove-Item -LiteralPath $ElectronDist -Recurse -Force
}

Copy-App $PortableRoot
Compress-Directory $PortableRoot $PortableZip

Push-Location $RepoRoot
try {
  npm run dist:win -- --config.extraMetadata.version=$Version
} finally {
  Pop-Location
}

$BuiltInstaller = Get-ChildItem -LiteralPath $ElectronDist -Filter "LittleBirdSetup.exe" -Recurse | Select-Object -First 1
if (-not $BuiltInstaller) {
  throw "Electron Builder did not produce LittleBirdSetup.exe."
}

Copy-Item -LiteralPath $BuiltInstaller.FullName -Destination $SetupExe -Force

Write-Host "Built desktop installer: $SetupExe"
Write-Host "Built portable app zip: $PortableZip"
