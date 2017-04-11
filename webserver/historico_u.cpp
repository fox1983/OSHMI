//---------------------------------------------------------------------------
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

#include <vcl.h>
#pragma hdrstop
#include <stdio.h>
#include <time.h>
#include "config.h"

#include "historico_u.h"
//---------------------------------------------------------------------------
#pragma package(smart_init)
#pragma resource "*.dfm"
TfmHist *fmHist;

//---------------------------------------------------------------------------
__fastcall TfmHist::TfmHist(TComponent* Owner)
        : TForm(Owner)
{
}

void TfmHist::PushVal( int nponto, float valor, int flags, double tagtempo )
{
THistValor hvl;
hvl.nponto = nponto;
hvl.valor = valor;
hvl. flags = flags;
hvl.tagtempo = tagtempo;
ListaValHist.push_back( hvl );
}

//---------------------------------------------------------------------------

void TfmHist::ProcessaFila()
{
static int tickant=0;
int cnt = 0;
DWORD tickini = GetTickCount();
const int LIM_INSERT = 200; // o limite te�rico de insert composto � de 500, vou usar menos

static cntcall = 0;
Label6->Caption = ++cntcall;

  // espera juntar LIM_INSERT ou passar ao menos 3s para gravar menos
  if ( ( ListaValHist.size() >= (2 * LIM_INSERT) ) ||
       ( ListaValHist.size() > 0 && ( (tickini - tickant) > 3000 ) )
     )
    {
    FILE * fp;
    String fname;
    fname = fname.sprintf( "..\\db\\hist_%u.sql", GetTickCount() );
    fp = fopen( fname.c_str(), "at" );

    if ( fp != NULL )
      {
      String SQL;
      SQL = SQL + (String)"BEGIN DEFERRED TRANSACTION;\n";
      // vou usar insert or replace para fazer valer o �ltimo estado quando repetir a hora
      // tamb�m � �til para n�o dar erro
      String S;
      tm unxtm;
      time_t unxts;
      THistValor hvl;
      unsigned short year;
      unsigned short month;
      unsigned short day;
      unsigned short hour;
      unsigned short min;
      unsigned short sec;
      unsigned short msec;
      TDateTime dt;
      bool ins = true;

      // verifica se tem hor�rio de ver�o agora
      TIME_ZONE_INFORMATION tzi;
      DWORD wintz = GetTimeZoneInformation( &tzi );

      while ( ! ListaValHist.empty() ) // enquanto houver algo
        {
        if ( ins )
           {
           SQL = SQL + (String)"insert or replace into hist (nponto, valor, flags, data) values ";
           ins = false;
           }

        hvl = ListaValHist.front(); // pega a primeira da fila
        ListaValHist.pop_front(); // retira-a da fila

        dt = hvl.tagtempo;
        dt.DecodeDate( &year, &month, &day );
        dt.DecodeTime( &hour, &min, &sec, &msec );

        int isdst = ( wintz == 2 ) ? 1 : 0;
        unxtm.tm_year = year - 1900;
        unxtm.tm_mon = month - 1;
        unxtm.tm_mday = day;
        unxtm.tm_hour = hour;
        unxtm.tm_min = min;
        unxtm.tm_sec = sec;
        unxtm.tm_isdst = isdst; // deixa para o sistema determinar se est� ou n�o em Hor�rio de Ver�o
        unxts = mktime( &unxtm );

        SQL = SQL + S.sprintf( "(%u,%g,%u,%u),", hvl.nponto, hvl.valor, hvl.flags, unxts );

        if ( ++cnt > ( LIM_INSERT * 2.5 ) ) // evita trancar aqui por muito tempo
          {
          break;
          }

        if ( ! (++cnt % LIM_INSERT) ) // limite de insert composto em SQLITE � 500, vou aplicar menos
          {
          SQL[SQL.Length()] = ';'; // troca a �ltima v�rgula por ponto e v�rgula
          SQL = SQL + (String) "\n";
          ins = true;
          continue;
          }
        }

      SQL[SQL.Length()] = ';'; // troca a �ltima v�rgula por ponto e v�rgula
      SQL = SQL + (String) "\n";
      SQL = SQL + (String) "COMMIT;\n";
      fputs( SQL.c_str(), fp );
      fclose( fp );
      }
    }

if ( cnt != 0 )
  {
    Label3->Caption = ListaValHist.size();
    Label4->Caption = GetTickCount() - tickini;
  }
  
tickant = tickini;
}

void __fastcall TfmHist::Timer1Timer(TObject *Sender)
{
  // 1x por dia, �s 03:07, apaga eventos antigos para n�o crescer demais
  unsigned short Hora, Minuto, Seg, Mseg;
  static int Apagou = false;
  Now().DecodeTime( &Hora, &Minuto, &Seg, &Mseg );

  // evita apagar mais de uma vez no mesmo minuto
  if ( Hora == 3 && Minuto == 7 && !Apagou )
    {
    btApagaAntigosClick( Sender );
    Apagou = true;
    return;
    }

  if ( Hora != 3 || Minuto != 7 ) // libera para a pr�xima ocorr�ncia
    Apagou = false;

  ProcessaFila();
}

//---------------------------------------------------------------------------
void __fastcall TfmHist::btApagaAntigosClick(TObject *Sender)
{
    FILE * fp;
    String fname;
    fname = fname.sprintf( "..\\db\\hist_%u.sql", GetTickCount() );
    fp = fopen( fname.c_str(), "at" );
    if ( fp != NULL )
      {
      String SQL = "BEGIN IMMEDIATE TRANSACTION;\n";
      SQL = SQL + (String)"delete from hist where data < " + (String)( time(NULL) - 60*60*24*HIST_LIFETIME ) + (String)" ;\n";
      SQL = SQL + "COMMIT;\n";
      // N�o vou fazer VACUUM/REINDEX pois � muito lento e os espa�os vazios tendem a ser ocupados pelos novos dados
      // a tend�ncia � que o tamanho da tabela se mantenha constante ap�s atingir os 36 dias
      fputs( SQL.c_str(), fp );
      fclose( fp );
      }

}
//---------------------------------------------------------------------------

