
rem Kill all OSHMI processes
cd c:\oshmi\bin
call stop.bat
start /wait ..\nginx_php\stop_nginx_php.bat
