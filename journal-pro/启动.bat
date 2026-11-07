@echo off
chcp 65001 >nul
title 会计出纳系统
cd /d "%~dp0"
if not defined PORT set PORT=8765
echo ==========================================
echo    会计出纳系统
echo    访问地址: http://127.0.0.1:%PORT%
echo    关闭本窗口即停止服务
echo ==========================================
echo.
if not exist "server.py" goto noserver
if exist "runtime\python\python.exe" goto embed
where python >nul 2>nul
if errorlevel 1 goto nopython
set "PY=python"
goto run
:embed
set "PY=runtime\python\python.exe"
echo [启动] 使用包内自带 Python 运行时（无需安装）
goto run
:nopython
echo [错误] 未找到 Python。
echo.
pause
exit /b 1
:noserver
echo [错误] 当前目录缺少 server.py。
echo.
pause
exit /b 1
:run
echo [启动] %PY% server.py
echo.
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://127.0.0.1:%PORT%'"
"%PY%" server.py
echo.
echo [已停止]
echo.
pause
