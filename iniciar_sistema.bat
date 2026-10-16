@echo off
chcp 65001 > nul
color 0B
echo ===================================================
echo   INICIANDO SISTEMA DE ALMACEN NETCOMMTEL 
echo ===================================================
echo.
echo [1/2] Encendiendo el motor del sistema... 
echo (Si es la primera vez, esto tomara un par de minutos)
docker-compose up -d --build
echo.
echo [2/2] Obteniendo tu direccion de red...
echo.
echo ===================================================
echo   SISTEMA ACTIVO Y LISTO PARA RECIBIR USUARIOS
echo ===================================================
echo.
echo Para usar el sistema directamente en este SERVIDOR, abre:
echo http://localhost
echo.
echo ---------------------------------------------------
echo Para que los Empleados se conecten desde OTRAS PCs, 
echo dales la direccion IPv4 que aparece aqui abajo:
echo ---------------------------------------------------
ipconfig | findstr /i "IPv4"
echo (Ejemplo: http://192.168.1.15)
echo.
echo ===================================================
echo Ya puedes cerrar esta ventana negra. El sistema seguira funcionando.
pause > nul