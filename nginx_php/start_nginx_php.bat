@ECHO OFF

rem Test to open only when not already running.

cd c:\oshmi\nginx_php

tasklist /FI "IMAGENAME eq nginx.exe" | find /I "nginx.exe"
if %ERRORLEVEL% == 1 goto NGINXSTART

:TESTAPHP

tasklist /FI "IMAGENAME eq php-cgi.exe" | find /I "php-cgi.exe"
if %ERRORLEVEL% == 1 goto PHPSTART

goto END

: NGINXSTART
echo Starting NGINX
set PATH=c:\oshmi\nginx_php\php;%PATH%
start /B c:\oshmi\nginx_php\nginx.exe
goto TESTAPHP

:PHPSTART
echo Starting PHP-CGI
rem Fecha automaticamente a cada 1000 requisições.
set PHP_FCGI_MAX_REQUESTS=1000
rem Faz um loop infinito executando para rodar o fast CGI, redispara cada vez que fecha.
c:\oshmi\bin\hidec.exe cmd /C FOR /L %%i IN (0,0,0) DO c:\oshmi\nginx_php\php\php-cgi.exe -b 127.0.0.1:9000 -c c:\oshmi\nginx_php\php\php.ini


:END
echo .
echo .
echo .
start /WAIT ping -n 2 127.0.0.1 >NUL

start /B precache.vbs
