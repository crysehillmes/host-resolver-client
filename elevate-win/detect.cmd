@echo off

net session >nul 2>&1
IF %ERRORLEVEL% EQU 0 (
    ECHO 1
) ELSE (
    ECHO 0
)