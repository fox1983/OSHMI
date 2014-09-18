//---------------------------------------------------------------------------
#include <vcl.h>
#pragma hdrstop
#include <stdio.h>
#include "lua_u.h"
#include "bcolocal.h"
#include "bdtr_com.h"
#include "simul.h"
#include "config.h"
#include "webserver_u.h"
#include "i104m_u.h"

//---------------------------------------------------------------------------
#pragma package(smart_init)
#pragma resource "*.dfm"
TfmLua *fmLua;

#define LUASCRIPTFILE "..\\scripts\\script.lua"

static int hmi_print( lua_State *L )
{
 char buff[5000];
 int n = lua_gettop( L );
 int i;
 for ( i = 1; i <= n; i++ )
 {
  if ( i > 1 ) printf( "\t" );
  if ( lua_isstring( L, i ) )
   sprintf( buff, "%s", lua_tostring( L, i ) );
  else if ( lua_isnil( L, i ) )
   sprintf( buff, "%s", "nil" );
  else if ( lua_isboolean( L, i ) )
   sprintf( buff, "%s", lua_toboolean( L, i ) ? "true" : "false" );
  else
   sprintf( buff, "%s:%p", luaL_typename( L, i ),lua_topointer( L, i ) );
  fmLua->mmErr->Lines->Add( buff );
 }
 return 0;
}

// altera o tempo de execução do script Lua cíclico.
// argumento: tempo em ms
static int hmi_settimer( lua_State *L )
{
  int n = lua_gettop( L );

  if ( n != 1 )
    return 0;

  int timerms = lua_tointeger( L, 1 );
  fmLua->Timer1->Interval = timerms;

  return 0;
}

// Busca informações sobre o ponto
// retorna: valor (estado duplo para digitais), falha, tipo analógico, substituido
// argumento: nponto
static int hmi_getpoint( lua_State *L )
{
  int n = lua_gettop( L );

  if ( n != 1 )
    {
    lua_pushnil( L );
    lua_pushnil( L );
    lua_pushnil( L );
    lua_pushnil( L );
    return 4;
    }

  int nponto = lua_tointeger( L, 1 );
  float valor;
  TFA_Qual qual;
  double tagtempo;

  bool found;
  TPonto &pt = BL.GetRefPonto( nponto, found );
  // bool found = BL.GetPonto( nponto, valor, qual, tagtempo );

  // valor , falha? , analógico? , substituído
  if ( found )
    {
    if ( pt.TipoAD == 'A' )
      lua_pushnumber( L, pt.Valor );
    else
      lua_pushinteger( L, pt.Qual.Duplo );

    lua_pushinteger( L, QualEhFalhado(pt.Qual.Byte) );
    lua_pushinteger( L, QualEhAnalogico(pt.Qual.Byte) );
    lua_pushinteger( L, QualEhSubstituido(pt.Qual.Byte) );
    }
  else
    {
    lua_pushnil( L );
    lua_pushnil( L );
    lua_pushnil( L );
    lua_pushnil( L );
    }

  return 4;
}

// bloqueia o comando do ponto supervisionado através de anotação
// retorna : c
// argumentos: nponto e mensagem de anotação
static int hmi_blkpoint( lua_State *L )
{
  int n = lua_gettop( L );

  if ( n != 2 )
    {
    lua_pushnil( L );
    return 1;
    }

  int nponto = lua_tointeger( L, 1 );

  char * pmsganot = (char *)lua_tostring ( L, 2 );

  bool found;
  TPonto &pt = BL.GetRefPonto( nponto, found );

  if ( found )
    {
    // só vou anotar se já não tiver anotação
    if ( pt.TemAnotacao() )
      { // tem anotação
      lua_pushinteger( L, 1 );
      }
    else
      { // não tem anotação
      pt.SetAnotacao( (char*) pmsganot );
      lua_pushinteger( L, 0 );
      }
    }
  else
    lua_pushinteger( L, 2 );

  return 1;
}

// desbloqueia o comando do ponto supervisionado, somente se a mensagem de anotação for igual
// retorna: 0 se ok, 1 se já estava desbloqueado, 2 se não achou o ponto, 3 se a mensagem não for igual
// argumentos: nponto e mensagem de anotação
static int hmi_unblkpoint( lua_State *L )
{
  int n = lua_gettop( L );

  if ( n != 2 )
    {
    lua_pushnil( L );
    return 1;
    }

  int nponto = lua_tointeger( L, 1 );

  char * pmsganot = (char *)lua_tostring ( L, 2 );

  bool found;
  TPonto &pt = BL.GetRefPonto( nponto, found );

  if ( found )
    {
    // só vou anotar se já não tiver anotação
    if ( pt.TemAnotacao() )
      { // tem anotação
      if ( strcmp( pt.GetAnotacao(), pmsganot ) == 0 )
        {
        lua_pushinteger( L, 0 );
        pt.SetAnotacao("");
        }
      else
        {
        lua_pushinteger( L, 3 );
        }
      }
    else
      { // não tem anotação
      lua_pushinteger( L, 1 );
      }
    }
  else
    lua_pushinteger( L, 2 );

  return 1;
}

// envio de comando
// argumentos: número de ponto de comando, valor
// retorna: 0 se ok, 1 se, 3 se ponto não encontrado, 4 se bloqueado, nil se erro na quantidade de argumentos
static hmi_sendcmd( lua_State *L )
{
  int n = lua_gettop( L );

  if ( n != 2 )
    {
    lua_pushnil( L );
    return 1;
    }

  int nponto = lua_tointeger( L, 1 );
  int valor = lua_tointeger( L, 2 );

  bool found;
  TPonto &pt = BL.GetRefPonto( nponto, found );

  if ( found )
    {
       // se o ponto de supervisão estiver com comando bloqueado, não faz o comando
       bool foundsup;
       TPonto &ptsup = BL.GetRefPonto( pt.PontoSupCmd, foundsup );
       if ( foundsup )
       if ( ptsup.ComandoBloqueado() )
         {
         lua_pushinteger( L, 4 );
         return 1;
         }

       // trata caso de simulação  
       if ( ( BL.GetSimulacao() == SIMULMOD_MESTRE ) || ( BL.GetSimulacao() == SIMULMOD_LOCAL ) )
         {
         int ret=fmSimul->SimulaComando( nponto, valor );
         lua_pushinteger( L, ret );
         return 1;
         }
       else
         {
         if ( IP_BDTR1 == "" ) // se não tem bdtr, manda pelo 104
           {
           int ret = fmIEC104M->ComandoIEC( nponto, valor&0x01?0:1 );
           lua_pushinteger( L, ret );
           return 1;
           }
         else
           {
           int ret = fmBDTR->bdtr.MandaComando( nponto, valor, T_DIG );
           lua_pushinteger( L, ret );
           return 1;
           }
         }
    }

lua_pushinteger( L, 0 );
return 3;
}

// ativa o beep de alarme sonoro
static int hmi_activatebeep( lua_State *L )
{
  BL.AtivaBeep();
  return 0;
}

static int hmi_isprimary( lua_State *L )
{
  lua_pushboolean( L, fmBDTR->bdtr.EhPrincipal() );
  return 1;
}

// bloqueia o comando do ponto através de anotação
// retorna : 0 se ok, 1 se não achou o ponto
// argumentos: nponto, valor, falha
static int hmi_writepoint( lua_State *L )
{
  int n = lua_gettop( L );

  if ( n != 3 )
    {
    lua_pushnil( L );
    return 1;
    }

  int nponto = lua_tointeger( L, 1 );
  float valor = lua_tonumber( L, 2 );
  int falha = lua_tointeger( L, 3 );

  bool found;
  TPonto &pt = BL.GetRefPonto( nponto, found );

  if ( found )
    {
    TFA_Qual qual;
    qual.Byte = 0;
    qual.Falha = falha;
    if ( !BL.HaSimulacao() )
      qual.Subst = 1;
    if ( pt.TipoAD == 'A' )
      {
      qual.Tipo = 1;
      }
    else
      {
      qual.Duplo = (int)valor;
      valor = ((int)valor) & 0x01;
      }

    BL.EscrevePonto( nponto, valor, qual.Byte, 1, 0, 0 );
    lua_pushinteger( L, 0 );
    }
  else
    lua_pushinteger( L, 1 );

  return 1;
}

//---------------------------------------------------------------------------
__fastcall TfmLua::TfmLua(TComponent* Owner)
        : TForm(Owner)
{
 char errbuf[2000];
 L = lua_open();
 luaL_openlibs( L );

 lua_register( L, "hmi_print", hmi_print );
 lua_register( L, "hmi_settimer", hmi_settimer );
 lua_register( L, "hmi_isprimary", hmi_isprimary );
 lua_register( L, "hmi_activatebeep", hmi_activatebeep );
 lua_register( L, "hmi_getpoint", hmi_getpoint );
 lua_register( L, "hmi_writepoint", hmi_writepoint );
 lua_register( L, "hmi_unblkpoint", hmi_unblkpoint );
 lua_register( L, "hmi_blkpoint", hmi_blkpoint );
 lua_register( L, "hmi_sendcmd", hmi_sendcmd );

 if ( FileExists( LUASCRIPTFILE ) )
   {
   if ( luaL_dofile( L, LUASCRIPTFILE ) != 0 )
     {
     sprintf( errbuf, "%s", lua_tostring( L, -1 ) );
     mmErr->Lines->Add( errbuf );
     }
   ScriptCycle = "ScriptCycle()";
   }

 Timer1->Enabled = true;
}

//---------------------------------------------------------------------------
void __fastcall TfmLua::btExecClick(TObject *Sender)
{
  char errbuf[2000];
  int error;
  String str;

  int tini = ::GetTickCount();

  for ( int i = 0; i < mmSrc->Lines->Count; i++ )
    str = str + mmSrc->Lines->Strings[i] + "\n";

  error = luaL_dostring( L, str.c_str() );
  if ( error )
  {
    sprintf( errbuf, "%s", lua_tostring(L, -1) );
    mmErr->Lines->Add( errbuf );
    lua_pop( L, 1 );  // pop error message from the stack
  }

  Label1->Caption = ::GetTickCount() - tini;
}

//---------------------------------------------------------------------------
void __fastcall TfmLua::Timer1Timer(TObject *Sender)
{
if ( ScriptCycle != "" )
  {
  char errbuf[2000];
  int error;
  int tini = ::GetTickCount();

  error = luaL_dostring( L, ScriptCycle.c_str() );
  if ( error )
    {
    sprintf( errbuf, "%s", lua_tostring( L, -1 ) );
    mmErr->Lines->Add( errbuf );
    lua_pop( L, 1 );  // pop error message from the stack
    }

  Label2->Caption = ::GetTickCount() - tini;
  }
}
//---------------------------------------------------------------------------
void __fastcall TfmLua::FormDestroy(TObject *Sender)
{
  lua_close( L );
}
//---------------------------------------------------------------------------

void __fastcall TfmLua::mmErrDblClick(TObject *Sender)
{
  mmErr->Clear();
}
//---------------------------------------------------------------------------

void __fastcall TfmLua::mmSrcDblClick(TObject *Sender)
{
  // mmSrc->Clear();
}
//---------------------------------------------------------------------------

