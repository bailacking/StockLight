@echo off
cd /d "%~dp0.."
echo ========================================
echo     StockLight - Update Data
echo ========================================
echo.
echo  Steps:
echo    1. Incremental K-line update
echo    2. Fetch realtime data
echo    3. Preprocess data for frontend
echo.
set /p confirm="Press Y to start (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Cancelled.
    pause
    exit /b
)
echo.
echo ========================================
echo  [1/3] Incremental K-line update...
echo ========================================
python scripts/kline_update.py --incremental --yes
if %errorlevel% neq 0 ( echo Failed: K-line update & pause & exit /b )
echo.
echo ========================================
echo  [2/3] Fetch realtime...
echo ========================================
python scripts/fetch_data.py --realtime --yes
if %errorlevel% neq 0 ( echo Failed: Data fetch & pause & exit /b )
echo.
echo ========================================
echo  [3/3] Preprocess data...
echo ========================================
python scripts/preprocess.py --yes
if %errorlevel% neq 0 ( echo Failed: Preprocess & pause & exit /b )
echo.
echo ========================================
echo  Update complete! Refresh browser.
echo ========================================
pause
