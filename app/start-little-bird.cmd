@echo off
setlocal
cd /d "%~dp0"

set "NODE_EXE=node"
where node >nul 2>nul
if errorlevel 1 (
  if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    set "NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  ) else (
    echo Node.js was not found on PATH.
    echo Install Node.js 20 or newer, then run this file again.
    pause
    exit /b 1
  )
)

echo Starting Little Bird...
echo Open http://localhost:4173/?v=0.3.15 in your browser, unless you pass a custom --port.
"%NODE_EXE%" server.js %*
