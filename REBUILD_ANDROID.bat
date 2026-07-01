@echo off
echo ===================================
echo Android Clean Rebuild Script
echo ===================================
echo.
echo RECENT CHANGES:
echo - Updated to new Maw3edak logo (maw3edak_logo_-_transparent.png)
echo - newArchEnabled set to false for stability
echo - Patient login fixed with comprehensive error handling
echo.
echo This will:
echo 1. Clean old build files
echo 2. Rebuild Android native code
echo 3. Start the app on your device/emulator
echo.
echo Make sure:
echo - Android device is connected OR emulator is running
echo - .env file exists with Supabase credentials
echo.
pause
echo.

echo [1/5] Cleaning Android build folders...
if exist "android\app\build" rmdir /s /q "android\app\build"
if exist "android\build" rmdir /s /q "android\build"
echo Done.
echo.

echo [2/5] Running Gradle clean...
cd android
call gradlew clean
cd ..
echo Done.
echo.

echo [3/5] Running expo prebuild (this may take a while)...
call npx expo prebuild --clean --platform android
echo Done.
echo.

echo [4/5] Building and installing app...
call npx expo run:android
echo.

echo ===================================
echo Build complete!
echo ===================================
echo.
echo The app should now be running on your device.
echo.
echo If it still crashes, run DEBUG_ANDROID.bat in another
echo terminal to see detailed logs.
echo.
pause
