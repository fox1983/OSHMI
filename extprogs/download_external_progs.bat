
rem Configure your proxy here if needed
rem SET proxy="-e http-proxy=10.63.1.1:128"

..\bin\wget %proxy% http://live.sysinternals.com/autoruns.exe
..\bin\wget %proxy% http://live.sysinternals.com/autoruns.chm
..\bin\wget %proxy% http://live.sysinternals.com/procexp.exe
..\bin\wget %proxy% http://live.sysinternals.com/procexp.chm
..\bin\wget %proxy% http://live.sysinternals.com/disk2vhd.exe
..\bin\wget %proxy% http://live.sysinternals.com/disk2vhd.chm
..\bin\wget %proxy% http://live.sysinternals.com/procmon.exe
..\bin\wget %proxy% http://live.sysinternals.com/pskill.exe
..\bin\wget %proxy% http://live.sysinternals.com/psping.exe
..\bin\wget %proxy% http://live.sysinternals.com/tcpvcon.exe
..\bin\wget %proxy% http://live.sysinternals.com/tcpview.exe
..\bin\wget %proxy% http://live.sysinternals.com/tcpview.chm
..\bin\wget --no-check-certificate %proxy% "https://sourceforge.net/projects/sage-scada/files/SAGE v3.03/inkscape0481_sage303.exe"
..\bin\wget %proxy% http://download.tuxfamily.org/notepadplus/archive/6.7.5/npp.6.7.5.Installer.exe
rem ..\bin\wget %proxy% https://github.com/sqlitebrowser/sqlitebrowser/releases/download/v3.8.0/sqlitebrowser-3.8.0-win32v3.exe

start /wait inkscape0481_sage303.exe
start /wait npp.6.7.5.Installer.exe
rem start /wait sqlitebrowser-3.8.0-win32v3.exe
