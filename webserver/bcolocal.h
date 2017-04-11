#ifndef BCOLOCAL_H_
#define BCOLOCAL_H_
/*
        BCOLOCAL.H
        Classes para manipula��o de pontos e grupo em tempo real.
        Ricardo L. Olsen
*/

//#include <ScktComp.hpp>
#include <map>
#include <set>

using namespace std;

#pragma pack(push)
#pragma pack(1) // membros das estruturas alinhados em byte

#define LIMITE_PONTOS_TABULAR 8000  // n�mero de m�ximo pontos da lista filtrada para o tabular
#define LIMITE_PONTOS_ANORMAIS 2000 // n�mero de m�ximo pontos da lista de anormais, deve ser menor que o do tabular

#define SIMULMOD_NAO 0
#define SIMULMOD_LOCAL 1
#define SIMULMOD_MESTRE 2
#define SIMULMOD_ESCRAVO 3

// estados poss�veis de beep 
#define BEEP_NENHUM 0
#define BEEP_NORMAL 1
#define BEEP_CRITICO 2

#define NPONTO_CMDSCRIPT_MIN 100000
#define NPONTO_CMDSCRIPT_1   NPONTO_CMDSCRIPT_MIN+1
#define NPONTO_CMDSCRIPT_2   NPONTO_CMDSCRIPT_MIN+2
#define NPONTO_CMDSCRIPT_3   NPONTO_CMDSCRIPT_MIN+3
#define NPONTO_CMDSCRIPT_4   NPONTO_CMDSCRIPT_MIN+4
#define NPONTO_CMDSCRIPT_5   NPONTO_CMDSCRIPT_MIN+5
#define NPONTO_SUPSCRIPT_1   NPONTO_CMDSCRIPT_MIN+100+1
#define NPONTO_SUPSCRIPT_2   NPONTO_CMDSCRIPT_MIN+100+2
#define NPONTO_SUPSCRIPT_3   NPONTO_CMDSCRIPT_MIN+100+3
#define NPONTO_SUPSCRIPT_4   NPONTO_CMDSCRIPT_MIN+100+4
#define NPONTO_SUPSCRIPT_5   NPONTO_CMDSCRIPT_MIN+100+5

#define NPONTO_SIST_MAX      100000
#define NPONTO_BANCO_ATIVO   NPONTO_SIST_MAX-1
#define NPONTO_OSHMI_OPER  NPONTO_SIST_MAX-2
#define NPONTO_OSHMI_MODO  NPONTO_SIST_MAX-3
#define NPONTO_ACERTO_HORA   NPONTO_SIST_MAX-4
#define NPONTO_COMUNIC_BDTR  NPONTO_SIST_MAX-5
#define NPONTO_COMUNIC_I104  NPONTO_SIST_MAX-6
#define NPONTO_LOGIN_ADM     NPONTO_SIST_MAX-7
#define NPONTO_EVENTODESCART NPONTO_SIST_MAX-8
#define NPONTO_FALHAINTERNA  NPONTO_SIST_MAX-9
#define NPONTO_HORA          NPONTO_SIST_MAX-10
#define NPONTO_MINUTO        NPONTO_SIST_MAX-11
#define NPONTO_I104UTRS_OK   NPONTO_SIST_MAX-12
#define NPONTO_SIST_MIN      NPONTO_SIST_MAX-13

#define BL_MAXPONTOSNOGRUPO 1500   // n�mero m�ximo de pontos
#define QUAL_CASADEC 0x03          // casa decimal no ponto anal�gico
#define QUAL_TIPO  0x20            // flag para o tipo do ponto Anal�gico/Digital
#define QUAL_FALHATAG 0x40         // flag para falha em tag de tempo de eventos
#define QUAL_FALHA 0x80            // flag para a invalidade do ponto
#define TIPO_ANALOGICO 1
#define TIPO_DIGITAL   0
#define QUAL_ORIGEM 0x0C
#define QUAL_ESTADO 0x01
#define QUAL_ESTADO_DUPLO 0x03
#define QUAL_SUBST  0x10
// #define QUAL_EVENTOANALOGICO 0x10  // flag de registro de evento anal�gico com valor no campo UTR
#define ORG_SUPERVISIONADO 0x00    // origem normal: supervisionado
#define ORG_CALCULADO      0x04    // ponto com origem em c�lculo
// #define ORG_ESTIMADO       0x08    // deprecated, em desuso, alterado pelo seguinte:
#define ORG_CARGAINIC      0x08    // Ponto nunca atualizado
#define ORG_MANUAL         0x0C    // ponto de origem manual
#define ORG_MASCARA        0x0C    // mascara de origem 

#define ORIGEM_SUPERVISIONADO 0
#define ORIGEM_CALCULADO      1
#define ORIGEM_ESTIMADO       2
#define ORIGEM_CARGAINI       2
#define ORIGEM_MANUAL         3

#define FA_ESTFASIM_OFF       1
#define FA_ESTFASIM_ON        0

#define ESTDUP_INDETERMINADO  0
#define ESTDUP_OFF            1
#define ESTDUP_ON             2
#define ESTDUP_INVALIDO       3
#define ESTDUP_MASCARA        3

#define MAX_PARCELAS 10 // m�ximo de parcelas de c�lculo
#define COD_FORMULA_CORRENTE     1
#define COD_FORMULA_PA           3
#define COD_FORMULA_SOMA         4
#define COD_FORMULA_E            6
#define COD_FORMULA_OU           7
#define COD_FORMULA_PAI          9
#define COD_FORMULA_SOMANEG     10
#define COD_FORMULA_DIF         15
#define COD_FORMULA_ESCOLHA_DIG 50
#define COD_FORMULA_ESCOLHA_ANA 51
#define COD_FORMULA_ESTCOMUNIC  52

#define RGLIM_NORMAL 0
#define RGLIM_ALMINF 1
#define RGLIM_ALMSUP 2

#define ESTALM_OFF 0
#define ESTALM_ON  1
#define ESTALM_ALL 2
#define ESTALM_EVT 3

#define CODTPEQ_KV    1
#define CODTPEQ_AMP   3
#define CODTPEQ_MW    6
#define CODTPEQ_MVAR  7
#define CODTPEQ_HZ    9
#define CODTPEQ_VDC  14
#define CODTPEQ_TAP  16
#define CODTPEQ_DJ   27
#define CODTPEQ_SC   28

#define CODORIGEM_NORMAL     0
#define CODORIGEM_CALCULADO  1
#define CODORIGEM_MANUAL     6
#define CODORIGEM_COMANDO    7
#define CODORIGEM_LUA       23

inline bool QualEstado(unsigned char qual)
  {
  return (qual & QUAL_ESTADO);
  }

inline bool QualEhFalhado(unsigned char qual)
  {
  return (qual & QUAL_FALHA);
  }

inline bool QualEhSubstituido(unsigned char qual)
  {
  return ( qual & QUAL_SUBST );
  }

inline bool QualEhAnalogico(unsigned char qual)
  {
  return (qual & QUAL_TIPO);
  }

inline bool QualEhSupervisionado(unsigned char qual)
  {
  return ( (qual & QUAL_ORIGEM) == ORG_SUPERVISIONADO );
  }

inline bool QualEhCargaInic(unsigned char qual)
  {
  return ( (qual & QUAL_ORIGEM) == ORG_CARGAINIC );
  }

// Estrutura para formato A de qualificador de ponto digital e anal�gico
typedef struct
{
bool dumb_1:1;     // n�o importa
bool AcertoHora:1; // indica que houve acerto de hora para tr�s
bool Origem1:1;    // origem - 0=supervisionado 1=calculado 0=carga ini 1=manual
bool Origem2:1;    //          0                0           1           1
bool Subst:1;      // indicador de ponto substituido, imposi��o manual
bool Tipo:1;       // tipo do ponto 1=anal�gico, 0=digital
bool Quest:1;      // bit de questionamento, questiona a validade da medida
bool Falha:1;      // indicador de falha na atualiza��o, valor antigo
} TFA_Comum;

// Estrutura para formato A de qualificador de ponto digital
typedef struct
{
bool Estado:1;     // estado 0 ou 1
bool NaoUsado:1;   // n�o usado
bool Origem1:1;    // origem - 0=supervisionado 1=calculado 0=carga ini 1=manual
bool Origem2:1;    //          0                0           1           1
bool Subst:1;      // indicador de ponto substituido, imposi��o manual
bool Tipo:1;       // tipo do ponto 1=anal�gico, 0=digital
bool Quest:1;      // bit de questionamento, questiona a validade da medida
bool Falha:1;      // indicador de falha na atualiza��o, valor antigo
} TFA_Digital;

// Estrutura para formato A de qualificador de ponto anal�gico
typedef struct
{
bool CasaDecimal1:1; // casa decimal: 0, 1, 2 ou 3 casas
bool CasaDecimal2:1; // a casa decimal n�o � v�lida para o ponto no banco local!
bool Origem1:1;    // origem - 0=supervisionado 1=calculado 0=carga ini 1=manual
bool Origem2:1;    //          0                0           1           1
bool Subst:1;      // indicador de ponto substituido, imposi��o manual
bool Tipo:1;       // tipo do ponto 1=anal�gico, 0=digital
bool Quest:1;      // bit de questionamento, questiona a validade da medida
bool Falha:1;      // indicador de falha na atualiza��o, valor antigo
} TFA_Analogico;

// Qualificadores de ponto em formato A
typedef union
{
TFA_Digital Dig;
TFA_Analogico Ana;
TFA_Comum Pto;
unsigned char Byte;

// Estrutura para formato A de qualificador de ponto digital
struct
{
bool Estado:1;     // estado 0 ou 1
bool EstadoH:1;   // n�o usado
bool Origem1:1;    // origem - 0=supervisionado 1=calculado 0=carga ini 1=manual
bool Origem2:1;    //          0                0           1           1
bool Subst:1;      // indicador de ponto substituido, imposi��o manual
bool Tipo:1;       // tipo do ponto 1=anal�gico, 0=digital
bool Quest:1;      // bit de questionamento, questiona a validade da medida
bool Falha:1;      // indicador de falha na atualiza��o, valor antigo
};

// Estrutura para formato A de qualificador de ponto digital
struct
{
unsigned Duplo:2;      // Estado duplo
unsigned Origem:2;     // origem - 0=supervisionado 1=calculado 2=carga ini 3=manual
bool _dumb4:1;     // indicador de ponto substituido, imposi��o manual
bool _dumb5:1;     // tipo do ponto 1=anal�gico, 0=digital
bool FalhaTag:1;   // bit de questionamento ou falha do tag de tempo de eventos
bool _dumb7:1;     // indicador de falha na atualiza��o, valor antigo
};

// Estrutura para formato A de qualificador de ponto anal�gico
struct
{
bool CasaDecimal1:1; // casa decimal: 0, 1, 2 ou 3 casas
bool CasaDecimal2:1; // a casa decimal n�o � v�lida para o ponto no banco local!
bool dumb2:1;    // origem - 0=supervisionado 1=calculado 0=carga ini 1=manual
bool dumb3:1;    //          0                0           1           1
bool dumb4:1;      // indicador de ponto substituido, imposi��o manual
bool dumb5:1;      // tipo do ponto 1=anal�gico, 0=digital
bool dumb6:1;      // bit de questionamento
bool dumb7:1;      // indicador de falha na atualiza��o, valor antigo
};

// Estrutura para formato A de qualificador de ponto anal�gico
struct
{
bool CasaDecimal:2; // casa decimal: 0, 1, 2 ou 3 casas
bool dumb8:6;
};

// Estrutura para formato A de qualificador de ponto anal�gico
struct
{
bool RegiaoAlarme:2; // Regian de alarme 0=NORMAL, 1=LIMINF., 2=LIMSUP ou 3=INVALIDA
bool dumb9:2;        //
bool EventoAnalogicoVUTR:1; // Para eventos anal�gicos, 1=espont�neo com valor em UTR, 0=registro de alarme de limite
bool dumb10:3;       //
};

} TFA_Qual;

// Qualificadores de ponto formato IEC
typedef struct
{
bool SPI:1;         // estado 0 ou 1
bool NaoUsado1:1;   // n�o usado
bool NaoUsado2:1;   // n�o usado
bool NaoUsado3:1;   // n�o usado
bool BL:1;          // Bloqueado
bool SB:1;          // indicador de ponto substituido, imposi��o manual
bool NT:1;          // Atualizado / Antigo
bool IV:1;          // V�lido / Inv�lido
} TSIQ;

typedef struct
{
bool OV:1;          // overflow
bool NaoUsado1:1;   // n�o usado
bool NaoUsado2:1;   // n�o usado
bool NaoUsado3:1;   // n�o usado
bool BL:1;          // Bloqueado
bool SB:1;          // indicador de ponto substituido, imposi��o manual
bool NT:1;          // Atualizado / Antigo
bool IV:1;          // V�lido / Inv�lido
} TQDS;

typedef union
{
TSIQ SIQ;
TQDS QDS;
unsigned char Byte;
} TIECQual;

// Estrutura para descri��o de um Ponto
class TPonto
{
public:
volatile bool Acessando; // flag para exclus�o no acesso
int NPonto;              // n�mero do ponto, chave de acesso ao ponto
float Valor;             // valor atual
float ValorNormal;       // valor normal
short sValor;            // valor inteiro
short lixo_alinhamento;  //
char TipoAD;             // tipo do ponto: 'A'=anal�gico 'D'=digital
TFA_Qual Qual;           // qualificador
TFA_Qual QualAnt;        // estado anterior
TFA_Qual QualEvt;        // �ltimo qualificador quando recebeu com tag de tempo (evento)
double TagTempo;         // hora da �ltima atualiza��o
double TagTempoAltValor; // hora da �ltima altera��o de valor
double TagTempoAlarme;   // hora do alarme
double Timeout;          // tempo para falhar o ponto n�o atualizado
double TimeoutCongel;    // tempo para sinalizar ponto anal�gico congelado
double TagTempoEvento;   // �ltimo tag de tempo registrado em evento
float ValorHist;         // �ltimo valor gravado no hist�rico
unsigned TickHist;       // system tick da �tima grava��o no hist�rico em ms
float BandaMortaHist;    // Banda morta para hist�rico em percentual do valor corrente
int Congelamento;        // 0 = normal, 1 = ponto congelado
unsigned CntAltEst;      // conta altera��es no valor
int CntAtu;              // contador de atualiza��es
int Alarme;              // =0:sem alarme ou reconhecido, !=0: alarme n�o reconhecido
float LimInf;            // Limite inferior
float LimSup;            // Limite superior
float Hister;            // Histerese para alarme
float KConv1;            // fatores de convers�o a.x+b
float KConv2;
float ValorTipico;       // valor t�pico para o ponto (para simula��o)
int RegiaoAlmLimite;     // Regiao de alarme de limite (normal, inferior ou superior)
bool AlrIn;              // Inibi��o do alrme
int PontoSupCmd;         // Liga o ponto de comando ao supervisionado
int PontoCmdSup;         // Liga o ponto supervisionado ao de comando
int PontoIntertrav;      // Ponto de intertravamento (somente para ponto de comando)
int Formula;             // c�digo da f�rmula
bool EventoDigital;      // informa se o ponto � de evento digital
bool EventoAnalogico;    // informa se o ponto � de evento anal�gico
int CmdAckCmd;           // �ltimo comando enviado 1/2
int CmdAckFalha;         // indica falha no �ltimo comando
int CmdAckCnt;           // contagem de confirmacoes de comandos
double CmdAckTagTempo;   // hora da �ltima confirma��o
int EstadoAlarme;        // 0=alarme no estado off, 1=alarme no estado on, 2=ambos s�o alarme
int Prioridade;          // prioridade de alarme 0=mais importante
int Endereco;            // endereco f�sico no protocolo
int UTR;                 // UTR para envio de comando e atualiza��o do ponto no iec104
int CmdSBO;              // Select Befor Operate (1=com select, 0=sem select)
int CmdDuracao;          // Dura��o do comando (0,1,2,3=normal,curto,longo,persistente)
int CmdASDU;             // ASDU de comando
int CodOrigem;           // c�digo de origem do ponto (1=calculado, 6=manual, etc.)
int CodTpEq;             // c�digo do tipo de equipamento
int CodInfo;             // c�digo da informa��o complementar
int CodOCR;              // c�digo da OCR
int CasaDecimal;         // n�mero de casas para o hist�rico
int Parcelas[MAX_PARCELAS];  // parcelas de c�lculo
char Anotacao[1000];      // Anota��o
char Tag[30];            // Tag do ponto, ID do SAGE
char Unidade[10];        // Unidade de medida
char Estacao[30];        // Esta��o, instala��o, localidade ou subesta��o
char Modulo[30];         // M�dulo, v�o, ou bay. subdivis�o de esta��o para agrupamento de pontos
char Descricao[80];      // Descri��o da grandeza supervisionada
char EstadoOn[25];       // Descritivo para o Estado On
char EstadoOff[25];      // Descritivo para o Estado Off

TPonto(); // construtor

int GetDoubleState(); // returns 0=TRANSIT or analog, 1=OFF, 2=ON, 3=INV
bool DentroBandaMortaHist(); // testa se est� dentro da banda morta do hist�rico
void GetModDescr( char * descr );
char * GetEstadoOn();
char * GetEstadoOff();
char * GetDescricao();
char * GetUnidade();
char * GetAnotacao();
char * GetEstacao();
char * GetNome();
char * GetModulo();
int GetSupCmd();
String GetTipo();
float GetValorNormal();
int GetEstadoAlarme();
float GetLimSup();
float GetLimInf();
void SetTimeAlarm( double timetag );
double GetTimeAlarm();
int GetPriority();
void SetLimInf( float val );
void SetLimSup( float val );
void SetHister( float val );
bool TemAnotacao();
bool ComandoBloqueado();
bool TemAlarmePersistente();
bool EhComando();
bool EhEventoDigital();
bool EhEventoAnalogico();
bool EhDigital();
bool EhAnalogico();
bool TemFormula();
bool AlarmeInibido();
bool AlarmeNaoReconhecido();
bool Congelado();
bool TemCadastro();
bool ValorOk();
void SetAnotacao( char * anot );
void SetValorTipico( float val );
bool GetAlrIn();
void SetAlrIn( bool val );
void AlarmaPonto();
void AlarmAck();
bool EhComandoDigital();
};

// Classe Banco Local, representa um banco de tempo real local
// com base nos dados recebidos por grupos de difus�o
class TBancoLocal
{
private:

TCHAR UserName[200 + 1];
bool UDPActive;
int CntIntegridade;
int TemBeep; // informa se o alarme bipa
int ModoSimulacao; // indica modo simula��o

map <int, TPonto> Pontos; // mapa para os pontos a escutar, chave de nponto
map <int, int> MapNPontoPorEndUTR; // mapa para achar nponto pelo endere�o f�sico e utr
map <String, int> MapNPontoPorTag; // mapa para encontrar nponto pelo tag

set <String> ListaSEs; // lista das subesta��es

public:
map <String, int> DisjModulo; // mapa pelo nome do m�dulo para o ponto do disjuntor
int NPontoPorEndUTR ( int endereco, int utr );
int LastBeepPnt; // �ltimo ponto a bipar (alarmar)
bool BipaNoSpeaker; // informa se o alarme deve bipar no falante interno
unsigned NumVariacoes; // regista o n�mero de varia��es digitais
TBancoLocal(); // construtor
~TBancoLocal(); // destrutor

char * getUserName();
void setUserName(char * str);

// retorna refer�ncia ao mapa de pontos
map <int, TPonto> & GetMapaPontos(void);

// Devolve o valor, o qualificador e o tag de tempo do ponto.
// Retorna true se ok, false se o ponto n�o est� no banco local.
bool GetPonto(int nponto, float &valor, TFA_Qual &qual, double &tagtempo);
// retorna refer�ncia para estrutura ponto
TPonto & GetRefPonto(int nponto);
TPonto & GetRefPonto(int nponto, bool &found);
TPonto & GetRefPontoByTag(String tag, bool &found);

bool PontoExiste( int nponto );

int EscrevePonto(int nponto, float valor, unsigned char qualif, int calculo=0, int usakconv=0, int temtagtmp=0, int espontaneo=0);
int GetTagPonto(int nponto, char * tag);
int GetModDescrPonto(int nponto, char * descr);
int AlarmeNaoReconhecidoPonto(int nponto);
int ReconheceAlarmePonto(int nponto);
String ConsultaInfoPonto(int nponto);
void GetListaSEs(char * lista);
int GetListaPontosFiltSubstMod(char *filtSubst, char *filtMod, int * lista, int tipo_alm, int sem_eventos);
int GetListaPontosFilt(char *filt, int * lista, int tipo_alm, int sem_eventos);
int GetSupCmd(int nponto);
bool ComandoIntertravado(int npontocmd);

// recebe escrita de ponto em formato IEC (101/104)
int EscreveIEC(unsigned int endereco, unsigned int tipo, void * ptinfo, unsigned int taminfo, unsigned int prim, unsigned int sec, unsigned int causa  );

String GetNome(int nponto);
String GetTipo(int nponto);
void SetValorTipico(int nponto, float val);
bool GetAlrIn(int nponto);

void SilenciaBeep();
int HaBeepAtivo();
void AtivaBeep( int tipo = BEEP_NORMAL );
int SetAckCmd(int nponto, int falha, int cmd); // seta ack de comando
int GetAckCmd(int nponto, int *falha, int *cmd, double *hora); // testa ack de comando

void RecebeuIntegridade(); // informa que recebeu integridade, conta
int GetIntegridade(); // devolve contagem de integridade

void SetSimulacao(int modsimul);
int GetSimulacao();
bool HaSimulacao();
void ProcessaCalculosDigitais();
void ProcessaCalculosAnalogicos();
void ProcessaTimeout(); // processa falhas de timeout (pontos n�o atualizados)

void Calcula(int nponto); // executa c�lculo
void SetBeepIntSpeaker(bool bipa); // bipa ou nao no speaker interno
unsigned int GetNumVar();
};

extern TBancoLocal BL;

typedef struct {
        unsigned short nponto; // numero do ponto
        unsigned char nponto3; // 3 byte do numero do ponto
        unsigned char iq;      // informa�ao com qualificador
        unsigned short ms;     // milisegundos
        unsigned char min;     // minuto
        unsigned char hora;    // hora
        unsigned char dia;     // dia
        unsigned char mes;
        unsigned char ano;
} digital_w_time7;

typedef struct {
        unsigned char iq;     // informa�ao com qualificador
        unsigned short ms;    // milisegundos
        unsigned char min;    // minuto
        unsigned char hora;   // hora
        unsigned char dia;    // dia
        unsigned char mes;
        unsigned char ano;
} digital_w_time7_seq;

typedef struct {
        unsigned short nponto; // numero do ponto
        unsigned char nponto3; // 3 byte do numero do ponto
        unsigned char iq;      // informa�ao com qualificador
        unsigned short ms;     //milisegundos
        unsigned char min;     //minuto
} digital_w_time3;

typedef struct {
        unsigned char iq;     // informa�ao com qualificador
        unsigned short ms;    // milisegundos
        unsigned char min;    // minuto
} digital_w_time3_seq;

typedef struct {
        unsigned short nponto; // numero do ponto
        unsigned char nponto3; // 3 byte do numero do ponto
        short sva;             // valor analogico
        unsigned char qds;     // qualificador do ponto
} analogico;

typedef struct {
        short sva;         // valor analogico
        unsigned char qds; // qualificador do ponto
} analogico_seq;

typedef struct {
        unsigned short nponto; // numero do ponto
        unsigned char nponto3; // 3 byte do numero do ponto
        unsigned char vti;     // valor de tap
        unsigned char qds;     // qualificador
} step;

typedef struct {
        unsigned char vti;   // valor de tap
        unsigned char qds;   // qualificador
} step_seq;

typedef struct {
        unsigned short nponto; // numero do ponto
        unsigned char nponto3; // 3 byte do numero do ponto
        float fr;      	       // valor em ponto flutuante
        unsigned char qds;     // qualificador do ponto
} flutuante;

typedef struct {
        float fr;      		// valor em ponto flutuante
        unsigned char qds; 	// qualificador do ponto
} flutuante_seq;

long round_( double x );

#pragma pack(pop)
#endif // BCOLOCAL_H_

