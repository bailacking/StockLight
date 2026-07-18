@echo off
cd /d "%~dp0.."
echo ========================================
echo     StockLight - Fetch Stock Names
echo ========================================
echo.
echo  Step: Fetch stock names
echo.
set /p confirm="Press Y to start (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Cancelled.
    pause
    exit /b
)
echo.
echo ========================================
echo  [1/1] Fetching stock names...
echo ========================================
python scripts/fetch_data.py --names --yes
if %errorlevel% neq 0 ( echo Failed: Names fetch & pause & exit /b )
echo.
echo ========================================
echo  Names fetch complete!
echo ========================================
pause
