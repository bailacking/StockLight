@echo off
cd /d "%~dp0.."
echo ========================================
echo     StockLight - Incremental K-line
echo ========================================
echo.
echo  Step: Incremental K-line update
echo.
set /p confirm="Press Y to start (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Cancelled.
    pause
    exit /b
)
echo.
echo ========================================
echo  [1/1] Incremental K-line update...
echo ========================================
python scripts/kline_update.py --incremental --yes
if %errorlevel% neq 0 ( echo Failed: K-line update & pause & exit /b )
echo.
echo ========================================
echo  K-line update complete!
echo ========================================
pause
