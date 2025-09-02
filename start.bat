@echo off
echo ========================================
echo    Supla MCP Server - Uruchamianie
echo ========================================
echo.

echo Sprawdzanie czy Node.js jest zainstalowany...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js nie jest zainstalowany!
    echo Pobierz z: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js jest zainstalowany

echo.
echo Sprawdzanie zależności...
if not exist "node_modules" (
    echo 📦 Instalowanie zależności...
    npm install
) else (
    echo ✅ Zależności są zainstalowane
)

echo.
echo 🚀 Uruchamianie serwera MCP Supla...
echo Serwer będzie działał w trybie STDIO dla Claude Desktop
echo.
echo 💡 Następne kroki:
echo 1. Uruchom Claude Desktop
echo 2. Przetestuj zapytania o system Supla
echo.
echo 🔧 Aby zatrzymać serwer: Ctrl+C
echo.

node src/index.js
