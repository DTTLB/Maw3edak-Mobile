@echo off
echo ===================================
echo Android Debug Log Monitor
echo ===================================
echo.
echo This will show all logs from your app
echo Press Ctrl+C to stop
echo.
echo Starting log monitor...
echo.

adb logcat -c
adb logcat | findstr /i "maw3edak ReactNativeJS Error Exception"
