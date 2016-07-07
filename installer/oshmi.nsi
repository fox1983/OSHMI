; oshmi.nsi
; OSHMI installer script
; Copyright 2008-2016 - Ricardo L. Olsen

; NSIS (Nullsoft Scriptable Install System) - http://nsis.sourceforge.net/Main_Page

RequestExecutionLevel user

!include "TextFunc.nsh"
!include "WordFunc.nsh"

;--------------------------------

!define VERSION "v.3.13"

Function .onInit
 System::Call 'keexrnel32::CreateMutexA(i 0, i 0, t "MutexOshmiInstall") i .r1 ?e'
 Pop $R0
 StrCmp $R0 0 +3
   MessageBox MB_OK|MB_ICONEXCLAMATION "Installer already executing!"
   Abort
FunctionEnd
 
;--------------------------------

!ifdef HAVE_UPX
!packhdr tmp.dat "upx\upx -9 tmp.dat"
!endif

!ifdef NOCOMPRESS
SetCompress off
!endif

;--------------------------------

!define /date DATEBAR "%d/%m/%Y"
Name "OSHMI"
Caption "OSHMI (Open Substation HMI) Installer ${VERSION} ${DATEBAR}"
Icon "..\icons\oshmi-o-logo255.ico"

!define /date DATE "%d_%m_%Y"
OutFile "oshmi_setup_${VERSION}.exe"

VIProductVersion 0.0.0.0
VIAddVersionKey ProductName "OSHMI (Open Substation HMI)"
;VIAddVersionKey Comments ""
;VIAddVersionKey CompanyName ""
VIAddVersionKey LegalCopyright "Copyright 2008-2014 Ricardo L.Olsen"
VIAddVersionKey FileDescription "OSHMI Installer"
VIAddVersionKey FileVersion ${VERSION}
VIAddVersionKey ProductVersion ${VERSION}
VIAddVersionKey InternalName "OSHMI Installer"
;VIAddVersionKey LegalTrademarks ""
VIAddVersionKey OriginalFilename "oshmi_setup_${VERSION}.exe"

SetDateSave on
SetDatablockOptimize on
CRCCheck on
SilentInstall normal
BGGradient 000000 800000 FFFFFF
InstallColors FF8080 000030
XPStyle on

InstallDir "c:\oshmi"
InstallDirRegKey HKLM "Software\OSHMI" "Install_Dir"

CheckBitmap "${NSISDIR}\Contrib\Graphics\Checks\classic-cross.bmp"

LicenseText "OSHMI Release Notes"
LicenseData "release_notes.txt"

; Must be admin
RequestExecutionLevel admin

;--------------------------------

Page license
;Page components
;Page directory
Page instfiles

UninstPage uninstConfirm
UninstPage instfiles

; LoadLanguageFile "${NSISDIR}\Contrib\Language files\PortugueseBR.nlf"

;--------------------------------

AutoCloseWindow false
ShowInstDetails show

;--------------------------------

Section "" ; empty string makes it hidden, so would starting with -

; Fecha processos que vao ser sobrescritos
  nsExec::Exec 'taskkill /F /IM nginx.exe'
  nsExec::Exec 'taskkill /F /IM cmd.exe'
  nsExec::Exec 'taskkill /F /IM php-cgi.exe'
  nsExec::Exec 'taskkill /F /IM mon_proc.exe'
  nsExec::Exec 'taskkill /F /IM procexp.exe'
  nsExec::Exec 'taskkill /F /IM iccp_client.exe'
  nsExec::Exec 'taskkill /F /IM QTester104.exe'
  nsExec::Exec 'taskkill /F /IM hmishell.exe'
  nsExec::Exec 'taskkill /F /IM webserver.exe'
  nsExec::Exec 'taskkill /F /IM chrome.exe'
  nsExec::Exec 'taskkill /F /IM sqlite3.exe'
  nsExec::Exec 'net stop OSHMI_rtwebsrv'
  nsExec::Exec 'net stop OSHMI_iec104'
  nsExec::Exec 'net stop OSHMI_iccp'

  SetOverwrite on

  var /GLOBAL NAVWINCMD
  var /GLOBAL NAVLINCMD
  var /GLOBAL NAVDATDIR
  var /GLOBAL NAVPREOPT
  var /GLOBAL NAVPOSOPT
  var /GLOBAL NAVVISEVE
  var /GLOBAL NAVVISHEV
  var /GLOBAL NAVVISTAB
  var /GLOBAL NAVVISANO
  var /GLOBAL NAVVISTEL
  var /GLOBAL NAVVISTRE
  var /GLOBAL NAVVISCUR
  var /GLOBAL NAVVISOVW
  
  StrCpy $NAVWINCMD "browser\chrome.exe"
  StrCpy $NAVLINCMD "/usr/bin/chromium-browser"
  StrCpy $NAVDATDIR "--user-data-dir=$INSTDIR\browser-data"
  StrCpy $NAVPREOPT "--disable-popup-blocking --process-per-site --no-sandbox"
  StrCpy $NAVPOSOPT "--no-proxy-server"
  StrCpy $NAVVISEVE "--app=http://127.0.0.1:51909/htdocs/events.html"
  StrCpy $NAVVISHEV "--app=http://127.0.0.1:51909/htdocs/events.html?MODO=4"
  StrCpy $NAVVISTAB "--app=http://127.0.0.1:51909/htdocs/tabular.html"
  StrCpy $NAVVISANO "--app=http://127.0.0.1:51909/htdocs/tabular.html?SELMODULO=TODOS_ANORMAIS"
  StrCpy $NAVVISTEL "--app=http://127.0.0.1:51909/htdocs/screen.html"
  StrCpy $NAVVISTRE "--app=http://127.0.0.1:51909/htdocs/trend.html"
  StrCpy $NAVVISCUR "--app=http://127.0.0.1:51909/htdocs/histwebview/histwebview.php"
  StrCpy $NAVVISOVW "--app=http://127.0.0.1:51909/htdocs/overview.html"

  ; write reg info
  StrCpy $1 "POOOOOOOOOOOP"
  DetailPrint "I like to be able to see what is going on (debug) $1"
  WriteRegStr HKLM SOFTWARE\OSHMI "Install_Dir" "$INSTDIR"

  ; write uninstall strings
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OSHMI" "DisplayName" "OSHMI (remove only)"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OSHMI" "UninstallString" '"$INSTDIR\bt-uninst.exe"'

  ; erases all of the old chromium
  RMDir /r "$INSTDIR\browser" 
  RMDir /r "$INSTDIR\browser-data" 

  CreateDirectory "$INSTDIR\bin"
  CreateDirectory "$INSTDIR\bin\platforms"
  CreateDirectory "$INSTDIR\browser"
  CreateDirectory "$INSTDIR\browser-data"
  CreateDirectory "$INSTDIR\conf"
  CreateDirectory "$INSTDIR\conf_templates"
  CreateDirectory "$INSTDIR\db"
  CreateDirectory "$INSTDIR\db\db_cold"
  CreateDirectory "$INSTDIR\docs"
  CreateDirectory "$INSTDIR\etc"
  CreateDirectory "$INSTDIR\extprogs"
  CreateDirectory "$INSTDIR\htdocs"
  CreateDirectory "$INSTDIR\htdocs\images"
  CreateDirectory "$INSTDIR\i18n"
  CreateDirectory "$INSTDIR\linux"
  CreateDirectory "$INSTDIR\logs"
  CreateDirectory "$INSTDIR\nginx_php"
  CreateDirectory "$INSTDIR\scripts"
  CreateDirectory "$INSTDIR\svg"

  SetOutPath $INSTDIR

  File /a "..\installer\release_notes.txt"
  File /a "..\installer\gpl.txt"
  File /a "..\icons\favicon.ico"

  SetOutPath $INSTDIR\bin
  File /a "..\bin\*.exe"
  File /a "..\bin\*.dll"
  File /a "..\bin\*.vbs"
  File /a "..\bin\*.bat"

  SetOutPath $INSTDIR\bin\platforms
  File /a "..\bin\platforms\*.dll"

  SetOutPath $INSTDIR\etc
  File /a "..\etc\dyn_sheet.xlsx"
  File /a "..\etc\webserver_query.iqy"  
  File /a "..\etc\simtr_example.txt"
  File /a "..\etc\*.reg"

  SetOutPath $INSTDIR\extprogs
  File /a "..\extprogs\download_external_progs.bat"
  
  SetOutPath $INSTDIR\nginx_php
  File /r /x *.log "..\nginx_php\*.*" 

  SetOutPath $INSTDIR\linux
  File /a "..\linux\*.*"

  SetOutPath $INSTDIR\db\db_cold
  File /a "..\db\db_cold\*.*"
  
  SetOutPath $INSTDIR\db
  File /a "..\db\process_hist.bat"
  File /a "..\db\process_soe.bat"
  File /a "..\db\process_dumpdb.bat"
  File /a "..\db\terminate_hist.bat"
  File /a "..\db\terminate_soe.bat"
  File /a "..\db\terminate_dumpdb.bat"
  File /a "..\db\pragmas_hist.sql"
  File /a "..\db\pragmas_soe.sql"
  File /a "..\db\pragmas_dumpdb.sql"

  SetOutPath $INSTDIR\i18n
  File /a "..\i18n\*.*"

  SetOutPath $INSTDIR\conf_templates

  File /a "..\conf_templates\*.*"

  SetOutPath $INSTDIR\htdocs
  File /a "..\htdocs\about.html"
  File /a "..\htdocs\dlgcomando.html"
  File /a "..\htdocs\dlginfo.html"
  File /a "..\htdocs\events.html"
  File /a "..\htdocs\trend.html"
  File /a "..\htdocs\tabular.html"
  File /a "..\htdocs\screen.html"
  File /a "..\htdocs\almbox.html"
  File /a "..\htdocs\overview.html"
  File /a "..\htdocs\images.js"
  File /a "..\htdocs\util.js"
  File /a "..\htdocs\fan.js"
  File /a "..\htdocs\websage.js"
  File /a "..\htdocs\pntserver.js"
  File /a "..\htdocs\timepntserver.php"
  File /a "..\htdocs\legacy_options.js"
  File /a "..\htdocs\listdocs.php"
  File /a "..\htdocs\eventserver.php"
  File /a "..\htdocs\eventsync.php"
  File /a "..\htdocs\config_viewers_default.js"
  
  SetOutPath $INSTDIR\htdocs\histwebview
  File /a /r "..\htdocs\histwebview\*.*"

  SetOutPath $INSTDIR\htdocs\lib
  File /a /r "..\htdocs\lib\*.*"

  SetOutPath "$INSTDIR\htdocs\images"
  File /a "..\htdocs\images\*.*"

  SetOutPath $INSTDIR\extprogs
  File /a "..\extprogs\SumatraPDF-3.1.1-install.exe"
  File /a "..\extprogs\vcredist_x86.exe"
  File /a "..\extprogs\vcredist_x86-2012.exe"
  File /a "..\extprogs\vcredist_x86-2013.exe"

  SetOutPath $INSTDIR\browser
  File /a /r "..\browser\*.*"

  SetOutPath $INSTDIR\browser-data
  File /a /r "..\browser-data\*.*"

  SetOutPath $INSTDIR\docs
  File /a "..\docs\listdocs.php"
  File /a "..\docs\oshmi_operation_manual-pt_br.odt"
  File /a "..\docs\oshmi_operation_manual-pt_br.pdf"
  File /a "..\docs\oshmi_operation_manual-en_us.odt"
  File /a "..\docs\oshmi_operation_manual-en_us.pdf"
  File /a "..\docs\oshmi_configuration_manual-en_us.odt"
  File /a "..\docs\oshmi_configuration_manual-en_us.pdf"
  File /a "..\docs\lua_reference_manual.pdf"
  File /a "..\docs\inkscape-shortcuts1.svg"
  File /a "..\docs\inkscape-shortcuts2.svg"
  
  SetOverwrite off

  SetOutPath $INSTDIR\etc
  File /a "..\etc\*.bat"

  SetOutPath $INSTDIR\conf
  File /a "..\conf_templates\config_viewers.js"
  File /a "..\conf_templates\point_list.txt"
  File /a "..\conf_templates\point_calc.txt"
  File /a "..\conf_templates\qtester104.ini"  
  File /a "..\conf_templates\iccp_config.txt"  
  File /a "..\conf_templates\hmi.ini"
  File /a "..\conf_templates\hmishell.ini"
  File /a "..\conf_templates\mon_proc.ini"
  File /a "..\conf_templates\nginx_access_control.conf"  
  File /a "..\conf_templates\timezone.php"

  SetOutPath "$INSTDIR\db"
  File /a "..\db\db_cold\*.sl3"
  
  IfFileExists "$SYSDIR\forfiles.exe" JaExisteForFiles
  File /a "..\db\forfiles.exe"

  JaExisteForFiles:

  SetOutPath "$INSTDIR\svg"
  File /a "..\svg\kaw2.svg"
  File /a "..\svg\kik3.svg"
  File /a "..\svg\knh2.svg"
  File /a "..\svg\kor1.svg"
  File /a "..\conf_templates\screen_list.js"

; Visual C redist: necessario para executar o PHP
  nsExec::Exec '"$INSTDIR\extprogs\vcredist_x86.exe" /q'
  nsExec::Exec '"$INSTDIR\extprogs\vcredist_x86-2012.exe" /q'
  nsExec::Exec '"$INSTDIR\extprogs\vcredist_x86-2013.exe" /q'

; Visualizador de PDF
;  nsExec::Exec '$INSTDIR\extprogs\SumatraPDF-3.1.1-install.exe /s /opt plugin'
;  CopyFiles "$INSTDIR\conf_templates\sumatrapdfrestrict.ini" "$PROGRAMFILES\SumatraPDF\"

;  MessageBox MB_YESNO "Wish to substitute Windows Shell by the HMIShell? \nWARNING: ANSWERING YES WILL BLOCK THE MACHINE FOR THE OPERATOR" IDNO InstFim 
; LabelShell:
; registry key to change Windows shell
;  WriteRegStr HKCU "Software\Microsoft\Windows NT\CurrentVersion\Winlogon" "Shell" "c:\\oshmi\\bin\\hmishell.exe"
; registry key to disable task manager
;  WriteRegDword HKCU "Software\Microsoft\Windows\CurrentVersion\Policies\System" "DisableTaskMgr" 0x01
; sumatra pdf in restrict mode
; InstFim:

; escreve chaves para definir atalhos do chrome no hmi.ini
; chaves para o windows   

  WriteINIStr "$INSTDIR\conf\hmi.ini"  "RUN" "EVENTS_VIEWER"     '"$INSTDIR\$NAVWINCMD $NAVDATDIR $NAVPREOPT $NAVPOSOPT $NAVVISEVE"'
  WriteINIStr "$INSTDIR\conf\hmi.ini"  "RUN" "TABULAR_VIEWER"    '"$INSTDIR\$NAVWINCMD $NAVDATDIR $NAVPREOPT $NAVPOSOPT $NAVVISTAB"'
  WriteINIStr "$INSTDIR\conf\hmi.ini"  "RUN" "SCREEN_VIEWER"     '"$INSTDIR\$NAVWINCMD $NAVDATDIR $NAVPREOPT $NAVPOSOPT $NAVVISTEL"'
  WriteINIStr "$INSTDIR\conf\hmi.ini"  "RUN" "TREND_VIEWER"      '"$INSTDIR\$NAVWINCMD $NAVDATDIR $NAVPREOPT $NAVPOSOPT $NAVVISTRE"'
  WriteINIStr "$INSTDIR\conf\hmi.ini"  "RUN" "CURVES_VIEWER"     '"$INSTDIR\$NAVWINCMD $NAVDATDIR $NAVPREOPT $NAVPOSOPT $NAVVISCUR"'

; chaves para o linux   
  WriteINIStr "$INSTDIR\conf\hmi.ini"  "RUN" ";EVENTS_VIEWER"    '$NAVLINCMD $NAVPREOPT $NAVPOSOPT $NAVVISEVE'
  WriteINIStr "$INSTDIR\conf\hmi.ini"  "RUN" ";TABULAR_VIEWER"   '$NAVLINCMD $NAVPREOPT $NAVPOSOPT $NAVVISTAB'
  WriteINIStr "$INSTDIR\conf\hmi.ini"  "RUN" ";SCREEN_VIEWER"    '$NAVLINCMD $NAVPREOPT $NAVPOSOPT $NAVVISTEL'
  WriteINIStr "$INSTDIR\conf\hmi.ini"  "RUN" ";TREND_VIEWER"     '$NAVLINCMD $NAVPREOPT $NAVPOSOPT $NAVVISTRE'
  WriteINIStr "$INSTDIR\conf\hmi.ini"  "RUN" ";CURVES_VIEWER"    '$NAVLINCMD $NAVPREOPT $NAVPOSOPT $NAVVISCUR'

; vou colocar aqui todos os atalhos no Desktop, apagando os antigos
  Delete "$DESKTOP\OSHMI\*.*"
  CreateDirectory "$DESKTOP\OSHMI"

  SetOutPath $INSTDIR\bin
; Cria atalhos para os aplicativos
  CreateShortCut "$DESKTOP\OSHMI\Stop_All.lnk"                    "$INSTDIR\bin\stop_all.bat"  
  CreateShortCut "$DESKTOP\OSHMI\HMIShell.lnk"                    "$INSTDIR\bin\hmishell.exe"  
  CreateShortCut "$DESKTOP\OSHMI\WebServer.lnk"                   "$INSTDIR\bin\webserver.exe"  
  CreateShortCut "$DESKTOP\OSHMI\Recovery Menu.lnk"               "$INSTDIR\bin\menu.bat"  
  CreateShortCut "$DESKTOP\OSHMI\Clean Browser Cache.lnk"         "$INSTDIR\bin\cache_clean.bat"  
  CreateShortCut "$DESKTOP\OSHMI\Process Explorer.lnk"            "$INSTDIR\extprogs\procexp.exe"  

  SetOutPath $INSTDIR\browser
  CreateShortCut "$DESKTOP\OSHMI\Chromium Browser.lnk"            "$INSTDIR\$NAVWINCMD" " $NAVDATDIR $NAVPREOPT $NAVPOSOPT"
  CreateShortCut "$DESKTOP\OSHMI\Screen Viewer.lnk"               "$INSTDIR\$NAVWINCMD" " $NAVDATDIR $NAVPREOPT $NAVVISTEL $NAVPOSOPT" "$INSTDIR\htdocs\images\tela.ico" 
  CreateShortCut "$DESKTOP\OSHMI\Events Viewer.lnk"               "$INSTDIR\$NAVWINCMD" " $NAVDATDIR $NAVPREOPT $NAVVISEVE $NAVPOSOPT" "$INSTDIR\htdocs\images\chrono.ico" 
  CreateShortCut "$DESKTOP\OSHMI\Historical Events.lnk"           "$INSTDIR\$NAVWINCMD" " $NAVDATDIR $NAVPREOPT $NAVVISHEV $NAVPOSOPT" "$INSTDIR\htdocs\images\calendar.ico" 
  CreateShortCut "$DESKTOP\OSHMI\Tabular Viewer.lnk"              "$INSTDIR\$NAVWINCMD" " $NAVDATDIR $NAVPREOPT $NAVVISTAB $NAVPOSOPT" "$INSTDIR\htdocs\images\tabular.ico" 
  CreateShortCut "$DESKTOP\OSHMI\Alarms Viewer.lnk"               "$INSTDIR\$NAVWINCMD" " $NAVDATDIR $NAVPREOPT $NAVVISANO $NAVPOSOPT" "$INSTDIR\htdocs\images\firstaid.ico" 
  CreateShortCut "$DESKTOP\OSHMI\Curves Viewer.lnk"               "$INSTDIR\$NAVWINCMD" " $NAVDATDIR $NAVPREOPT $NAVVISCUR $NAVPOSOPT" "$INSTDIR\htdocs\images\plot.ico" 
  CreateShortCut "$DESKTOP\OSHMI\Overview.lnk"                    "$INSTDIR\$NAVWINCMD" " $NAVDATDIR $NAVPREOPT $NAVVISOVW $NAVPOSOPT" "$INSTDIR\htdocs\images\oshmi.ico" 

  SetOutPath $INSTDIR\docs
  CreateShortCut "$DESKTOP\OSHMI\Operation Manual.lnk"            "$INSTDIR\bin\operation_manual.bat"  
  CreateShortCut "$DESKTOP\OSHMI\Configuration Manual.lnk"        "$INSTDIR\bin\configuration_manual.bat"  

  SetOutPath $INSTDIR\svg
  CreateShortCut "$DESKTOP\OSHMI\Inkscape SAGE.lnk"               "$PROGRAMFILES\inkscape SAGE\inkscape.exe"
  CreateShortCut "$DESKTOP\OSHMI\Config Files - PSPad.lnk"        "$PROGRAMFILES\PSPad Editor\pspad.exe" "$INSTDIR\conf\hmi.ini $INSTDIR\conf\hmishell.ini $INSTDIR\svg\screen_list.js $INSTDIR\conf\config_viewers.js $INSTDIR\conf\mon_proc.ini $INSTDIR\conf\qtester104.ini $INSTDIR\conf\point_list.txt $INSTDIR\conf\point_calc.txt $INSTDIR\conf\nginx_access_control.conf "
  CreateShortCut "$DESKTOP\OSHMI\Config Files - Notepad++.lnk"    "$PROGRAMFILES\Notepad++\notepad++.exe" "$INSTDIR\conf\hmi.ini $INSTDIR\conf\hmishell.ini $INSTDIR\svg\screen_list.js $INSTDIR\conf\config_viewers.js $INSTDIR\conf\mon_proc.ini $INSTDIR\conf\qtester104.ini $INSTDIR\conf\point_list.txt $INSTDIR\conf\point_calc.txt $INSTDIR\conf\nginx_access_control.conf "

; apaga o cache do chrome
  Delete "$INSTDIR\browser-data\Default\Cache\*.*"
  RMDir /r "$INSTDIR\browser-data\Default\Web Aplications"

; cria regras de firewall

; Add an application to the firewall exception list - All Networks - All IP Version - Enabled
  SimpleFC::AddApplication "OSHMI Webserver" "$INSTDIR\bin\webserver.exe" 0 2 "" 1
  Pop $0 ; return error(1)/success(0)

  SimpleFC::AddApplication "OSHMI Shell" "$INSTDIR\bin\hmishell.exe" 0 2 "" 1
  Pop $0 ; return error(1)/success(0)

  SimpleFC::AddApplication "OSHMI Mon_Proc" "$INSTDIR\bin\mon_proc.exe" 0 2 "" 1
  Pop $0 ; return error(1)/success(0)

  SimpleFC::AddApplication "OSHMI QTester104" "$INSTDIR\bin\QTester104.exe" 0 2 "" 1
  Pop $0 ; return error(1)/success(0)

  SimpleFC::AddApplication "OSHMI NGINX" "$INSTDIR\nginx_php\nginx.exe" 0 2 "" 1
  Pop $0 ; return error(1)/success(0)

  SimpleFC::AddApplication "OSHMI PHP-CGI" "$INSTDIR\nginx_php\php\php-cgi.exe" 0 2 "" 1
  Pop $0 ; return error(1)/success(0)

  SimpleFC::AddPort 65280 "OSHMI Webserver" 256 0 2 "" 1
  Pop $0 ; return error(1)/success(0)
  SimpleFC::AddPort 65281 "OSHMI Webserver" 256 0 2 "" 1
  Pop $0 ; return error(1)/success(0)
  SimpleFC::AddPort 8082 "OSHMI Webserver" 256 0 2 "" 1
  Pop $0 ; return error(1)/success(0)
  SimpleFC::AddPort 8099 "OSHMI Webserver" 256 0 2 "" 1
  Pop $0 ; return error(1)/success(0)
  SimpleFC::AddPort 51909 "OSHMI Shell" 256 0 2 "" 1
  Pop $0 ; return error(1)/success(0)
  SimpleFC::AddPort 8081 "OSHMI Mon_Proc" 256 0 2 "" 1
  Pop $0 ; return error(1)/success(0)
  SimpleFC::AddPort 51908 "OSHMI Webserver" 256 0 2 "" 1
  Pop $0 ; return error(1)/success(0)
  SimpleFC::AddPort 2404 "OSHMI QTester104" 256 0 2 "" 1
  Pop $0 ; return error(1)/success(0)
  SimpleFC::AddPort 65280 "OSHMI QTester104" 256 0 2 "" 1
  Pop $0 ; return error(1)/success(0)
  SimpleFC::AddPort 65281 "OSHMI QTester104" 256 0 2 "" 1
  Pop $0 ; return error(1)/success(0)
  SimpleFC::AddPort 51909 "OSHMI NGINX" 256 0 2 "" 1
  Pop $0 ; return error(1)/success(0)
  SimpleFC::AddPort 9000 "OSHMI PHP-CGI" 256 0 2 "" 1
  Pop $0 ; return error(1)/success(0)
  
  ; Verify system locale to set HMI language
  !define LOCALE_ILANGUAGE '0x1' ;System Language Resource ID     
  !define LOCALE_SLANGUAGE '0x2' ;System Language & Country [Cool]
  !define LOCALE_SABBREVLANGNAME '0x3' ;System abbreviated language
  !define LOCALE_SNATIVELANGNAME '0x4' ;System native language name [Cool]
  !define LOCALE_ICOUNTRY '0x5' ;System country code     
  !define LOCALE_SCOUNTRY '0x6' ;System Country
  !define LOCALE_SABBREVCTRYNAME '0x7' ;System abbreviated country name
  !define LOCALE_SNATIVECTRYNAME '0x8' ;System native country name [Cool]
  !define LOCALE_IDEFAULTLANGUAGE '0x9' ;System default language ID
  !define LOCALE_IDEFAULTCOUNTRY  '0xA' ;System default country code
  !define LOCALE_IDEFAULTCODEPAGE '0xB' ;System default oem code page

  System::Call 'kernel32::GetSystemDefaultLangID() i .r0'
  System::Call 'kernel32::GetLocaleInfoA(i 1024, i ${LOCALE_SNATIVELANGNAME}, t .r1, i ${NSIS_MAX_STRLEN}) i r0'
  System::Call 'kernel32::GetLocaleInfoA(i 1024, i ${LOCALE_SNATIVECTRYNAME}, t .r2, i ${NSIS_MAX_STRLEN}) i r0'
  System::Call 'kernel32::GetLocaleInfoA(i 1024, i ${LOCALE_SLANGUAGE}, t .r3, i ${NSIS_MAX_STRLEN}) i r0'
  ;MessageBox MB_OK|MB_ICONINFORMATION "Your System LANG Code is: $0. $\r$\nYour system language is: $1. $\r$\nYour system language is: $2. $\r$\nSystem Locale INFO: $3."
  IntOp $R0 $0 & 0xFFFF
  ;MessageBox MB_OK|MB_ICONINFORMATION "$R0"
  IntCmp $R0 1046 lang_portuguese
  IntCmp $R0 1033 lang_english

  ; default is english - us
  Goto lang_english
  
lang_portuguese:
;  MessageBox MB_OK|MB_ICONINFORMATION "Portuguese"
  nsExec::Exec '$INSTDIR\i18n\go-pt_br.bat'
  Goto lang_end
  
lang_english:
;  MessageBox MB_OK|MB_ICONINFORMATION "English"
  nsExec::Exec '$INSTDIR\i18n\go-en_us.bat'
  Goto lang_end

  lang_end:    

  WriteUninstaller "bt-uninst.exe"

  MessageBox MB_OK "OSHMI Installed! Optionally, go to $INSTDIR\extprogs\ and run download_external_progs.bat."
  
SectionEnd

; Uninstaller

UninstallText "OSHMI Uninstall. All files will be removed from $INSTDIR !"
UninstallIcon "${NSISDIR}\Contrib\Graphics\Icons\nsis1-uninstall.ico"

Section "Uninstall"

; Fecha processos

  SetOutPath $INSTDIR\bin
  nsExec::Exec 'c:\oshmi\bin\stop_all.bat'

; Remove an application from the firewall exception list
  SimpleFC::RemoveApplication "$INSTDIR\webserver.exe"
  Pop $0 ; return error(1)/success(0)
  SimpleFC::RemoveApplication "$INSTDIR\hmishell.exe"
  Pop $0 ; return error(1)/success(0)
  SimpleFC::RemoveApplication "$INSTDIR\mon_proc.exe"
  Pop $0 ; return error(1)/success(0)
  SimpleFC::RemoveApplication "$INSTDIR\QTester104.exe"
  Pop $0 ; return error(1)/success(0)
  SimpleFC::RemoveApplication  "$INSTDIR\nginx_php\nginx.exe"
  Pop $0 ; return error(1)/success(0)
  SimpleFC::RemoveApplication "$INSTDIR\nginx_php\php\php-cgi.exe"
  Pop $0 ; return error(1)/success(0)

  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OSHMI"
  DeleteRegKey HKLM "SOFTWARE\OSHMI"
  WriteRegStr  HKCU "Software\Microsoft\Windows NT\CurrentVersion\Winlogon" "Shell" "explorer.exe"
  WriteRegDword HKCU "Software\Microsoft\Windows\CurrentVersion\Policies\System" "DisableTaskMgr" 0x00
  
  nsExec::Exec '$INSTDIR\etc\remove_services.bat'
  
  Delete "$INSTDIR\*.*"
  Delete "$INSTDIR\bin\*.*"
  Delete "$INSTDIR\bin\platforms\*.*"
  Delete "$INSTDIR\conf_templates\*.*"
  Delete "$INSTDIR\conf\*.*"
  Delete "$INSTDIR\db\db_cold\*.*"
  Delete "$INSTDIR\db\*.*"
  Delete "$INSTDIR\docs\*.*"
  Delete "$INSTDIR\etc\*.*"
  Delete "$INSTDIR\extprogs\*.*"
  Delete "$INSTDIR\htdocs\*.*"
  Delete "$INSTDIR\htdocs\images\*.*"
  Delete "$INSTDIR\i18n\*.*"
  Delete "$INSTDIR\linux\*.*"
  Delete "$INSTDIR\logs\*.*"
  Delete "$INSTDIR\scripts\*.*"
  Delete "$INSTDIR\svg\*.*"
  RMDir /r "$INSTDIR\bin" 
  RMDir /r "$INSTDIR\bin\platforms" 
  RMDir /r "$INSTDIR\browser" 
  RMDir /r "$INSTDIR\browser-data" 
  RMDir /r "$INSTDIR\conf" 
  RMDir /r "$INSTDIR\db" 
  RMDir /r "$INSTDIR\docs" 
  RMDir /r "$INSTDIR\etc" 
  RMDir /r "$INSTDIR\extprogs" 
  RMDir /r "$INSTDIR\htdocs"
  RMDir /r "$INSTDIR\i18n"
  RMDir /r "$INSTDIR\linux"
  RMDir /r "$INSTDIR\logs"
  RMDir /r "$INSTDIR\nginx_php"
  RMDir /r "$INSTDIR\scripts"
  RMDir /r "$INSTDIR\svg"
  RMDir /r "$INSTDIR"
  RMDir /r "$DESKTOP\OSHMI"

SectionEnd
                                                                                                                                            
