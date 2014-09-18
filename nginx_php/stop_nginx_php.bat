start /WAIT ..\nginx_php\nginx -s stop
start /WAIT taskkill /T /F /IM nginx.exe
start /WAIT taskkill /T /F /IM php-cgi.exe
start /WAIT ping -n 2
start /WAIT taskkill /T /F /IM cmd.exe
