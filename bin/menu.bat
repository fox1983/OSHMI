@ECHO off
:start
cls
echo F: Close OSHMI
echo 1: Execute OSHMI
echo 2: Try to repair tables
echo 3: Empty Hist and SOE tables
echo 4: Empty Dumpdb table
echo 5: Update HMI
echo 6: Change date/time
echo 7: Allow remote access
echo 8: Clean browser cache
echo 9: Ping
echo 0: Close this menu
set choice=
set /p choice="Choose an option > "

if not '%choice%'=='' set choice=%choice:~0,1%
if '%choice%'=='f' goto fecha 
if '%choice%'=='F' goto fecha 
if '%choice%'=='1' goto executa 
if '%choice%'=='2' goto recupera 
if '%choice%'=='3' goto apaga_sde
if '%choice%'=='4' goto apaga_pontos
if '%choice%'=='5' goto atualizar_ihm
if '%choice%'=='6' goto datahora
if '%choice%'=='7' goto remoto
if '%choice%'=='8' goto limpa_cache_chrome
if '%choice%'=='9' goto ping
if '%choice%'=='0' goto sair
ECHO "%choice%" is not valid please try again
ECHO.
goto start

:fecha 
call stop.bat
call cache_clean.bat
goto start

:executa
call stop.bat
call cache_clean.bat
start mon_proc.exe
start hmishell.exe
goto sair

:recupera
rem call stop.bat
echo ... Don't know yet how to repair sqlite files. Try to empty tables ...
pause
goto start

:apaga_sde
echo Y: CONFIRM EMPTY TABLES (SOE e HIST)!
echo N: CANCEL
set choice=
set /p choice="Choose an option > "
if not '%choice%'=='' set choice=%choice:~0,1%
if '%choice%'=='Y' goto confirmou_sde
if '%choice%'=='y' goto confirmou_sde
goto start

:confirmou_sde
call stop.bat
del ..\db\soe.*
del ..\db\hist.*
copy ..\db\db_cold\soe.sl3 ..\db\
copy ..\db\db_cold\hist.sl3 ..\db\
goto start

:apaga_pontos
echo Y: CONFIRM EMPTY TABLE (DUMPDB)!
echo N: CANCEL
set choice=
set /p choice="Choose an option > "
if not '%choice%'=='' set choice=%choice:~0,1%
if '%choice%'=='Y' goto confirmou_pontos
if '%choice%'=='y' goto confirmou_pontos
goto start

:confirmou_pontos
call stop.bat
del ..\db\dumpdb.*
copy ..\db\db_cold\dumpdb.sl3 ..\db\
goto start

:atualizar_ihm
call stop.bat

copy d:\*.ini           c:\oshmi\conf\
copy d:\*.txt           c:\oshmi\conf\
copy d:\*.lua           c:\oshmi\scripts\
copy d:\*.exe           c:\oshmi\bin\
copy d:\*.html          c:\oshmi\htdocs\
copy d:\*.js            c:\oshmi\htdocs\
copy d:\*.png           c:\oshmi\htdocs\images\
copy d:\*.jpg           c:\oshmi\htdocs\images\
copy d:\*.gif           c:\oshmi\htdocs\images\
copy d:\*.ico           c:\oshmi\htdocs\images\
copy d:\*.svg           c:\oshmi\svg\
copy d:\screen_list.js  c:\oshmi\svg\

copy e:\*.ini           c:\oshmi\conf\
copy e:\*.txt           c:\oshmi\conf\
copy e:\*.lua           c:\oshmi\scripts\
copy e:\*.exe           c:\oshmi\bin\
copy e:\*.html          c:\oshmi\htdocs\
copy e:\*.js            c:\oshmi\htdocs\
copy e:\*.png           c:\oshmi\htdocs\images\
copy e:\*.jpg           c:\oshmi\htdocs\images\
copy e:\*.gif           c:\oshmi\htdocs\images\
copy e:\*.ico           c:\oshmi\htdocs\images\
copy e:\*.svg           c:\oshmi\svg\
copy e:\screen_list.js  c:\oshmi\svg\

copy f:\*.ini           c:\oshmi\conf\
copy f:\*.txt           c:\oshmi\conf\
copy f:\*.lua           c:\oshmi\scripts\
copy f:\*.exe           c:\oshmi\bin\
copy f:\*.html          c:\oshmi\htdocs\
copy f:\*.js            c:\oshmi\htdocs\
copy f:\*.png           c:\oshmi\htdocs\images\
copy f:\*.jpg           c:\oshmi\htdocs\images\
copy f:\*.gif           c:\oshmi\htdocs\images\
copy f:\*.ico           c:\oshmi\htdocs\images\
copy f:\*.svg           c:\oshmi\svg\
copy f:\screen_list.js  c:\oshmi\svg\

copy g:\*.ini           c:\oshmi\conf\
copy g:\*.txt           c:\oshmi\conf\
copy g:\*.lua           c:\oshmi\scripts\
copy g:\*.exe           c:\oshmi\bin\
copy g:\*.html          c:\oshmi\htdocs\
copy g:\*.js            c:\oshmi\htdocs\
copy g:\*.png           c:\oshmi\htdocs\images\
copy g:\*.jpg           c:\oshmi\htdocs\images\
copy g:\*.gif           c:\oshmi\htdocs\images\
copy g:\*.ico           c:\oshmi\htdocs\images\
copy g:\*.svg           c:\oshmi\svg\
copy g:\screen_list.js  c:\oshmi\svg\

call cache_clean.bat
shutdown -f -s
goto start

:limpa_cache_chrome
call cache_clean.bat
goto start

:ping
set choice=
set /p choice="Type an IP address to ping > "
ping %choice%
pause
goto start

:datahora
date
time
goto start

:remoto
net start uvnc_service
net start tvnserver
net start termservice
goto start

:sair
exit
