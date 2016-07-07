-- script.lua

-- HMI functions available:
-- Fun��es do IHM dispon�veis para uso:
--
-- hmi_print : imprime valores no di�logo de scripts
--             argumentos: valores separados por v�rgula
--             print values on script dialog
--             args: comma separated strings
--
-- hmi_isprimary : retorna true se o ihm est� no estado prim�rio, false se secund�rio
--                 returns true if hmi is in primary state
--
-- hmi_settimer: ajuste o tempo de execu��o da fun��o ScriptCycle
--               argumento: tempo em ms
--               adjust cycle time for function ScriptCycle
--               args: time in ms
--
-- hmi_activatebeep: liga o beep de alarme sonoro
--                   beeps the alarm sound
--
-- hmi_getpoint: busca informa��es do ponto
--               argumento: n�mero do ponto
--               retorna: valor anal�gico (float) ou digital duplo (0,1,2 ou 3)
--                        estado de falha (1=falhado, 0=normal)
--                        tipo do ponto (1=anal�gico, 0=digital) 
--                        substitu�do? (1=sim, 0=n�o)
--                        comando bloqueado? (1=sim, 0=n�o)
--               obtains point info
--               args: point number
--               returns: analog value (float) or digital double (0,1=OFF,2=ON,3)
--                        fail state (1=failed, 0=normal) 
--                        point type (1=analog, 0=digital) 
--                        substituted? (1=yes, 0=no)
--                        command blocked? (1=yes, 0=no)
--
-- hmi_writepoint: escreve no ponto
--                 argumentos: n�mero do ponto, valor e estado de falha
--                 retorna: 0 se ok, 1 se n�o encontrou o ponto
--                 writes on point
--                 args: point number, value, fail state
--                 returns: 0 if ok, 1 if point not found
--
-- hmi_blkpoint: bloqueia comando do ponto supervisionado     
--               argumentos: n�mero do ponto e mensagem de bloqueio (anota��o)
--               retorna: 0 se ok, 1 se j� estava anotado, 2 se n�o achou o ponto
--               blocks command of supervised point
--               args: point number, description message (annotation)
--               returns: 0 if ok, 1 if point already annotated, 2 if point not found
--
-- hmi_unblkpoint: desbloqueia o comando do ponto supervisionado, somente se a mensagem de anota��o for igual
--                 argumentos: nponto e mensagem de anota��o
--                 retorna: 0 se ok, 1 se j� estava desbloqueado, 2 se n�o achou o ponto, 3 se a mensagem n�o for igual
--                 unblocks command of supervised point, only if same annotation message
--                 args: point number,description message (annotation)
--                 returns: 0 if ok, 1 if point already annotated, 2 if point not found
--    
-- hmi_sendcmd: envio de comando 
--              argumentos: n�mero de ponto de comando, valor
--              retorna: 0 se ok, 1 se, 3 se ponto n�o encontrado, 4 se bloqueado, nil se erro na quantidade de argumentos
--              sends command
--              args: command point number, value
--              returns: 0 if ok, 3 if point not found, 4 if blocked, nil if wrong arg number
--
-- hmi_getnpt:  consulta n�mero do ponto
--              argumento: tag do ponto
--              retorna: 0 se n�o encontrou, ou n�mero do ponto 
--              query point number by tag
--              argument: point tag
--              retorna: 0 if not found, or point number


-- Exemplo de script Lua para fazer bloqueio de comando das seccionadoras 
-- Example Lua script, blocks command on switch interlock

-- ajusta para rodar a cada 5 segundos 
-- adjusts times for 5 seconds
hmi_settimer( 5000 )

-- mensagem de inicializando
-- initialization message
hmi_print( "Inicializando script.lua!" )

-- Valores para os estados de DJ e SC
-- Switch IEC digital double values
CLOSED = 2
OPEN = 1
TRANSIT = 0 
INVALID = 3

-- Mensagem para a anota��o de bloqueio das seccionadoras
-- Block message
msg_intertrav = "Bloqueio automatico por intertravamento"

-- N�meros dos pontos de supervis�o dos estados de DJ e SC
-- Point numbers of breaker and switches
pts52_1 = 16249
pts89_4 = 16250
pts89_6 = 16252
pts89_8 = 16251

-- Come�a considerando estado indeterminidado para o DJ
-- Begins with invalid state
v52_1 = INVALID
va52_1 = INVALID

-- Atualiza os valores dos pontos supervisionados
-- get real time values
function GetValues()

  va52_1 = v52_1
  v52_1, falha, tipo, subst = hmi_getpoint(pts52_1)

end  

-- Fun��o principal, chamada automaticamente a cada periodo de timer 
-- Main function, called at each cycle period 
function ScriptCycle() 

  GetValues()

  if va52_1 ~= v52_1 then
 
    if  v52_1 == CLOSED then
      hmi_blkpoint( pts89_4,  msg_intertrav ) 
      hmi_blkpoint( pts89_6,  msg_intertrav ) 
      hmi_print("Blocking")
    end
    
    if  v52_1 == OPEN then
      hmi_unblkpoint( pts89_4, msg_intertrav ) 
      hmi_unblkpoint( pts89_6, msg_intertrav ) 
      hmi_print("Unblocking")
    end
    
  end
  
end

-- Intercepta comandos da IHM (callback), argumentos n�mero do ponto e valor (1=ON, 0=OFF para digitais ou valor anal�gico), retornar 0 para continuar a execu��o do comando e 1 para n�o continuar ao protocolo
-- Callback to intercept HMI commands, args: point number and value (1=ON, 0=OFF or analog value), must return 0 to continue command execution or 1 to stop (will not proceed to protocol level)
function InterceptCommands( pointnumber, commandvalue ) 

  -- if ( pointnumber == 12345 and commandvalue == 1 ) then
  -- do something
  -- end
  
  return 0
end
