param(
  [string]$Version = "0.2.1"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$AppSource = Join-Path $RepoRoot "app"
$InstallerSource = Join-Path $RepoRoot "installer"
$BuildRoot = Join-Path $RepoRoot "build\installer"
$PayloadRoot = Join-Path $BuildRoot "payload"
$PackageRoot = Join-Path $BuildRoot "package"
$DistRoot = Join-Path $RepoRoot "dist"
$SetupExe = Join-Path $DistRoot "LittleBirdSetup.exe"
$PortableZip = Join-Path $DistRoot "little-bird-local-app.zip"
$PayloadZip = Join-Path $PackageRoot "little-bird-payload.zip"

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

Reset-Directory $BuildRoot
New-Item -ItemType Directory -Force -Path $PayloadRoot, $PackageRoot, $DistRoot | Out-Null

$PayloadApp = Join-Path $PayloadRoot "app"
$PayloadRuntime = Join-Path $PayloadRoot "runtime"
Copy-App $PayloadApp
New-Item -ItemType Directory -Force -Path $PayloadRuntime | Out-Null

$NodeCommand = Get-Command node -ErrorAction Stop
Copy-Item -LiteralPath $NodeCommand.Source -Destination (Join-Path $PayloadRuntime "node.exe") -Force

$InstallerScript = Get-Content (Join-Path $InstallerSource "install-little-bird.ps1") -Raw
$InstallerScript = $InstallerScript -replace "\?v=[0-9.]+", "?v=$Version"
Set-Content -Path (Join-Path $PackageRoot "install-little-bird.ps1") -Value $InstallerScript -Encoding UTF8
Copy-Item -LiteralPath (Join-Path $InstallerSource "install-little-bird.cmd") -Destination $PackageRoot -Force

Compress-Directory $PayloadRoot $PayloadZip
Copy-App (Join-Path $BuildRoot "portable")
Compress-Directory (Join-Path $BuildRoot "portable") $PortableZip

$SedPath = Join-Path $BuildRoot "LittleBirdSetup.sed"
$SedContent = @"
[Version]
Class=IEXPRESS
SEDVersion=3

[Options]
PackagePurpose=InstallApp
ShowInstallProgramWindow=1
HideExtractAnimation=0
UseLongFileName=1
InsideCompressed=0
CAB_FixedSize=0
CAB_ResvCodeSigning=0
RebootMode=N
InstallPrompt=%InstallPrompt%
DisplayLicense=%DisplayLicense%
FinishMessage=%FinishMessage%
TargetName=%TargetName%
FriendlyName=%FriendlyName%
AppLaunched=%AppLaunched%
PostInstallCmd=%PostInstallCmd%
AdminQuietInstCmd=%AdminQuietInstCmd%
UserQuietInstCmd=%UserQuietInstCmd%
SourceFiles=SourceFiles

[SourceFiles]
SourceFiles0=$PackageRoot\

[SourceFiles0]
%FILE0%=
%FILE1%=
%FILE2%=

[Strings]
InstallPrompt=This will install Little Bird locally, set up the local server runtime, and attempt to install Ollama plus the qwen2.5:3b model.
DisplayLicense=
FinishMessage=Little Bird setup has finished.
TargetName=$SetupExe
FriendlyName=Little Bird Setup
AppLaunched=install-little-bird.cmd
PostInstallCmd=<None>
AdminQuietInstCmd=install-little-bird.cmd
UserQuietInstCmd=install-little-bird.cmd
FILE0=install-little-bird.cmd
FILE1=install-little-bird.ps1
FILE2=little-bird-payload.zip
"@

Set-Content -Path $SedPath -Value $SedContent -Encoding ASCII
$IExpress = Join-Path $env:SystemRoot "System32\iexpress.exe"
if (-not (Test-Path $IExpress)) {
  throw "IExpress was not found at $IExpress. Build this installer on Windows."
}

$Process = Start-Process -FilePath $IExpress -ArgumentList @("/N", "/Q", $SedPath) -Wait -PassThru -WindowStyle Hidden
if ($Process.ExitCode -ne 0) {
  throw "IExpress failed with exit code $($Process.ExitCode)."
}

Write-Host "Built $SetupExe"
Write-Host "Built $PortableZip"
