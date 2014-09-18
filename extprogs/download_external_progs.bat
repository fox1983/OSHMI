
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
..\bin\wget %proxy% "http://sourceforge.net/projects/sage-scada/files/SAGE v4.07/inkscape0484_sage407.exe"
..\bin\wget %proxy% http://download.tuxfamily.org/notepadplus/6.5.5/npp.6.5.5.Installer.exe
..\bin\wget %proxy% https://github.com/sqlitebrowser/sqlitebrowser/releases/download/sqlb-3.2.0/sqlitebrowser-3.2.0-win32.exe

start /wait inkscape0484_sage407.exe
start /wait npp.6.5.5.Installer.exe
start /wait sqlitebrowser-3.2.0-win32.exe
