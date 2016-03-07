#ifndef config_H
#define config_H

// Par�metros e constantes de configura��o do sistema

#define VERSAO "3.9"

extern int IEC104_PORT;
extern int IEC104_1_SEC; // endere�o secund�rio da utr 1
extern int IEC104_1_PRI; // endere�o prim�rio para falar com a utr1
extern String IEC104_1_IP; // endereco IP da utr1

extern int T_INTEGRIDADE; // pedido de integridade
extern int BDTR_PORTA; // porta de escuta para receber dados no protocolo BDTR
extern int BDTR_PORTA_CMD; // porta para envio de dados (ex. comandos) ao BDTR
extern int BDTR_GRUPO_INTEGRIDADE; // grupo a ser pedido ao BDTR na integridade
extern int HTTP_PORTA;
extern int HTTP_PORTA_NGINX;
extern String IP_BDTR1;
extern String IP_BDTR2;
extern int END_BDTR;
extern int END_IHM;
extern int ENVIA_COMANDOS; // repassa ou n�o comandos vindos da IHM WEB ao BDTR
extern int BDTR_ACERTO_HORA; // acerta ou n�o a hora pela recebida do BDTR
extern int BDTR_PERIODO_ENVIO_ACERTO_HORA; // periodo de envio de acerto de hora ao BDTR (s), 0=n�o envia
extern int PONTO_OPERACAO; // ponto para envio do estado da IHM

extern String IHMRED_IP_OUTRO_IHM;
extern int IHMRED_ACERTO_HORA;
extern int IHMRED_PERIODO_ENVIO_ACERTO_HORA ;

extern int PRIORIDADE_PANICO; // Valor da prioridade para mostrar eventos no modo p�nico (agrega=2)
extern int NUMMAX_ALARMES;
// extern int WEBSERVER_NOCACHE; // Permite desabilitar os headers de cache do servidor web
// extern int MOSTRA_EVENTOS_FALHADOS; // contrala se mostra (1) ou n�o (0) eventos com falha de valor no visor de eventos
extern int ALARMA_DUPLA_TRANSICAO; // alarma ou n�o quando recebe evento com estado igual ao atual
extern String WEBSERVER_CLIENTES_REMOTOS; // Lista separada por v�rgula de clientes remotos, * libera geral
extern String WEBSERVER_SCRIPT; // Nome do script servidor de c�digo javascript chamado de dentro do browser
extern String WEBSERVER_DATE_FMT; // date time format according to TDateTime::FormatString
extern String WEBSERVER_DP_TRANSIT; // message for iec digital double 00
extern String WEBSERVER_DP_INVALID; // message for iec digital double 11

extern int HIST_RECORD;
extern int HIST_DEADBANDFACTOR;

extern int DELAY;
extern int INTERVAL;
extern String RUN[];
// #define MAX_RUN 6 // m�ximo de programas a rodar
extern int BEEP_INTSPEAKER;
extern int HIDE;

extern int SIMULACAO;
#define MAX_ESCRAVOS_SIMUL 30
extern String LISTA_ESCRAVOS_SIMUL[];

extern int RUN_LINUX;
extern String RUN_VARREDORIEC104;
extern String RUN_NGINXPHP;

extern String RUN_PROCHIST;
extern String RUN_PROCEVENTOS;
extern String RUN_PROCPONTOS;
extern String END_PROCHIST;
extern String END_PROCEVENTOS;
extern String END_PROCPONTOS;

extern String VISOR_EVENTOS;
extern String VISOR_TABULAR;
extern String VISOR_TELAS;
extern String VISOR_CURVAS;
extern String VISOR_TENDENCIAS;

// senha default
#define SENHA_ADM "43C753D610B45C98BC986DAC30B340BD274A0E59" /* "oshmi" */

#define BEEP_FRQ 500
#define BEEP_DUR 200

#define ARQUIVO_INI "..\\conf\\hmi.ini"
#define ARQUIVO_INI_SHELL "..\\conf\\hmishell.ini"
#define ARQUIVO_INI_I18N "..\\i18n\\messages_i18n.ini"
#define ARQUIVO_LOG "..\\logs\\webserver.log"
#define ARQUIVO_LOGCMD "..\\logs\\cmd.log"

#define ARQUIVO_LIST1 "..\\conf\\sage_id.txt"
#define ARQUIVO_LIST2 "..\\conf\\point_list.txt"
#define ARQUIVO_CALC1 "..\\conf\\calculos.txt"
#define ARQUIVO_CALC2 "..\\conf\\point_calc.txt"

#define LIMSUPMAX  999999.0
#define LIMINFMIN -999999.0

int Config_Le(void);
void IHM_VaiFinalizar(void);
int IHM_EstaFinalizando(void);
bool PasswdTest( char * pswd );
void Loga(String msg, String arq = ARQUIVO_LOG);
void ExecExternApp(char * cmd);

#endif


