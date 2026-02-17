@echo off
echo ===================================================
echo   ACTUALIZANDO MIVIS STUDIO (Subiendo a la Nube)
echo ===================================================
echo.
echo 1. Empaquetando cambios...
git add .
echo.
set /p msg="2. Escribe que cambiaste (ej. nuevo color): "
git commit -m "%msg%"
echo.
echo 3. Enviando a GitHub y Vercel...
git push origin main
echo.
echo ===================================================
echo   ¡EXITO TOTAL! 
echo   Vercel ha detectado el cambio.
echo   En 1 o 2 minutos, tu pagina .com se actualizara sola.
echo ===================================================
pause
