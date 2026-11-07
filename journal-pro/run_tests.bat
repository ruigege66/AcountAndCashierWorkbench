@echo off
chcp 65001 >nul
title 会计出纳系统 · 回归测试
cd /d "%~dp0"
python run_tests.py %*
echo.
pause
