@echo off
echo ========================================
echo    Test licznika energii - rozdzielczość co godzinę
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
echo 🚀 Uruchamianie testu licznika energii...
echo.

echo Wybierz opcję:
echo 1. Test z symulowanymi danymi (szybki)
echo 2. Test z rzeczywistymi danymi z API Supla
echo 3. Oba testy
echo.

set /p choice="Wpisz numer (1-3): "

if "%choice%"=="1" (
    echo.
    echo 🧪 Uruchamiam test z symulowanymi danymi...
    node test-energy-hourly.js
) else if "%choice%"=="2" (
    echo.
    echo 🔌 Uruchamiam test z rzeczywistymi danymi z API Supla...
    node test-energy-real.js
) else if "%choice%"=="3" (
    echo.
    echo 🧪 Uruchamiam test z symulowanymi danymi...
    node test-energy-hourly.js
    echo.
    echo 🔌 Uruchamiam test z rzeczywistymi danymi z API Supla...
    node test-energy-real.js
) else (
    echo.
    echo ❌ Nieprawidłowy wybór. Uruchamiam domyślny test...
    node test-energy-hourly.js
)

echo.
echo 💡 Pliki zostały wyeksportowane do katalogu głównego
echo 📁 Sprawdź pliki .txt z danymi energii
echo.
pause
