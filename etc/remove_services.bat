echo This script requires administative rights!
echo Please execute it as administrator.

rem Stop services

c:\oshmi\bin\nssm stop OSHMI_rtwebsrv 
c:\oshmi\bin\nssm stop OSHMI_iec104 
c:\oshmi\bin\nssm stop OSHMI_iccp 

rem Remove service without confimation

c:\oshmi\bin\nssm remove OSHMI_rtwebsrv confirm
c:\oshmi\bin\nssm remove OSHMI_iec104 confirm
c:\oshmi\bin\nssm remove OSHMI_iccp confirm

rem Reactivate mon_proc (mon_proc runs the processes interactively with a logged user)
rem This mode is best for configuration and debugging
move c:\oshmi\bin\mon_proc.bak c:\oshmi\bin\mon_proc.exe /Y