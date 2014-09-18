@ECHO OFF

rem Closes then starts nginx and php.

cd c:\oshmi\nginx_php

start /WAIT nginx -s stop
taskkill /f /IM nginx.exe
taskkill /f /IM php-cgi.exe

echo Starting NGINX
start /B c:\oshmi\nginx_php\nginx.exe

echo Starting PHP-CGI
set PATH=c:\oshmi\nginx_php\php;%PATH%
set PHP_FCGI_MAX_REQUESTS=1000
rem Fecha automaticamente a cada 1000 requisições.
rem Faz um loop infinito executando para rodar o fast CGI, redispara cada vez que fecha.
c:\oshmi\bin\hidec.exe cmd /C FOR /L %%i IN (0,0,0) DO c:\oshmi\nginx_php\php\php-cgi.exe -b 127.0.0.1:9000 -c c:\oshmi\nginx_php\php\php.ini

echo .
echo .
echo .
ping 127.0.0.1 >NUL
