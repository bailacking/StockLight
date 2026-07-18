@echo off
cd /d "%~dp0.."
echo ========================================
echo     StockLight - Fetch Realtime
echo ========================================
echo.
echo  Step: Fetch realtime data
echo.
set /p confirm="Press Y to start (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Cancelled.
    pause
    exit /b
)
echo.
echo ========================================
echo  [1/1] Fetching realtime data...
echo ========================================
python scripts/fetch_data.py --realtime --yes
if %errorlevel% neq 0 ( echo Failed: Data fetch & pause & exit /b )
echo.
echo ========================================
echo  Realtime data fetch complete!
echo ========================================
pause
