@echo off
echo Converting SVG files to PNG...
cd /d "%~dp0..\public\assets"

if exist "favicon-16x16-temp.svg" (
    echo Converting favicon-16x16-temp.svg to favicon-16x16.png...
    rem magick convert "favicon-16x16-temp.svg" "favicon-16x16.png"
    rem del "favicon-16x16-temp.svg"
)
if exist "favicon-32x32-temp.svg" (
    echo Converting favicon-32x32-temp.svg to favicon-32x32.png...
    rem magick convert "favicon-32x32-temp.svg" "favicon-32x32.png"
    rem del "favicon-32x32-temp.svg"
)
if exist "favicon-48x48-temp.svg" (
    echo Converting favicon-48x48-temp.svg to favicon-48x48.png...
    rem magick convert "favicon-48x48-temp.svg" "favicon-48x48.png"
    rem del "favicon-48x48-temp.svg"
)
if exist "favicon-72x72-temp.svg" (
    echo Converting favicon-72x72-temp.svg to favicon-72x72.png...
    rem magick convert "favicon-72x72-temp.svg" "favicon-72x72.png"
    rem del "favicon-72x72-temp.svg"
)
if exist "favicon-96x96-temp.svg" (
    echo Converting favicon-96x96-temp.svg to favicon-96x96.png...
    rem magick convert "favicon-96x96-temp.svg" "favicon-96x96.png"
    rem del "favicon-96x96-temp.svg"
)
if exist "favicon-144x144-temp.svg" (
    echo Converting favicon-144x144-temp.svg to favicon-144x144.png...
    rem magick convert "favicon-144x144-temp.svg" "favicon-144x144.png"
    rem del "favicon-144x144-temp.svg"
)
if exist "mstile-150x150-temp.svg" (
    echo Converting mstile-150x150-temp.svg to mstile-150x150.png...
    rem magick convert "mstile-150x150-temp.svg" "mstile-150x150.png"
    rem del "mstile-150x150-temp.svg"
)
if exist "apple-touch-icon-temp.svg" (
    echo Converting apple-touch-icon-temp.svg to apple-touch-icon.png...
    rem magick convert "apple-touch-icon-temp.svg" "apple-touch-icon.png"
    rem del "apple-touch-icon-temp.svg"
)
if exist "android-chrome-192x192-temp.svg" (
    echo Converting android-chrome-192x192-temp.svg to android-chrome-192x192.png...
    rem magick convert "android-chrome-192x192-temp.svg" "android-chrome-192x192.png"
    rem del "android-chrome-192x192-temp.svg"
)
if exist "android-chrome-512x512-temp.svg" (
    echo Converting android-chrome-512x512-temp.svg to android-chrome-512x512.png...
    rem magick convert "android-chrome-512x512-temp.svg" "android-chrome-512x512.png"
    rem del "android-chrome-512x512-temp.svg"
)

echo.
echo Conversion complete!
echo Note: Uncomment the magick convert lines if you have ImageMagick installed
pause