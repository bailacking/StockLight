@echo off
cd /d "%~dp0"

:menu
cls
echo ========================================
echo      StockLight 启动程序
echo ========================================
echo.
echo  1. 启动 HTTP 服务 + 打开浏览器
echo  2. 首次初始化（全量日K + 名称+实时 + 预处理）
echo  3. 日常更新（增量日K + 实时行情 + 预处理）
echo  4. 仅更新日K线（增量）
echo  5. 仅获取实时行情
echo  6. 仅获取股票名称
echo  7. 仅执行预处理
echo  0. 退出
echo.
echo ========================================
set /p choice="请输入选项 (0-7): "

if "%choice%"=="1" goto start_server
if "%choice%"=="2" goto full_init
if "%choice%"=="3" goto daily_update
if "%choice%"=="4" goto kline_only
if "%choice%"=="5" goto realtime_only
if "%choice%"=="6" goto names_only
if "%choice%"=="7" goto preprocess_only
if "%choice%"=="0" exit /b
goto menu

:start_server
cls
echo ========================================
echo  启动 HTTP 服务
echo ========================================
echo.
start http://127.0.0.1:8000/
python server/start_server.py
pause
goto menu

:full_init
cls
echo ========================================
echo  首次初始化
echo ========================================
echo.
echo  步骤：
echo    1. 全量日K线下载（3199只，耗时较长）
echo    2. 采集股票名称 + 实时行情
echo    3. 预处理生成前端数据
echo.
set /p confirm="按 Y 开始 (Y/N): "
if /i not "%confirm%"=="Y" ( echo 已取消 & pause & goto menu )
echo.
echo  [1/3] 全量日K线下载...
python scripts/kline_update.py --full --yes
if errorlevel neq 0 ( echo 失败: 日K下载 & pause & goto menu )
echo.
echo  [2/3] 采集名称 + 实时行情...
python scripts/fetch_data.py --names --realtime --yes
if errorlevel neq 0 ( echo 失败: 数据采集 & pause & goto menu )
echo.
echo  [3/3] 预处理...
python scripts/preprocess.py --yes
if errorlevel neq 0 ( echo 失败: 预处理 & pause & goto menu )
echo.
echo ========================================
echo  初始化完成！请启动服务浏览。
echo ========================================
pause
goto menu

:daily_update
cls
echo ========================================
echo  日常更新
echo ========================================
echo.
echo  步骤：
echo    1. 增量日K线更新
echo    2. 采集实时行情
echo    3. 预处理生成前端数据
echo.
set /p confirm="按 Y 开始 (Y/N): "
if /i not "%confirm%"=="Y" ( echo 已取消 & pause & goto menu )
echo.
echo  [1/3] 增量日K线更新...
python scripts/kline_update.py --incremental --yes
if errorlevel neq 0 ( echo 失败: 日K更新 & pause & goto menu )
echo.
echo  [2/3] 采集实时行情...
python scripts/fetch_data.py --realtime --yes
if errorlevel neq 0 ( echo 失败: 行情采集 & pause & goto menu )
echo.
echo  [3/3] 预处理...
python scripts/preprocess.py --yes
if errorlevel neq 0 ( echo 失败: 预处理 & pause & goto menu )
echo.
echo ========================================
echo  更新完成！刷新浏览器即可查看。
echo ========================================
pause
goto menu

:kline_only
cls
echo ========================================
echo  增量日K线更新
echo ========================================
echo.
python scripts/kline_update.py --incremental --yes
if errorlevel neq 0 ( echo 失败 & pause & goto menu )
pause
goto menu

:realtime_only
cls
echo ========================================
echo  获取实时行情
echo ========================================
echo.
python scripts/fetch_data.py --realtime --yes
if errorlevel neq 0 ( echo 失败 & pause & goto menu )
pause
goto menu

:names_only
cls
echo ========================================
echo  获取股票名称
echo ========================================
echo.
python scripts/fetch_data.py --names --yes
if errorlevel neq 0 ( echo 失败 & pause & goto menu )
pause
goto menu

:preprocess_only
cls
echo ========================================
echo  预处理数据
echo ========================================
echo.
python scripts/preprocess.py --yes
if errorlevel neq 0 ( echo 失败 & pause & goto menu )
pause
goto menu
