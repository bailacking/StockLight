@echo off
cd /d "%~dp0.."
echo ========================================
echo     StockLight - Preprocess Data
echo ========================================
echo.
echo  Step: Preprocess data for frontend
echo.
set /p confirm="Press Y to start (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Cancelled.
    pause
    exit /b
)
echo.
echo ========================================
echo  Preprocessing data...
echo ========================================
python scripts/preprocess.py --yes
if %errorlevel% neq 0 ( echo Failed: Preprocess & pause & exit /b )
echo.
echo ========================================
echo  Preprocess complete! Refresh browser.
echo ========================================
pause
