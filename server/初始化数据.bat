@echo off
cd /d "%~dp0.."
echo ========================================
echo     StockLight - First Time Setup
echo ========================================
echo.
echo  This will:
echo    1. Full K-line data download
echo    2. Fetch names + realtime
echo    3. Preprocess data for frontend
echo.
echo  WARNING: First download of ~3199 stocks
echo           may take a long time.
echo.
set /p confirm="Press Y to start (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Cancelled.
    pause
    exit /b
)
echo.
echo ========================================
echo  [1/3] Full K-line data download...
echo ========================================
python scripts/kline_update.py --full --yes
if %errorlevel% neq 0 ( echo Failed: K-line download & pause & exit /b )
echo.
echo ========================================
echo  [2/3] Fetch names + realtime...
echo ========================================
python scripts/fetch_data.py --names --realtime --yes
if %errorlevel% neq 0 ( echo Failed: Data fetch & pause & exit /b )
echo.
echo ========================================
echo  [3/3] Preprocess data...
echo ========================================
python scripts/preprocess.py --yes
if %errorlevel% neq 0 ( echo Failed: Preprocess & pause & exit /b )
echo.
echo ========================================
echo  First time setup complete!
echo.
echo  Next step: double-click 启动服务.bat
echo  to start the server and open browser.
echo ========================================
pause
