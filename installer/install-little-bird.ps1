param(
  [string]$InstallRoot = "$env:LOCALAPPDATA\LittleBird",
  [switch]$SkipOllama,
  [switch]$NoShortcuts,
  [switch]$NoStart
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Write-Step($Message) {
  Write-Host ""
  Write-Host "== $Message"
}

function Find-Ollama {
  $cmd = Get-Command ollama -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }

  $local = Join-Path $env:LOCALAPPDATA "Programs\Ollama\ollama.exe"
  if (Test-Path $local) { return $local }

  $programFiles = Join-Path $env:ProgramFiles "Ollama\ollama.exe"
  if (Test-Path $programFiles) { return $programFiles }

  return $null
}

function Ensure-Ollama {
  if ($SkipOllama) {
    Write-Host "Skipping Ollama setup."
    return
  }

  $ollama = Find-Ollama
  if (-not $ollama) {
    Write-Step "Installing Ollama"
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if (-not $winget) {
      Write-Warning "winget is not available. Install Ollama manually from https://ollama.com/download/windows, then run: ollama pull qwen2.5:3b"
      return
    }

    & $winget.Source install --id Ollama.Ollama -e --accept-package-agreements --accept-source-agreements
    $ollama = Find-Ollama
  }

  if (-not $ollama) {
    Write-Warning "Ollama was not found after installation. Little Bird will still run with fallback replies."
    return
  }

  Write-Step "Starting Ollama"
  try {
    $tags = Invoke-WebRequest -Uri "http://127.0.0.1:11434/api/tags" -UseBasicParsing -TimeoutSec 2
    if ($tags.StatusCode -eq 200) {
      Write-Host "Ollama is already running."
    }
  } catch {
    Start-Process -FilePath $ollama -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 3
  }

  Write-Step "Downloading Little Bird local model"
  & $ollama pull qwen2.5:3b
}

function Write-LauncherScripts {
  $startScript = @'
param([int]$Port = 4173)

$ErrorActionPreference = "SilentlyContinue"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppDir = Join-Path $Root "app"
$Node = Join-Path $Root "runtime\node.exe"

if (-not (Test-Path $Node)) {
  $NodeCommand = Get-Command node -ErrorAction SilentlyContinue
  if (-not $NodeCommand) {
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show("Node.js is missing. Reinstall Little Bird or install Node.js 20+.", "Little Bird")
    exit 1
  }
  $Node = $NodeCommand.Source
}

$health = "http://127.0.0.1:$Port/api/health"
try {
  Invoke-WebRequest -Uri $health -UseBasicParsing -TimeoutSec 1 | Out-Null
} catch {
  $process = Start-Process -FilePath $Node -ArgumentList @("server.js", "--port=$Port", "--host=127.0.0.1") -WorkingDirectory $AppDir -WindowStyle Hidden -PassThru
  Set-Content -Path (Join-Path $Root "little-bird-server.pid") -Value $process.Id
  Start-Sleep -Seconds 2
}

Start-Process "http://127.0.0.1:$Port/?v=0.2.1"
'@

  $stopScript = @'
$ErrorActionPreference = "SilentlyContinue"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$PidFile = Join-Path $Root "little-bird-server.pid"
if (Test-Path $PidFile) {
  $ServerPid = Get-Content $PidFile | Select-Object -First 1
  if ($ServerPid) {
    Stop-Process -Id ([int]$ServerPid) -Force
  }
  Remove-Item $PidFile -Force
}
'@

  $uninstallScript = @'
$ErrorActionPreference = "SilentlyContinue"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
& (Join-Path $Root "Stop-LittleBird.ps1")
$desktop = [Environment]::GetFolderPath("Desktop")
$startMenu = Join-Path ([Environment]::GetFolderPath("Programs")) "Little Bird"
Remove-Item (Join-Path $desktop "Little Bird.lnk") -Force
Remove-Item $startMenu -Recurse -Force
Remove-Item $Root -Recurse -Force
'@

  Set-Content -Path (Join-Path $InstallRoot "Start-LittleBird.ps1") -Value $startScript -Encoding UTF8
  Set-Content -Path (Join-Path $InstallRoot "Stop-LittleBird.ps1") -Value $stopScript -Encoding UTF8
  Set-Content -Path (Join-Path $InstallRoot "Uninstall-LittleBird.ps1") -Value $uninstallScript -Encoding UTF8
}

function New-Shortcut($Path, $Target, $Arguments, $WorkingDirectory, $Description) {
  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($Path)
  $shortcut.TargetPath = $Target
  $shortcut.Arguments = $Arguments
  $shortcut.WorkingDirectory = $WorkingDirectory
  $shortcut.Description = $Description
  $shortcut.IconLocation = "$env:SystemRoot\System32\SHELL32.dll,167"
  $shortcut.Save()
}

function Write-Shortcuts {
  if ($NoShortcuts) { return }

  $powershell = Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0\powershell.exe"
  $startArgs = "-NoProfile -ExecutionPolicy Bypass -File `"$InstallRoot\Start-LittleBird.ps1`""
  $stopArgs = "-NoProfile -ExecutionPolicy Bypass -File `"$InstallRoot\Stop-LittleBird.ps1`""
  $uninstallArgs = "-NoProfile -ExecutionPolicy Bypass -File `"$InstallRoot\Uninstall-LittleBird.ps1`""

  $desktop = [Environment]::GetFolderPath("Desktop")
  $startMenu = Join-Path ([Environment]::GetFolderPath("Programs")) "Little Bird"
  New-Item -ItemType Directory -Force -Path $startMenu | Out-Null

  New-Shortcut -Path (Join-Path $desktop "Little Bird.lnk") -Target $powershell -Arguments $startArgs -WorkingDirectory $InstallRoot -Description "Start Little Bird"
  New-Shortcut -Path (Join-Path $startMenu "Little Bird.lnk") -Target $powershell -Arguments $startArgs -WorkingDirectory $InstallRoot -Description "Start Little Bird"
  New-Shortcut -Path (Join-Path $startMenu "Stop Little Bird.lnk") -Target $powershell -Arguments $stopArgs -WorkingDirectory $InstallRoot -Description "Stop Little Bird local server"
  New-Shortcut -Path (Join-Path $startMenu "Uninstall Little Bird.lnk") -Target $powershell -Arguments $uninstallArgs -WorkingDirectory $InstallRoot -Description "Remove Little Bird"
}

Write-Step "Installing Little Bird"
$payload = Join-Path $PSScriptRoot "little-bird-payload.zip"
if (-not (Test-Path $payload)) {
  throw "Installer payload is missing: $payload"
}

New-Item -ItemType Directory -Force -Path $InstallRoot | Out-Null
Expand-Archive -Path $payload -DestinationPath $InstallRoot -Force
Write-LauncherScripts
Write-Shortcuts
Ensure-Ollama

Write-Step "Starting Little Bird"
if (-not $NoStart) {
  & (Join-Path $InstallRoot "Start-LittleBird.ps1")
}

Write-Host ""
Write-Host "Little Bird is installed at: $InstallRoot"
Write-Host "Open it any time from the Desktop or Start Menu shortcut."
