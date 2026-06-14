@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-little-bird.ps1"
if errorlevel 1 (
  echo.
  echo Little Bird setup did not finish successfully.
  pause
  exit /b 1
)
exit /b 0
