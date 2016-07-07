//---------------------------------------------------------------------------
// VEDADOS.CPP
// Interface para visualiza��o de pontos e depura��o.
/*
OSHMI - Open Substation HMI
	Copyright 2008-2016 - Ricardo L. Olsen

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
//---------------------------------------------------------------------------

#include <vcl.h>
#pragma hdrstop

#include "config.h"
#include "webserver_u.h"
#include "vedados.h"
#include "bcolocal.h"
#include "dumpdb_u.h"
#include "about_u.h"
#include "eventos_u.h"
#include "bdtr_com.h"
#include "simul.h"
#include "lua_u.h"
#include "historico_u.h"
#include "i104m_u.h"

// Colunas do StringGrid
#define COL_PONTO  0
#define COL_ENDER  1
#define COL_ID     2
#define COL_DESCR  3
#define COL_VALOR  4
#define COL_QUALIF 5
#define COL_DATA   6
#define COL_DIFUS  7
#define COL_CONT   8
#define COL_ESTON  9
#define COL_ESTOFF 10
#define COL_KCONV1 11
#define COL_KCONV2 12

//---------------------------------------------------------------------------
#pragma package(smart_init)
#pragma resource "*.dfm"
TfmVeDados *fmVeDados;

void TfmVeDados::PulseBDTR( TColor cor )
{
  if ( fmVeDados )
  if ( fmVeDados->Visible )
  if ( fmVeDados->shBDTR->Brush->Color != cor )
   fmVeDados->shBDTR->Brush->Color = cor;
}

void TfmVeDados::PulseI104(TColor cor)
{
  if ( fmVeDados )
  if ( fmVeDados->Visible )
  if ( fmVeDados->shI104->Brush->Color != cor)
   fmVeDados->shI104->Brush->Color = cor;
}

void TfmVeDados::PulseSDE(TColor cor)
{
  if ( fmVeDados )
  if ( fmVeDados->Visible )
  if ( fmVeDados->shSDE->Brush->Color != cor )
   fmVeDados->shSDE->Brush->Color = cor;
}

void TfmVeDados::PulseWeb(TColor cor)
{
  if ( fmVeDados )
  if ( fmVeDados->Visible )
  if ( fmVeDados->shWeb->Brush->Color != cor )
   fmVeDados->shWeb->Brush->Color = cor;
}

void TfmVeDados::PulseDumpDB(TColor cor)
{
  if ( fmVeDados )
  if ( fmVeDados->Visible )
  if ( fmVeDados->shDumpDB->Brush->Color != cor )
   fmVeDados->shDumpDB->Brush->Color = cor;
}

//---------------------------------------------------------------------------
__fastcall TfmVeDados::TfmVeDados(TComponent* Owner)
        : TForm(Owner)
{
  EncontraPonto = 0;

  if ( Config_Le() != 0 )
    {
    Application->Terminate();
    return;
    }

  // se tem outra IHM tenta sincronizar os eventos
  if ( IHMRED_IP_OUTRO_IHM != "" )
    {
    String S = (String)"wget -t 1 -T 5 http://" +
               IHMRED_IP_OUTRO_IHM +
               (String)":" +
               (String)HTTP_PORTA_NGINX +
               (String)"/htdocs/eventsync.php -O ../db/soe_i0.sql";
    ExecExternApp( S.c_str() );
    }

  // esconde bot�es do controle avan�ados
  // ShowButtons( false );

  sgPontos->Cells[COL_PONTO][0] = "PointNum";
  sgPontos->Cells[COL_ENDER][0] = "Address";
  sgPontos->Cells[COL_ID][0] = "ID";
  sgPontos->Cells[COL_VALOR][0] = "Value";
  sgPontos->Cells[COL_QUALIF][0] = "Qualif.";
  sgPontos->Cells[COL_DATA][0] = "Date Time";
  sgPontos->Cells[COL_DIFUS][0] = "Difus.";
  sgPontos->Cells[COL_CONT][0] = "Modif.";
  sgPontos->Cells[COL_DESCR][0] = "Descript.";
  sgPontos->Cells[COL_ESTON][0] = "On State";
  sgPontos->Cells[COL_ESTOFF][0] = "Off State";
  sgPontos->Cells[COL_KCONV1][0] = "KCONV1";
  sgPontos->Cells[COL_KCONV2][0] = "KCONV2";

  BL.SetBeepIntSpeaker( BEEP_INTSPEAKER );
}

//---------------------------------------------------------------------------
void __fastcall TfmVeDados::Timer1Timer(TObject *Sender)
{
static unsigned int cntseg = 0;

  // Mostra o estado de prim�rio/secund�rio (reserva fica com a toolbar vermelha)
  if ( fmBDTR != NULL )
    {
    if ( fmBDTR->bdtr.EhPrincipal() )
      {
      if (fmVeDados->Color != clBtnFace)
        fmVeDados->Color = clBtnFace;
      }
    else
      {
      if (fmVeDados->Color != clRed)
        fmVeDados->Color = clRed;
      }
    }

  // esconde a janela pricipal, se assim configurado
  if ( HIDE && fmVeDados->Visible && cntseg == 10 )
    {
    Hide();
    }

  // mostra os pontos na janela principal
  if ( fmVeDados->Visible )
    {
    map <int, TPonto> &PontosTR = BL.GetMapaPontos();
    map <int, TPonto>::iterator it;
    int ponto;

      int i = 1;
      float valor;
      TFA_Qual qual;
      TDateTime timetag, dt;

      if (shBDTR->Brush->Color != clWhite)
        shBDTR->Brush->Color = clWhite;
      if (shI104->Brush->Color != clWhite)
        shI104->Brush->Color = clWhite;
      if (shSDE->Brush->Color != clWhite)
        shSDE->Brush->Color = clWhite;
      if (shWeb->Brush->Color != clWhite)
        shWeb->Brush->Color = clWhite;
      if (shDumpDB->Brush->Color != clWhite)
        shDumpDB->Brush->Color = clWhite;

      lbTime->Caption = Now().FormatString( WEBSERVER_DATE_FMT );

      for (it = PontosTR.begin(); it!=PontosTR.end(); it++, i++)
        {
        ponto = (*it).first; // n�mero do ponto
        TPonto &pto = ((*it).second); // dados do ponto

        // posiciona num ponto escolhido
        if ( EncontraPonto && ponto >= EncontraPonto )
          {
          sgPontos->TopRow = i; // posi��o no grid � a contagem atual
          EncontraPonto = 0; // termina a procura
          }

        // mostra estat�stica do ponto, se ele � vis�vel no StringGrid
        if ( i >= sgPontos->TopRow &&
             i <= sgPontos->TopRow + sgPontos->VisibleRowCount )
          {
          // verifica o tamanho do string grid
          if ( (unsigned)sgPontos->RowCount != PontosTR.size() +1 )
            sgPontos->RowCount = PontosTR.size() + 1;

          String S;
          S = ponto; // mostra o n�mero do ponto
          if ( S != sgPontos->Cells[COL_PONTO][i] )
            sgPontos->Cells[COL_PONTO][i] = S;

          valor = pto.Valor;
          qual.Byte = pto.Qual.Byte;
          timetag = pto.TagTempo;

          dt = timetag;
          S.sprintf("%7.2f", valor);
          if (S != sgPontos->Cells[COL_VALOR][i]) sgPontos->Cells[COL_VALOR][i] = S;
          char str[500];
          S = S.sprintf("%d", pto.Endereco);
          if (S != sgPontos->Cells[COL_ENDER][i]) sgPontos->Cells[COL_ENDER][i] = S;
          S = pto.GetNome();
          if (S != sgPontos->Cells[COL_ID][i]) sgPontos->Cells[COL_ID][i] = S;
          S.sprintf("%02x", qual.Byte);
          if (S != sgPontos->Cells[COL_QUALIF][i]) sgPontos->Cells[COL_QUALIF][i] = S;
          S = dt.FormatString( WEBSERVER_DATE_FMT );
          if (S != sgPontos->Cells[COL_DATA][i]) sgPontos->Cells[COL_DATA][i] = S;
          S = pto.CntAtu;
          if (S != sgPontos->Cells[COL_DIFUS][i]) sgPontos->Cells[COL_DIFUS][i] = S;
          S = pto.CntAltEst;
          if (S != sgPontos->Cells[COL_CONT][i]) sgPontos->Cells[COL_CONT][i] = S;
          pto.GetModDescr( str );
          S = str;
          if ( S != sgPontos->Cells[COL_DESCR][i] ) sgPontos->Cells[COL_DESCR][i] = S;

          S = S.sprintf("%.4f", pto.KConv1);
          if (S != sgPontos->Cells[COL_KCONV1][i]) sgPontos->Cells[COL_KCONV1][i] = S;
          S = S.sprintf("%.4f", pto.KConv2);
          if (S != sgPontos->Cells[COL_KCONV2][i]) sgPontos->Cells[COL_KCONV2][i] = S;

          if ( pto.GetTipo() == 'D' )
            {
            S = pto.GetEstadoOn();
            if (S != sgPontos->Cells[COL_ESTON][i]) sgPontos->Cells[COL_ESTON][i]=S;
            S = pto.GetEstadoOff();
            if (S != sgPontos->Cells[COL_ESTOFF][i]) sgPontos->Cells[COL_ESTOFF][i]=S;
            }
          else
            {
            S = pto.GetUnidade();
            if (S != sgPontos->Cells[COL_ESTON][i]) sgPontos->Cells[COL_ESTON][i] = S;
            }
          }
        }
    }

  if ( ! (cntseg % 5) )
    {
    // ativa watchdog de software
    String s = GetCommandLine();
    s = s + "\nContagem ";
    s = s + cntseg;
    int enviados = s.Length() + 1;

    NMUDPWD->SendBuffer(s.c_str(), s.Length() + 1, enviados);
    }

  cntseg++;
}
//---------------------------------------------------------------------------
void __fastcall TfmVeDados::btBuscaPontoClick(TObject *Sender)
{
  EncontraPonto = edBusca->Text.ToInt();
}
//---------------------------------------------------------------------------

void __fastcall TfmVeDados::btBDTRClick(TObject *Sender)
{
  fmBDTR->Show();
}
//---------------------------------------------------------------------------

void __fastcall TfmVeDados::btSDEClick(TObject *Sender)
{
  fmSDE->Show(); 
}
//---------------------------------------------------------------------------

void __fastcall TfmVeDados::btWebServClick(TObject *Sender)
{
  fmWebServ->Show();
}
//---------------------------------------------------------------------------

void __fastcall TfmVeDados::edBuscaKeyDown(TObject *Sender, WORD &Key,
      TShiftState Shift)
{
if ( Key == VK_RETURN )
   btBuscaPonto->Click();
}
//---------------------------------------------------------------------------

void __fastcall TfmVeDados::edtPasswdChange(TObject *Sender)
{
  if ( PasswdTest( edtPasswd->Text.c_str() ) )
    {
    // ShowButtons( true );
      
    IncluiEvento( NPONTO_LOGIN_ADM,
                  255,
                  ESTDUP_ON,
                  0,
                  SDE_GERAHORA,
                  0,
                  0,
                  0,
                  0,
                  0 );
    BL.EscrevePonto( NPONTO_LOGIN_ADM, 0, ESTDUP_ON );
    }
  else
    {
    bool found;
    TPonto &ptlogin = BL.GetRefPonto( NPONTO_LOGIN_ADM, found );
    if ( ptlogin.GetDoubleState() == ESTDUP_ON  )
      {
      // ShowButtons( false );

      IncluiEvento( NPONTO_LOGIN_ADM,
                    255,
                    ESTDUP_OFF,
                    0,
                    SDE_GERAHORA,
                    0,
                    0,
                    0,
                    0,
                    0 );
      BL.EscrevePonto( NPONTO_LOGIN_ADM, 1, ESTDUP_OFF );
      }
    }
}
//---------------------------------------------------------------------------

void TfmVeDados::ShowButtons( bool ShowBt )
{

    btBDTR->Visible = ShowBt;
    btSDE->Visible = ShowBt;
    btWebServ->Visible = ShowBt;
    btDumpdb->Visible = ShowBt;
    btClose->Visible = ShowBt;
    btScript->Visible = ShowBt;
    btHist->Visible = ShowBt;
    btIEC104->Visible = ShowBt;

    // habilita sempre o bot�o de simula��o quando houver simula��o
    btSimul->Visible = ShowBt;
    if ( SIMULACAO != SIMULMOD_NAO )
      {
      btSimul->Visible = true;
      }

}

//---------------------------------------------------------------------------

void __fastcall TfmVeDados::FormDblClick(TObject *Sender)
{
  if ( edtPasswd->Visible )
    {
    edtPasswd->Visible = false;
    }
  else
    {
    edtPasswd->Visible = true;
    edtPasswd->SetFocus();
    }
}
//---------------------------------------------------------------------------

void __fastcall TfmVeDados::btDumpdbClick(TObject *Sender)
{
  fmDumpdb->Show();
}
//---------------------------------------------------------------------------

void __fastcall TfmVeDados::Image2DblClick(TObject *Sender)
{
  AboutForm->Show();
}
//---------------------------------------------------------------------------

void __fastcall TfmVeDados::btCloseClick(TObject *Sender)
{
  fmBDTR->FinalizandoAplicacao(); // manda mensagem ao BDTR avisando que vai cair fora
  IHM_VaiFinalizar(); // sinaliza que est� finalizando
  Close();
}
//---------------------------------------------------------------------------

void __fastcall TfmVeDados::FormCloseQuery(TObject *Sender, bool &CanClose)
{
    if ( PasswdTest( edtPasswd->Text.c_str() ) )
      {
      }
    else
      {
      // CanClose = false; // n�o deixa fechar o programa sem a senha
      // edtPasswd->Visible=true;
      }

    fmBDTR->FinalizandoAplicacao(); // manda mensagem ao BDTR avisando que vai cair fora
    // fmDumpdb->DumpDB(0); // faz um dump geral da base
    Sleep( (DWORD)200 );
    IHM_VaiFinalizar(); // sinaliza que est� finalizando
}
//---------------------------------------------------------------------------

void __fastcall TfmVeDados::WMQueryEndSession(TMessage & Message)
{
Message.Result = true;
}

//---------------------------------------------------------------------------
void __fastcall TfmVeDados::WMEndSession(TMessage & Message)
{
Close();
}

//---------------------------------------------------------------------------
void __fastcall TfmVeDados::btSimulClick(TObject *Sender)
{
fmSimul->Show();
}
//---------------------------------------------------------------------------

void __fastcall TfmVeDados::btScriptClick(TObject *Sender)
{
fmLua->Show();
}
//---------------------------------------------------------------------------

void __fastcall TfmVeDados::btIEC104Click(TObject *Sender)
{
fmBDTR->bdtr.ShowConv104BDTR(); // mostra conversor IEC104/BDTR
fmIEC104M->Show();
}
//---------------------------------------------------------------------------

void __fastcall TfmVeDados::btHistClick(TObject *Sender)
{
fmHist->Show();
}
//---------------------------------------------------------------------------

