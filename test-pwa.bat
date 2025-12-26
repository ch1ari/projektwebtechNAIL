@echo off
REM Nail Art Match - PWA Test Script (Windows)
REM Tento skript automaticky zbuilduje projekt a spusti test server

echo.
echo ========================================
echo    Nail Art Match - PWA Testing
echo ========================================
echo.

REM Krok 1: Build
echo [1/3] Building project...
call npm run build

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed! Check errors above.
    pause
    exit /b 1
)

echo [OK] Build successful!
echo.

REM Krok 2: Kontrola suborov
echo [2/3] Checking PWA files...

if exist "dist\manifest.json" (
    echo   [OK] dist\manifest.json
) else (
    echo   [ERROR] dist\manifest.json - MISSING!
    goto :error
)

if exist "dist\sw.js" (
    echo   [OK] dist\sw.js
) else (
    echo   [ERROR] dist\sw.js - MISSING!
    goto :error
)

if exist "dist\index.html" (
    echo   [OK] dist\index.html
) else (
    echo   [ERROR] dist\index.html - MISSING!
    goto :error
)

echo [OK] All PWA files present!
echo.

REM Krok 3: Spustenie servera
echo [3/3] Starting test server...
echo.
echo ==========================================
echo   PWA Test Server
echo ==========================================
echo.
echo   URL: http://localhost:3000
echo.
echo   Testovaci navod: TEST_PWA.md
echo.
echo   Rychle kroky:
echo     1. Otvor Chrome: http://localhost:3000
echo     2. Stlac F12 - Application - Service Workers
echo     3. Skontroluj 'activated and is running'
echo     4. Network - Offline checkbox
echo     5. Reload stranku (F5)
echo     6. Hra by mala fungovat offline!
echo.
echo ==========================================
echo.
echo Server bezi... Stlac Ctrl+C pre zastavenie.
echo.

REM Spustenie servera
npx serve dist -p 3000

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start server!
    echo.
    echo Please install Node.js and try again:
    echo   npm install -g serve
    pause
    exit /b 1
)

goto :end

:error
echo.
echo [ERROR] Some PWA files are missing!
pause
exit /b 1

:end
