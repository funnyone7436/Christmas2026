@echo off
setlocal enabledelayedexpansion

:: Force the script to run from the current folder
cd /d "%~dp0"

:: Use PowerShell to get the exact formatted date string (YYYYMMDD_HHMM)
for /f %%I in ('powershell -Command "Get-Date -Format 'yyyyMMdd_HHmm'"') do set TIMESTAMP=%%I

:: Relative Paths
set "SRC_COMP=src\components"
set "SRC_APP=src\App.jsx"
set "DEST=src\save\backup_%TIMESTAMP%"

echo ===========================================
echo BACKUP PROCESS STARTED
echo ===========================================

:: Create the destination folder (and parent 'save' folder if needed)
if not exist "%DEST%" mkdir "%DEST%"

:: Copy the components folder
echo Copying folder: %SRC_COMP% ...
xcopy "%SRC_COMP%" "%DEST%\components" /E /I /Y /Q

:: Copy the App.jsx file
echo Copying file: %SRC_APP% ...
copy "%SRC_APP%" "%DEST%\" /Y

echo ===========================================
echo BACKUP COMPLETE
echo Target: %DEST%
echo ===========================================

pause