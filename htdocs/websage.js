"use strict";
// 
// ----------------------------------------------------------------------------------------
// This script looks for tagged objects inside a SVG file and animate them.
// Real time values are obtainded by requesting and evaluating javascript code from a special webserver.
// 
// Este script procura por objetos (com id como PNTnponto) 
// ou tags especifícos de animação linkados a pontos da base num arquivo SVG embutido no html
// passa a lista de pontos para o script pntserver.rjs que devolve um 
// trecho de código em javascript que atualiza os valores e flags dos pontos solicitados.
// Este código é apendado dinamicamente à página e executado.
// Com os valores obtidos dos pontos são atualizados os objetos (DJ, SC e medidas) no SVG.
// DEPENDENCIAS : util.js, jquery.js, jquery.ui, core.js, shortcut.js, messages.js, config_viewers.js  (todas devem estar incluidas antes deste script)  

// OSHMI/Open Substation HMI - Copyright 2008-2014 - Ricardo L. Olsen

/*jslint browser: true, bitwise: true, devel: true */
/*jslint white: true */
/*jslint sloppy: true */
/*jslint plusplus: true */
/*jslint eqeq: true */
/*jslint continue: true */
/*global opener: false, self: false */
/*global $: false, Core: false, Titles: false, Imgs: false, Msg: false, LoadFavicon: false, shortcut: false */
/*global L: true, V: true, F: true, T: true, TAGS: true, SUBS:true, BAYS:true, DCRS: true, BAYS: true, STONS: true, STOFS: true, Data: true, NUM_VAR: true, NUM_VAR_ANT: true, HA_ALARMES: true, HA_ALARMES_ANT: true  */
/*global Sha1Ana: true, Sha1Dig: true, T: true, Data: true, SVGDoc: true, SVGSnap: true, NPTO: true, ID: true, ESTACAO: true  */
/*global DESC: true, ST_ON: true, ST_OFF: true, CNPTO: true, CID: true, CDESC: true, CST_ON: true, CST_OFF: true  */
/*global LIMSUPS: true, LIMINFS: true, LIMS: true, LIMI: true, HISTER: true, ALRIN: true, ANOT: true, VLNOR: true, ESTALM: true, UNIDADE: true  */
/*global SIMULACAO: true, ComandoAck: true, ANIMA: true, CLICK_POSX: true, CLICK_POSY: true, WebSAGE: true  */
/*global optgroup: true, optval: true, opttxt: true, indtela:true, tela: true, PNTServer: true, TimePNTServer: true, ScreenViewer_RefreshTime: true  */
/*global ScreenViewer_Background: true, ScreenViewer_ToolbarColor: true, ScreenViewer_RelationColor: true  */
/*global ScreenViewer_TagFillColor: true, ScreenViewer_TagStrokeColor: true, ScreenViewer_TagInhAlmFillColor: true, ScreenViewer_TagInhAlmStrokeColor: true  */
/*global ScreenViewer_DateColor: true, ScreenViewer_TimeMachineDateColor: true, ScreenViewer_TimeMachineBgColor: true, ScreenViewer_AlmBoxTableColor: true  */
/*global ScreenViewer_AlmBoxGridColor: true, ScreenViewer_BarBreakerSwColor: true, ScreenViewer_ShowScreenNameTB: true  */


// Variáveis providas pelo webserver | Server provide values
var L = [];  // lista de eventos | Event list
var V = []; // valores dos pontos | Point values
var F = []; // flags dos pontos | Point quality flags
var T = []; // tags de tempo de alarme dos pontos | Alarm time tags 
var TAGS = []; // tags (ids) dos pontos | point tag names
var SUBS = []; // módulo do pontos | bay of point
var BAYS = []; // módulo do pontos | bay of point
var DCRS = []; // descrição dos pontos | point description
var STONS = []; // textos de estado on | on status texts
var STOFS = []; // textos de estado off | off status texts
var Data = ''; // hora da atualização | Time of the last real time data obtained from the server 
var NUM_VAR = 0; // número de variações digitais | Number of digital values changed
var HA_ALARMES = 0; // informa que há alarme sonoro ativo | Indicates the presence of beep alarm
var Sha1Ana = ''; // hash dos valores analogicos (para detectar mudanças) | Hash of analog values for change detection
var Sha1Dig = ''; // hash dos valores digitais (para detectar mudanças) | Hash of digital values for change detection
var LIMSUPS = []; // Analog superior limits for points
var LIMINFS = []; // Analog inferior limits for points

var HA_ALARMES_ANT = 0; // estado anterior da variável HA_ALARMES | last state of HA_ALARMES variable
var NUM_VAR_ANT = 0; // estado anterior da variável NUM_VAR | last state of NUM_VAR variable

var SVGDoc = null; // documento SVG (DOM) | SVG Document
var SVGSnap = null; // SVG Snap surface object

// variáveis para os diálogos de info/comando | variables to communicate with point access/command diaglogs
var NPTO = 0, ID, ESTACAO, MODULO, DESC, ST_ON, ST_OFF, CNPTO, CID, CDESC, CST_ON, CST_OFF;
var LIMS, LIMI, HISTER, ALRIN, ANOT, VLNOR, ESTALM, UNIDADE, SIMULACAO = 0;
var ComandoAck = ''; // texto para confirmação do comando 
var ANIMA = 0x01; // controla nível de animações (máscara de: 0x00=sem animação, 0x01=seleção, 0x02=etiqueta).

var CLICK_POSX = 0;
var CLICK_POSY = 0;

var ComandoEnviado = "";

// Process the list of screens
function lista_telas()
{
var i, t, elOptNew, elSel, titu, pos, nohs, textolink, tmp, idtela;

    if ( optionhtml !== "" )
      {
       $('#SELTELA').html( optionhtml );
      }
    else
    for ( i = 0 ; i < optval.length; i++ )
    {
       elSel = document.getElementById('SELTELA');

          elOptNew = document.createElement('option');
          elOptNew.text = opttxt[i];
          elOptNew.value =  optval[i];
        
          if ( typeof( optgroup[i] ) === "string" )
            elOptNew.optg =  optgroup[i];
          
          if ( typeof( optfilt[i] ) === "string"  )
            {
            elOptNew.filtroalmbox = optfilt[i];
            }
          else
            {
            elOptNew.filtroalmbox = "";
            }  
        
          try
          {
              elSel.add(elOptNew, null); // standards compliant; doesn't work in IE
          }
          catch(ex)
          {
              elSel.add(elOptNew); // IE only
          }
    }
     
    for ( i = 0; i < WebSAGE.g_seltela.length; i++ )
    {
        if ( indtela > 0 && indtela == i ) // quando o parâmetro da URL INDTELA for um número, abre a tela correspondente
        {
            WebSAGE.g_seltela.selectedIndex = i;
            document.fmTELA.submit();
            return;
        }
    
        if ( WebSAGE.g_seltela.options[i].value == tela )  // tela: variável do screen.html
        { 
            if ( typeof( WebSAGE.g_seltela.options[i].filtroalmbox ) != "undefined" )
            if ( WebSAGE.g_seltela.options[i].filtroalmbox != "" )
            if ( document.getElementById("almiframe").src == "" )          
              {
              document.getElementById("almiframe").src = "almbox.html?SUBST=" + WebSAGE.g_seltela.options[i].filtroalmbox;
              document.getElementById('almiframe').style.display = '';
              }

            // seleciona tela aberta no combo box
            WebSAGE.g_seltela.selectedIndex = i;
            // coloca o nome da tela na barra de título
            titu = WebSAGE.g_seltela.options[i].text;
            pos = titu.indexOf("[");
            if ( pos <= 0 ) 
              { pos = 100; }
            titu = titu.substring( 0, pos );
            pos = titu.indexOf("{");
            if ( pos <= 0 ) 
              { pos = 100; }
            titu = titu.substring( 0, pos );
            titu = titu.replace( new RegExp("[\\s.]+$", "g"), "" );
            WebSAGE.g_titulo_janela = titu + " - " + Msg.NomeVisorTelas + " - " + Msg.NomeProduto + " - " + Msg.VersaoProduto;
            document.title = "."; // necessário devido a um bug do chromium!
            document.title = WebSAGE.g_titulo_janela;
            // coloca o nome da tela na toolbar, se configurado
            if ( ScreenViewer_ShowScreenNameTB )
              {
              $("#NOME_TELA").text( titu + " " );
              $('#NOME_TELA').css('display', '');
              } 
        }
    }
 
    // prepara os links para as telas
    try
    {   
        // Links para telas
        if ( SVGDoc != null )
        {  
          nohs = SVGDoc.getElementsByTagName("a");
          for ( i = 0; i < nohs.length; i++ )
          {
              textolink = nohs.item(i).getAttributeNS("http://www.w3.org/1999/xlink" , "href");

              // mata o link original
              nohs.item(i).removeAttributeNS("http://www.w3.org/1999/xlink", "href");
              nohs.item(i).removeAttributeNS("http://www.w3.org/1999/xlink", "type");
              nohs.item(i).removeAttributeNS("http://www.w3.org/1999/xlink", "actuate");
              nohs.item(i).removeAttributeNS("http://www.w3.org/1999/xlink", "show");
              nohs.item(i).removeAttributeNS("http://www.w3.org/1999/xlink", "href");

              for ( t = 0; t < WebSAGE.g_seltela.length; t++ )
                {
                  if ( WebSAGE.g_seltela.options[t].value == ( "../svg/" + textolink ) )
                  {
                      nohs.item(i).setAttributeNS( null, "onclick", "top.WebSAGE.g_seltela.selectedIndex=" + t + "; top.document.fmTELA.submit();" );
                      if ( nohs.item(i).style != null )
                        {
                          nohs.item(i).style.cursor = "pointer";
                        }
                  }
                }
          }

          // acerta o estado dos botões de próxima tela e tela anterior
          if ( WebSAGE.g_seltela.selectedIndex <= 1 )
          { // é a primeira tela
              document.getElementById("ANTETELAID").style.opacity = 0.2;
              document.getElementById("ANTETELAID").style.cursor = '';
          }
          else
          {
              Core.addEventListener( document.getElementById("ANTETELAID"),  "click", WebSAGE.anteTela ) ;
          } 

          if ( WebSAGE.g_seltela.selectedIndex >= WebSAGE.g_seltela.length - 1 )
          { // é a última tela
              document.getElementById("PROXTELAID").style.opacity = 0.2;
              document.getElementById("PROXTELAID").style.cursor = '';
          }
          else
          { 
              Core.addEventListener(document.getElementById("PROXTELAID"),  "click", WebSAGE.proxTela ); 
          }

          // onde houver um texto ou grupo com id igual a nome de tela, linkar
          nohs = [];
          tmp = SVGDoc.getElementsByTagName("text");
          for ( i = 0; i < tmp.length; i++ ) 
            { 
            nohs.push( tmp.item(i) ); 
            }
          tmp = SVGDoc.getElementsByTagName("g");
          for ( i = 0; i < tmp.length; i++ ) 
            { 
            nohs.push( tmp.item(i) ); 
            }

          for ( i = 0; i < nohs.length; i++ )
          {
            if ( nohs[i].id != undefined )
              {
              idtela = nohs[i].id;
              // faz um trimleft dos caracteres espaço e '+' para permitir multiplos link para uma mesma tela
              idtela = idtela.replace(/^[ \+]+/, "");
              if ( idtela.substr(0,3)=='PNT' || idtela.substr(0,3)=='NPT' || idtela=='' ) // estou procurando nome de tela e não numero de ponto
                 { 
                 continue; 
                 }

              for ( t = 0; t < WebSAGE.g_seltela.length; t++ )
                {
                  if ( WebSAGE.g_seltela.options[t].value == idtela ||
                       WebSAGE.g_seltela.options[t].value == ( "../svg/" + idtela ) ||
                       WebSAGE.g_seltela.options[t].value == ( "../svg/" + idtela + ".svg" ) )
                  {
                      nohs[i].setAttributeNS( null, "onclick", "top.WebSAGE.g_seltela.selectedIndex=" + t + "; top.document.fmTELA.submit();" );
                      if ( nohs[i].style.style != null )
                        {
                          nohs[i].style.cursor = "pointer";
                        }
                  }
                } 
              }
          }
        }
    }
    catch ( err )
    {
      $('#SP_STATUS').text( err.name + ": " + err.message + " [1]" ); 
      document.getElementById("SP_STATUS").title = err.stack;
    }
}

// carrega uma imagem no elemento
function LoadImage( elem, imgpath )
{
  elem.setAttributeNS("http://www.w3.org/1999/xlink", "href", imgpath );   
}

// Remove todas as animações
function RemoveAnimate( elem )
{
  var i;
  if ( elem === null )
    { 
      return; 
    }
  i = 0;  
  while ( i < elem.childNodes.length )
    {
    if ( elem.childNodes[i].nodeName == "animate" || elem.childNodes.nodeName == "animateTransform" || elem.childNodes.nodeName == "animateMotion" )  
      {
      elem.removeChild( elem.childNodes[i] );
      i = 0;
      }      
    else
      {
        i++;
      }
    }    
}

// Permite criar uma animação em SVG
// top.Animate( thisobj, "animate", {'attributeName': 'ry', 'from': 0, 'to': 10, 'fill': 'freeze', 'repeatCount': 5, 'dur': 5 } );
// top.Animate( thisobj, 'animate', {'attributeName': 'width', 'from': 45, 'to': 55, 'repeatCount':5,'dur': 1 });
function Animate( elem, animtype, params )
{
  var k, animation;
  animation = document.createElementNS( 'http://www.w3.org/2000/svg', animtype );
  
  for ( k in params )
    {
    if( params.hasOwnProperty( k ) )
      { 
        animation.setAttributeNS( null, k, params[k] ); 
      }
    }

  elem.appendChild( animation );
  if ( typeof( animation.beginElement ) != "undefined" )
    {
    animation.endElement();
    animation.beginElement();
    }
}

function ShowHideTranslate( id, xd, yd )
{
var obj, embed, svgdoc;  

embed = document.getElementById('svgid');
svgdoc = embed.getSVGDocument();
if ( svgdoc === null )
   { 
     return; 
   }

obj = svgdoc.getElementById( id ); 
if ( obj === null )
   { 
     return; 
   }
 
if ( obj.style.display === 'none' ) 
  { 
    obj.style.display = 'block'; 
  }
else 
  { 
    obj.style.display = 'none'; 
  }

if ( typeof( obj.inittransform ) === 'undefined' )
  { 
    obj.inittransform = obj.getAttributeNS( null, 'transform' );  
  }
  
if ( obj.inittransform === null )  
  { 
    obj.inittransform = ""; 
  }
  
obj.setAttributeNS( null, 'transform', obj.inittransform + ' translate(' + parseFloat(xd) + ',' + parseFloat(yd) + ')' );  
}

function histdata( i ) 
{ 
  var idc, dt;
  dt = new Date();
  
  if ( typeof(i) === "undefined" )
    {
    return;
    }
                
  WebSAGE.InkSage[i].valores.length = 0;              
  WebSAGE.InkSage[i].datas.length = 0;              
  for ( idc in hvalues ) 
    { 
    if ( hvalues.hasOwnProperty( idc ) ) 
      { 
         WebSAGE.InkSage[i].valores.push( hvalues[idc].valor );
         WebSAGE.InkSage[i].datas.push( hvalues[idc].unxtime );
      } 
    }
}

var WebSAGE =
{
g_remoteServer : PNTServer,
g_timePntServer : TimePNTServer,
g_isInkscape : false,
g_DirTelas : "./", 
g_nponto_sup : 0,
g_win_cmd : {},
g_win_1stdraw : 0,
g_wait_win : 0,
g_timerID : 0, 
g_timeoutFalhaID : 0,
g_timeoutSlideID : 0,
g_data_ant : "",
g_timeOutRefresh : 1000 * ScreenViewer_RefreshTime, // tempo de refresh dos dados
g_timeOutFalha : 30000, // tempo para falha dos dados, caso servidor não responda
g_toutID : 0,
g_toutStatusID : 0,
g_blinktimerID : 0,
g_blinkperiod : 1000,
g_blinkcnt : 0, 
g_blinkList: [], // lista objetos piscantes digitais
g_blinkListAna: [], // lista objetos piscantes analógicos
g_blinkListOld: [], // lista objetos piscantes digitais (anterior)
g_blinkListAnaOld: [], // lista objetos piscantes analógicos (anterior)
C : [], // para as cores das medidas
T : [], // formato numérico das medidas
Pass : 0, // conta as chamadas de CallServer
g_showValsInterval : 0,
RectFundo : 0, // retângulo do fundo do SVG
g_seltela : 0,
g_inicio : 1,
g_MostraQualAna : 0,
g_Evento : {}, // evento 
g_travaInfo : 0,
g_tminfoID : 0,
g_cntTentativaInfo : 0,
// g_ws : {},
g_sha1ant_ana : "",
g_sha1ant_dig : "",
g_hidetoolbar: 0,
g_timeOutPreview: 1500, // tempo para mostrar preview de tela linkada
g_timerPreviewID: 0,  // timer para mostrar preview de tela linkada
g_hasRadar: false, // register the presence of a radar chart

// tamanhos para zoom/pan
g_zpX: 0, 
g_zpY: 0,
g_zpW: 0,
g_zpH: 0,

g_obj_onclick: "{ /*CLICK_POSX=evt.clientX;CLICK_POSY=evt.clientY;*/ if( evt.ctrlKey || evt.which == 2 ) { top.WebSAGE.reconhece(PONTO); } else { top.WebSAGE.janelaInfo(PONTO); } }",

g_titulo_janela: "",

// Vent: [],

g_indSelPonto: -1,  // indice do objeto selecionado pelo teclado 
g_destaqList: [], // lista de pontos que possuem objetos associados que podem ser selecionados pelo teclado
g_loadtime: 0,
g_timeshift: 0, // control calls for historic data plot

cntclkfundo: 0,  // controla os cliques para alterar a cor de fundo

// Passa ao servidor uma lista de pontos cujos valores devem ser retornados
// o retorno vem na variável global V que é um objeto que tem propriedades PNTnumero com o valor do ponto
// Ex: V['PNT8056'] ou V.PNT8056
// A lista de pontos é obtida dos DIV com ID=PNTnumero neste documento, ex: ID=PNT8056
// var par='';
lstpnt : '',

RTDA_MedsItems: [],
RTDA_MedsNptos: [],
RTDA_MedsFmt: [],
RTDA_MedsFillOk: [],
RTDA_MedsFillInv: [],

RTDA_TxtStItems: [],
RTDA_TxtStNptos: [],
RTDA_TxtStOff: [],
RTDA_TxtStOn: [],
RTDA_TxtStInv: [],
RTDA_TxtStFillEstOn: [],
RTDA_TxtStFillEstOff: [],
RTDA_TxtStFillInv: [],
RTDA_TxtStTipos: [], // PNT ou NPT=estado do ponto, ALM=estado de alarme, TMP=tempo do ultimo alarme

RTDA_ShpItems: [],
RTDA_ShpNptos: [],
RTDA_ShpFillEstOn: [],
RTDA_ShpFillEstOff: [],
RTDA_ShpFillInv: [],
RTDA_ShpStrokeEstOn: [],
RTDA_ShpStrokeEstOff: [],
RTDA_ShpStrokeInv: [],
RTDA_ShpVisEstOn: [],
RTDA_ShpVisEstOff: [],
RTDA_ShpTipos: [], // PNT ou NPT=estado do ponto, ALM=estado de alarme, TMP=tempo do ultimo alarme

RTDA_JSItems: [],
RTDA_JSCode: [],
RTDA_JSEvent: [],

InkSage: [],

// busca e executa script de um servidor
getScript: function ( srvurl )
{
// substitui a chamada $.getScript que causava memory leaks
$.ajax( { // crossDomain: true,
          url: srvurl,
          dataType: "text",
          success: WebSAGE.onSuccess
         } );
},

onSuccess: function ( data )
{
  eval( data );
  data = null;
},

// cria atalhos para as telas com base na letra entre { } no texto da tela
atalhosTela : function ()
{
var i, pos;  

for ( i = 0; i < WebSAGE.g_seltela.length; i++ )
  {
  pos = WebSAGE.g_seltela.options[i].text.indexOf("{");
  if ( pos != -1 )  
    {
    shortcut.add( "",
                  function( e ) 
                  { 
                      // procura a tela com o keycode do evento e abre
                      for ( var i = 0; i < WebSAGE.g_seltela.length; i++ ) 
                        {
                        var pos = WebSAGE.g_seltela.options[i].text.indexOf("{");
                        if ( pos != -1 && WebSAGE.g_seltela.options[i].text.charCodeAt(pos+1) == e.keyCode )  
                          {
                           WebSAGE.g_seltela.selectedIndex = i; 
                           document.fmTELA.submit();   
                          }
                        }
                  },
                  {'type':'keydown', 'propagate':false,	'target':document, 'keycode':WebSAGE.g_seltela.options[i].text.charCodeAt(pos+1)} );
    }
  }  
},   

// função auxiliar para escrever dados na janela de comando pelo id do objeto
cmdWriteById : function( win, id, txt )
{    
  win.$( '#' + id ).text( txt );
},

// add point to the list of points to be requested from the server, removing special codes like !ALM !TMP
acrescentaPontoLista : function( tag )
{
tag = tag.trim();

if ( tag.indexOf('ALM') === 0 || 
     tag.indexOf('TMP') === 0 )
  { 
    tag = tag.substr( 3 );  
  }
else  
if ( tag.indexOf('!ALM') === 0 || 
     tag.indexOf('!TMP') === 0 || 
     tag.indexOf('!ALR') === 0 ||
     tag.indexOf('!ALR') === 0 ||
     tag.indexOf('!TAG') === 0 ||
     tag.indexOf('!DCR') === 0 )
  { 
    tag = tag.substr( 4 );  
  }
else
if ( tag.indexOf('!SLIM') === 0 ||
     tag.indexOf('!ILIM') === 0 ||
     tag.indexOf('!STON') === 0 )  
  { 
    tag = tag.substr( 5 );  
  }
else
if ( tag.indexOf('!STOFF') === 0 ||
     tag.indexOf('!STVAL') === 0 )   
  { 
    tag = tag.substr( 6 );  
  }
  
if ( isInt( tag ) )
if ( WebSAGE.lstpnt.indexOf( "," + tag + "," ) < 0 ) // se não tem, acrescenta | append if not already in the list
  { 
    WebSAGE.lstpnt = WebSAGE.lstpnt + tag + ','; 
  }

return tag;
},

// busca dados do servidor e prepara chamada temporizada de showValsCmd para   
janelaInfo : function( nponto ) 
{
  // faz um bloqueio de 1,5s
  if ( WebSAGE.g_travaInfo )
    { 
      return; 
    }
  WebSAGE.g_travaInfo = 1;
  setTimeout( "WebSAGE.g_travaInfo=0", 1500 );
  
  if ( nponto != 0 )
    {
    WebSAGE.g_nponto_sup = nponto;
    WebSAGE.g_cntTentativaInfo = 3;
    }
  else
    {
    WebSAGE.g_cntTentativaInfo--;
    }
  
  if ( WebSAGE.g_cntTentativaInfo <= 0 )
    { 
      return; 
    }

  LIMS = 0;
  LIMI = 0;
  HISTER = 0;
  ALRIN = 0;
  ANOT = "";
  
  if ( NPTO != 0 )
    { 
      WebSAGE.escondeDestaqPonto(NPTO); 
    }
  
  NPTO = 0;
  CNPTO = 0;
  ID = "";
  DESC = "";
  
  // reconhece alarmes que houverem neste ponto
  if ( F[WebSAGE.g_nponto_sup] & 0x100 )
    {
    WebSAGE.getScript( WebSAGE.g_remoteServer +
                       '?R=' + WebSAGE.g_nponto_sup + '&D=00/00/0000&H=00:00:00&M=000&A=0&' +
                       'PS=' + WebSAGE.g_pass++ 
                     );  
    }
  
  if ( BrowserDetect.browser != 'Explorer' )
    if ( typeof(WebSAGE.g_win_cmd.window) == 'object' ) // fecha janela info
      if ( WebSAGE.g_win_cmd.window ) 
        { 
          WebSAGE.g_win_cmd.window.close();
        }
  
  setTimeout( WebSAGE.showValsInfo0, 200 );
},

// busca dado do ponto tempo real  
showValsInfo0 : function()
{
  WebSAGE.getScript( WebSAGE.g_remoteServer + '?I=' + WebSAGE.g_nponto_sup + '&B=WebSAGE.showValsInfo1' );
},

// Abre uma janela popup com dados sobre o ponto   
showValsInfo1 : function()
{
  // esconde o destaque anterior, imediatamente
  WebSAGE.escondeDestaqPonto( WebSAGE.g_destaqList[WebSAGE.g_indSelPonto] );
 
  // abre nova janela, dá um tempo e vai  preencher os dados da nova janela em outra funcao
  // (para dar tempo de abrir a janela) 
  WebSAGE.g_win_1stdraw = 1;
  WebSAGE.g_win_cmd = window.open( 'dlginfo.html','wsinfo','dependent=yes,height=480,width=450,toolbar=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=no,modal=yes' );
  WebSAGE.g_tminfoID = setTimeout( 'WebSAGE.g_win_cmd.close()', 3000 );
/*
  // tentei bolar um código para mover a janela de acesso ao ponto para não ficar por cima do objeto clicou, mas dá pau com multimonitor
  if (CLICK_POSX>600)
    CLICK_POSX=50;
  else   
    CLICK_POSX=600;
  if (CLICK_POSY>500)
    CLICK_POSY=50; 
  else  
    CLICK_POSY=500; 
  WebSAGE.g_win_cmd.moveTo(CLICK_POSX,CLICK_POSY);
*/
 
  WebSAGE.g_wait_win = 0;  // contador para esperar abrir a janela
  
  // showValsInfo2 será chamado pela própria nova janela aberta em onload
}, 

// Mostra os dados sobre o ponto em janela popup 
showValsInfo2 : function( mot )
{
try
  {
  // testa se a janela está carregada
  if ( NPTO == 0 ||
       typeof( WebSAGE.g_win_cmd.document ) === "unknown" ||
       WebSAGE.g_win_cmd.document === null ||
       WebSAGE.g_win_cmd.document === undefined ||          
       !WebSAGE.g_win_cmd ||
       typeof(WebSAGE.g_win_cmd.window) != 'object' ||
       WebSAGE.g_win_cmd.window === null ||
       typeof(WebSAGE.g_win_cmd.window.closed) == 'undefined' ||
       WebSAGE.g_win_cmd.window.closed || 
       typeof(WebSAGE.g_win_cmd.window.$) === 'undefined' 
     ) 
     {
     if ( mot == 0 )
       {
       if ( WebSAGE.g_wait_win < 4 ) // não carregou, vai retentando mais um tempo
         { 
           WebSAGE.g_wait_win++;
           WebSAGE.g_timerID = setTimeout( 'WebSAGE.showValsInfo2(0)', 300 );
         }
       else  // tenta reabrir com o mesmo ponto
         { 
           WebSAGE.g_timerID = setTimeout( 'WebSAGE.janelaInfo(0)', 100 ); 
         }
       }
         
     return; // se esgotou o tempo, desiste
     }

  // janela carregada 
  var se = ESTACAO;
  se = se + '-';  

  WebSAGE.cmdWriteById( WebSAGE.g_win_cmd, 'VALOR_SUP', V[NPTO] + " " + UNIDADE + " (" + Msg.QValor + ")" );

  var SQ = '';
  var Q = F[NPTO];

  if ( (Q & 0x03) == 0x00 )
    { 
      WebSAGE.cmdWriteById( WebSAGE.g_win_cmd, 'ESTADO_SUP', Msg.QDPIntermed + " (" + Msg.EstadoAtual + ")"  ); 
    }
  else    
  if ( (Q & 0x03) == 0x03 )
    { 
      WebSAGE.cmdWriteById( WebSAGE.g_win_cmd, 'ESTADO_SUP', Msg.QDPInvalido + " (" + Msg.EstadoAtual + ")" ); 
    }
  else 
  if ( V[NPTO]&0x01 != 0 )
    { 
      WebSAGE.cmdWriteById( WebSAGE.g_win_cmd, 'ESTADO_SUP', ST_OFF + " (" + Msg.EstadoAtual + ")" ); 
    } // não zero é off 
  else  
    { 
      WebSAGE.cmdWriteById( WebSAGE.g_win_cmd, 'ESTADO_SUP', ST_ON + " (" + Msg.EstadoAtual + ")" ); 
    } // zero é on
    
  if ( Q & 0x80 )
     {
       SQ += Msg.QFalhado + ' ';
     }
  if ( Q & 0x10 )
    {
      SQ += Msg.QSubst + ' ';
    }

  if ( (Q & 0x0C) == 0x04 )
    {
      SQ += Msg.QCalculado + ' ';
    }
  else  
  if ( (Q & 0x0C) == 0x0C )
    {
      SQ += Msg.QManual + ' ';
    }
  else  
  if ( (Q & 0x0C) == 0x08 )
    {
      SQ += Msg.QNuncaAtu + ' ';
    }

  if ( Q & 0x100 )
    {
      SQ += Msg.QAlarmado + ' ';
    }
    
  //if ( Q&0x200 )
  //  SQ += Msg.QAnotacao+' ';

  if ( Q & 0x400 )
    {
      SQ += Msg.QAlmInib + ' ';
    }

  if ( Q & 0x800 )
    {
      SQ += Msg.QNaoNormal + ' ';
    }

  if ( Q & 0x1000 )
    {
      SQ += Msg.QCongelado + ' ';
    }

  if ( SQ == "" )
    {
      SQ = Msg.QNormal + ' ';
    }
  
  WebSAGE.cmdWriteById( WebSAGE.g_win_cmd, 'QUALIF', Msg.Qualific + ': ' + SQ );
            
  if ( WebSAGE.g_win_1stdraw ) // escreve parâmetros só na primeira vez que abriu a janela
    {
    clearTimeout( WebSAGE.g_tminfoID );
    WebSAGE.g_win_1stdraw = 0;
    WebSAGE.cmdWriteById( WebSAGE.g_win_cmd, 'NPONTO_SUP', NPTO + ':' + ID );
    WebSAGE.cmdWriteById( WebSAGE.g_win_cmd, 'DESCR_SUP', se + DESC );
    WebSAGE.cmdWriteById( WebSAGE.g_win_cmd, 'SPCMDINTERTRAV', Titles.SPCMDINTERTRAV );      
    WebSAGE.g_win_cmd.document.getElementById("TABULAR").style.display = "";
    //WebSAGE.g_win_cmd.document.getElementById("TABULAR").href="tabular.html?SELMODULO="+ID.substring(0,9);
    Core.addEventListener( WebSAGE.g_win_cmd.document.getElementById("TABULAR"), "click", WebSAGE.tabular );
    
    if ( ID.charAt(21) == 'M' ) // Manual não apresenta opção de inibir
      { 
        WebSAGE.g_win_cmd.document.getElementById('DIVINIB').style.display = 'none'; 
      }
    
    if ( Q & 0x20 )
      { // mostra parâmetros de limites só para pontos analógicos
      WebSAGE.g_win_cmd.document.getElementById("TENDENCIAS").style.display = "";
      Core.addEventListener( WebSAGE.g_win_cmd.document.getElementById("TENDENCIAS"), "click", WebSAGE.tendencias );

      WebSAGE.g_win_cmd.document.getElementById("CURVAS").style.display = "";
      Core.addEventListener( WebSAGE.g_win_cmd.document.getElementById("CURVAS"), "click", WebSAGE.curvas );

      WebSAGE.g_win_cmd.document.getElementById("VALOR_HID").style.display = "";
      WebSAGE.g_win_cmd.document.getElementById("LIMCTRLS").style.display = "";
      WebSAGE.g_win_cmd.document.getElementById("LIMSUP").value = LIMS;    
      WebSAGE.g_win_cmd.document.getElementById("LIMINF").value = LIMI;    
      WebSAGE.g_win_cmd.document.getElementById("HISTER").value = HISTER;
      Core.addEventListener( WebSAGE.g_win_cmd.document.getElementById("LIMSUP"), "blur", WebSAGE.writeParams );
      Core.addEventListener( WebSAGE.g_win_cmd.document.getElementById("LIMINF"), "blur", WebSAGE.writeParams );
      Core.addEventListener( WebSAGE.g_win_cmd.document.getElementById("HISTER"), "blur", WebSAGE.writeParams );
      if ( ID.charAt(21)=='M' || SIMULACAO==1 || SIMULACAO==2 ) // permite alterar valor de ponto manual
        {
        WebSAGE.g_win_cmd.document.getElementById("DIVALTVALOR").style.display = "";
        Core.addEventListener
          ( WebSAGE.g_win_cmd.document.getElementById("CBALTVALOR"), 
            "click", 
            function() { WebSAGE.g_win_cmd.document.getElementById('CBALTVALOR').style.display = 'none';
                         WebSAGE.g_win_cmd.document.getElementById('NOVOVALOR').style.display = ''; 
                       } 
          );
        Core.addEventListener( WebSAGE.g_win_cmd.document.getElementById("NOVOVALOR"), "blur", WebSAGE.writeValor );
        }
      }    
    WebSAGE.g_win_cmd.document.getElementById("ANOTACAO").value = ANOT.replace(/\|\^/g,"\n");
    WebSAGE.g_win_cmd.document.getElementById("CBALRIN").checked = (ALRIN!='0');    
    Core.addEventListener( WebSAGE.g_win_cmd.document.getElementById("CBALRIN"),  "click", WebSAGE.writeParams );
    Core.addEventListener( WebSAGE.g_win_cmd.document.getElementById("ANOTACAO"), "blur",  WebSAGE.writeParams );
    Core.addEventListener( WebSAGE.g_win_cmd.document.getElementById("CBBLKCMD"), "click", WebSAGE.writeParams );

    if ( ! (Q & 0x20) )
      { // ponto digital
      WebSAGE.g_win_cmd.document.getElementById("ESTADO_HID").style.display = "";
      if ( ID.charAt(21)=='M' || SIMULACAO==1 || SIMULACAO==2 ) // permite alterar valor de ponto manual
        {
        WebSAGE.g_win_cmd.document.getElementById("DIVALTVALOR").style.display = "";

        Core.addEventListener
          ( WebSAGE.g_win_cmd.document.getElementById("CBALTVALOR"), 
            "click", 
            function() { WebSAGE.g_win_cmd.document.getElementById('CBALTVALOR').style.display = 'none';
                         WebSAGE.g_win_cmd.document.getElementById('DIVALTVALORDIG').style.display = ''; 
                       } 
          );
        
        WebSAGE.g_win_cmd.document.getElementById("rbNovoValor").nextSibling.data = ST_ON;
        WebSAGE.g_win_cmd.document.getElementById("rbNovoValorOff").nextSibling.data = ST_OFF;
        Core.addEventListener( WebSAGE.g_win_cmd.document.getElementById("rbNovoValor"), "click", WebSAGE.writeValor );
        Core.addEventListener( WebSAGE.g_win_cmd.document.getElementById("rbNovoValorOff"), "click", WebSAGE.writeValor );
        }
      }
  
    // torna visível botão de comandar, caso haja comando associado
    if ( CNPTO != 0 )
      {
      WebSAGE.g_win_cmd.document.getElementById("COMANDAR").style.display = "";
      Core.addEventListener( WebSAGE.g_win_cmd.document.getElementById("COMANDAR"), "click", WebSAGE.prejanelaComando );
      }

    WebSAGE.mostraDestaqPonto( NPTO );
    }

  // bloqueio automático de comando por presença de anotação
  if ( CNPTO != 0 )
    {
    if ( WebSAGE.g_win_cmd.document.getElementById("ANOTACAO").value != "" )
      {
      WebSAGE.g_win_cmd.document.getElementById("COMANDAR").disabled = true;
      WebSAGE.g_win_cmd.document.getElementById("DIVBLKCMD").style.display = '';
      }
    else  
      {
      WebSAGE.g_win_cmd.document.getElementById("COMANDAR").disabled = false;
      WebSAGE.g_win_cmd.document.getElementById("DIVBLKCMD").style.display = 'none';
      WebSAGE.g_win_cmd.document.getElementById("CBBLKCMD").checked = false;
      }

    if ( WebSAGE.g_win_cmd.document.getElementById("CBBLKCMD").checked )
      { 
        WebSAGE.g_win_cmd.document.getElementById("COMANDAR").disabled = false; 
      }
         
    if ( WebSAGE.g_win_cmd.document.getElementById("COMANDAR").disabled )
      { 
        WebSAGE.g_win_cmd.document.getElementById("COMANDAR").title = Msg.BlqAnot; 
      }
    else
      { 
        WebSAGE.g_win_cmd.document.getElementById("COMANDAR").title = Msg.AcessCmd; 
      }
      
    if ( Q & 0x2000 )
      {
      WebSAGE.g_win_cmd.document.getElementById("DIVCMDBLKBUT").style.display = 'none';
      WebSAGE.g_win_cmd.document.getElementById("SPCMDINTERTRAV").style.display = '';
      }
    else  
      {
      WebSAGE.g_win_cmd.document.getElementById("DIVCMDBLKBUT").style.display = '';
      WebSAGE.g_win_cmd.document.getElementById("SPCMDINTERTRAV").style.display = 'none';
      }
    }
    
  WebSAGE.g_timerID = setTimeout( 'WebSAGE.showValsInfo2(1)', 2000 );    
  }
catch ( err ) 
  {
    $('#SP_STATUS').text( err.name + ": " + err.message + " [2]" ); 
    document.getElementById("SP_STATUS").title = err.stack;      
  }  
      
}, 

prejanelaComando : function( nponto ) 
{
  clearTimeout( WebSAGE.g_timerID );
  WebSAGE.janelaComando( NPTO );
},

// busca dados do servidor e prepara chamada temporizada de showValsCmd para   
janelaComando : function( nponto ) 
{
  WebSAGE.g_nponto_sup = nponto;  
  NPTO = 0; 
  CNPTO = 0;
  WebSAGE.getScript( WebSAGE.g_remoteServer + '?I=' + WebSAGE.g_nponto_sup + '&B=WebSAGE.showValsCmd1' );
},

// Mostra dados sobre o comando na respectiva janela 
showValsCmd1 : function()
{
  if ( WebSAGE.g_win_cmd.window != undefined && WebSAGE.g_win_cmd ) // fecha janela info
    { 
      WebSAGE.g_win_cmd.window.close(); 
    }

  if ( CNPTO == 0 || CNPTO === undefined )
    { 
      return; 
    }
    
  WebSAGE.g_win_cmd = NPTO; // mark window to be opened for point NPTO  
    
  // abre nova janela, dá um tempo e vai  preencher os dados da nova janela em outra funcao
  setTimeout( "WebSAGE.g_win_cmd=window.open('dlgcomando.html','wscomando','dependent=yes,height=450,width=450,toolbar=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=no,modal=yes');", 500 );
  
  // será chamado pela própria janela
}, 

// Mostra os dados sobre o ponto de comando em janela popup 
showValsCmd2 : function()
{
  var se;
  if ( F[NPTO] & 0x2000 ) // Comando intertravado?
    { 
      WebSAGE.g_win_cmd.close(); 
    }

  se = ESTACAO;
  se = se + '-';  

  WebSAGE.cmdWriteById( WebSAGE.g_win_cmd, 'fc_inst', ESTACAO );
  WebSAGE.cmdWriteById( WebSAGE.g_win_cmd, 'fc_mod', CDESC.substring( 0, CDESC.indexOf("-") ) );
  WebSAGE.cmdWriteById( WebSAGE.g_win_cmd, 'fc_info', CDESC.substring( CDESC.indexOf("-") + 1 ) );

  WebSAGE.cmdWriteById( WebSAGE.g_win_cmd, 'NPONTO_SUP', NPTO + '-' + ID );
  WebSAGE.cmdWriteById( WebSAGE.g_win_cmd, 'DESCR_SUP', se + DESC );

  if ( ! ( F[NPTO] & 0x20 ) )
    { // digital
    if ( V[NPTO] > 0 )
      { 
      WebSAGE.cmdWriteById( WebSAGE.g_win_cmd, 'ESTADO_SUP', ST_OFF + " (" + Msg.EstadoAtual + ")" ); // não zero é off 
      // se o estado atual (off) bate com o valor do comando off (3 primeiras letras do texto), 
      // assume que deve a intenção é comandar ON, portanto sombreia a opção OFF
      if ( CST_OFF.toUpperCase().substring( 0, 2 ) === ST_OFF.toUpperCase().substring( 0, 2 ) && 
           CST_ON.toUpperCase().substring( 0, 2 ) !== ST_OFF.toUpperCase().substring( 0, 2 )  
         )
        { 
          WebSAGE.g_win_cmd.document.getElementById('CMD_OFF').style.color = "darkgray"; 
        }
      }
    else  
      {
      WebSAGE.cmdWriteById( WebSAGE.g_win_cmd, 'ESTADO_SUP', ST_ON + " (" + Msg.EstadoAtual + ")" ); // zero é on
      // se o estado atual (on) bate com o valor do comando on (3 primeiras letras do texto), 
      // assume que deve a intenção é comandar OFF, portanto sombreia a opção ON
      if ( CST_ON.toUpperCase().substring( 0, 2 ) === ST_ON.toUpperCase().substring( 0, 2 ) &&
           CST_OFF.toUpperCase().substring( 0, 2 ) !== ST_ON.toUpperCase().substring( 0, 2 ) 
         )
        { 
          WebSAGE.g_win_cmd.document.getElementById('CMD_ON').style.color = "darkgray"; 
        }
      }
    WebSAGE.g_win_cmd.document.getElementById("ESTADO_HID").style.display = "";
    }
  else
    { // analógico
    WebSAGE.cmdWriteById( WebSAGE.g_win_cmd, 'VALOR_SUP', V[NPTO] + " " + UNIDADE + " (" + Msg.QValor + ")" );
    WebSAGE.g_win_cmd.document.getElementById("VALOR_HID").style.display = "";
    }    
  
  WebSAGE.cmdWriteById( WebSAGE.g_win_cmd, 'CNPONTO_SUP', CNPTO + '-' + CID );
  WebSAGE.cmdWriteById( WebSAGE.g_win_cmd, 'CDESCR_SUP', se + CDESC );

  WebSAGE.g_win_cmd.document.getElementById('CMD_OFF').text = CST_OFF.toUpperCase();    
  WebSAGE.g_win_cmd.document.getElementById('CMD_ON').text = CST_ON.toUpperCase();
  // WebSAGE.g_win_cmd.document.getElementById('EXECUTAR').innerHTML = CST_OFF.toUpperCase()+"!";
  WebSAGE.g_win_cmd.document.getElementById('EXECUTAR').style.display = "";
  WebSAGE.g_win_cmd.document.getElementById('EXECUTAR').disabled = true;
  WebSAGE.g_win_cmd.document.getElementById('COMANDO').style.display = "";
}, 

executaComando : function(cmd_01)
{
  WebSAGE.getScript( WebSAGE.g_remoteServer + '?K=' + CNPTO + '&V=' + cmd_01 + '&T=1' );
},

ackComando : function()
{
  WebSAGE.getScript( WebSAGE.g_remoteServer + '?A=' + CNPTO );
},

writeParams : function() 
{
  if ( !WebSAGE.g_win_cmd )
     { 
       return; 
     }
  if ( typeof(WebSAGE.g_win_cmd.window) != 'object' )
     { 
       return; 
     }
  if ( typeof(WebSAGE.g_win_cmd.window.closed) === 'undefined' )
     { 
       return; 
     }
  if ( WebSAGE.g_win_cmd.window.closed )
     { 
       return; 
     }
  if ( WebSAGE.g_win_cmd.document === undefined )
     { 
       return; 
     }

  if ( WebSAGE.g_win_cmd.document.getElementById("CBBLKCMD").checked ) // desbloqueio do comando apaga anotação
    { 
      WebSAGE.g_win_cmd.document.getElementById("ANOTACAO").value = ""; 
    }

  var li = parseFloat( WebSAGE.g_win_cmd.document.getElementById("LIMINF").value );
  if ( isNaN( li ) )
    {
    li = -999999.0;
    WebSAGE.g_win_cmd.document.getElementById("LIMINF").value = li;
    }
              
  var ls = parseFloat( WebSAGE.g_win_cmd.document.getElementById("LIMSUP").value );
  if ( isNaN( ls ) )
    {
    ls = 999999.0;
    WebSAGE.g_win_cmd.document.getElementById("LIMINF").value = ls;
    }

  var hs = parseFloat( WebSAGE.g_win_cmd.document.getElementById("HISTER").value );
  if ( isNaN( hs ) )
    {
    hs = 0;
    WebSAGE.g_win_cmd.document.getElementById("HISTER").value = hs;
    }

  LIMINFS[NPTO] = li;
  LIMSUPS[NPTO] = ls;
  
  WebSAGE.g_win_cmd.document.getElementById("LIMINF").value = li;
  WebSAGE.g_win_cmd.document.getElementById("LIMSUP").value = ls;
  WebSAGE.g_win_cmd.document.getElementById("HISTER").value = hs;

  WebSAGE.getScript( 
               WebSAGE.g_remoteServer + 
               '?W=' + NPTO + 
               "&LI=" + li + 
               "&LS=" + ls + 
               "&HI=" + hs + 
               "&AI=" + (WebSAGE.g_win_cmd.document.getElementById("CBALRIN").checked ? 1 : 0 ) + 
               "&AN=" + WebSAGE.g_win_cmd.document.getElementById("ANOTACAO").value.replace(/^\s\s*/, '').replace(/\s\s*$/, '').replace(/\n/g, "|^").replace(/'/g, "") + // troca os \n por |^ e tira as aspas que dão problema no javascript 
               "&VN=" + 0
             );  
},

// open trend visor of point info
tendencias : function()
{
  WebSAGE.vis_trend( NPTO );
},

// open trend visor 
vis_trend : function( npt )
{
  if ( location.host == "127.0.0.1" || location.host == "localhost" ) // se está acessando máquina local      
     { 
       WebSAGE.getScript( WebSAGE.g_remoteServer + "?x=7&P=" + npt ); 
     }
  else // na máquina remota abre uma janela nova tipo popup
     { 
       window.open( 'trend.html?NPONTO=' + npt, 'Tendencias ' + npt, 'dependent=no,height=400,width=700,location=no,toolbar=no,directories=no,status=no,menubar=no,resizable=yes,modal=no' ); 
     }
  setTimeout( 'WebSAGE.g_win_cmd.close()', 500 );
},

// open plot visor (historical) of point info
curvas : function()
{
  window.open( 'histwebview/histwebview.php?NPONTO_1=' + NPTO, 'Histwebview ' + NPTO, 'dependent=no,height=600,width=1000,location=no,toolbar=no,directories=no,status=no,menubar=no,resizable=yes,modal=no' ); 
  setTimeout( 'WebSAGE.g_win_cmd.close()', 500 );
},

// open tabular visor of bay, of point info
tabular : function()
{
if ( location.host == "127.0.0.1" || location.host == "localhost" ) // se está acessando máquina local
   WebSAGE.getScript( WebSAGE.g_remoteServer + "?x=3&m=" + ESTACAO + "&b=" + MODULO );
else // na máquina remota abre uma janela nova tipo popup
   window.open( 'tabular.html?SUBST=' + ESTACAO + '&BAY=' + MODULO, 
                'Tabular', 'dependent=no,height=700,width=900,location=no,toolbar=no,directories=no,status=no,menubar=no,resizable=yes,modal=no' );    
setTimeout('WebSAGE.g_win_cmd.close()',500);
},

writeValor : function() 
{
  var val;  

  if ( !WebSAGE.g_win_cmd )
     { 
       return; 
     }
  if ( typeof(WebSAGE.g_win_cmd.window) != 'object' )
     { 
       return; 
     }
  if ( typeof(WebSAGE.g_win_cmd.window.closed) === 'undefined' )
     { 
       return; 
     }
  if ( WebSAGE.g_win_cmd.window.closed )
     { 
       return; 
     }
  if ( WebSAGE.g_win_cmd.document === undefined )
     { 
       return; 
     }
    
  if ( F[NPTO] & 0x20 )
    { 
      val =  WebSAGE.g_win_cmd.document.getElementById("NOVOVALOR").value; 
    }
  else      
    { 
      val = WebSAGE.g_win_cmd.document.getElementById("rbNovoValor").checked ? 0 : 1; 
    }
  
  WebSAGE.getScript( WebSAGE.g_remoteServer + '?X=' + NPTO + "&V=" + val );
},

timerBlink : function()
{
  var i;
  var half_opac = 0.5;

  // avoid object not alarmed anymore left with opacity = half_opac
  if ( ! ( WebSAGE.g_blinkcnt % 2 ) )
    {  // last time was opacity = half_opac
    for ( i = 0; i < WebSAGE.g_blinkListOld.length; i++ )
      {
      // looks for the object in the new list, if is not anymore on list, reset opacity
      if ( WebSAGE.g_blinkList.indexOf( WebSAGE.g_blinkListOld[i] ) === -1 )
        WebSAGE.g_blinkListOld[i].style.opacity = 1;
      }
    for ( i = 0; i < WebSAGE.g_blinkListAnaOld.length; i++ )
      {
      // looks for the object in the new list, if is not anymore on list, reset opacity
      if ( WebSAGE.g_blinkListAna.indexOf( WebSAGE.g_blinkListAnaOld[i] ) === -1 )
        WebSAGE.g_blinkListAnaOld[i].style.opacity = 1;
      }
    }

  for ( i = 0; i < WebSAGE.g_blinkList.length; i++ )
    {
    if ( typeof ( WebSAGE.g_blinkList[i].allowblink ) != 'undefined' )  
    if ( ! WebSAGE.g_blinkList[i].allowblink )  
       {
         continue;
       } // evita piscar quando é usado atributo opacity

    if ( WebSAGE.g_blinkcnt % 2 )
      { 
        WebSAGE.g_blinkList[i].style.opacity = half_opac; 
      }
    else 
      { 
        WebSAGE.g_blinkList[i].style.opacity = 1; 
      }
    }

  for ( i = 0; i < WebSAGE.g_blinkListAna.length; i++ )
    {
    if ( typeof ( WebSAGE.g_blinkListAna[i].allowblink ) != 'undefined' )  
    if ( ! WebSAGE.g_blinkListAna[i].allowblink )  
      { 
        continue; 
      } // evita piscar quando é usado atributo opacity

    if ( WebSAGE.g_blinkcnt % 2 )
      { 
        WebSAGE.g_blinkListAna[i].style.opacity = half_opac; 
      }
    else 
      { 
        WebSAGE.g_blinkListAna[i].style.opacity = 1; 
      }
    }

  // save lists for next cycle
  WebSAGE.g_blinkListOld = WebSAGE.g_blinkList.slice();
  WebSAGE.g_blinkListAnaOld = WebSAGE.g_blinkListAna.slice();

  WebSAGE.g_blinkcnt++;
},

doResize : function ()
{
	var svgdiv = document.getElementById("svgdiv");
    svgdiv.style.width = document.body.offsetWidth; 
	svgdiv = null;  
},

// retorna o valor do ponto, se houver, interpreta tags tipo !ALMnnnnn e !TMPnnnnn
valorTagueado: function ( tag )
{ 
  var retnok = "????";
  var t;
  
  if ( tag == "" || typeof( tag ) === 'undefined' )
    { 
      return retnok; 
    }
  
  t = parseInt( tag ); 

  if ( ! isNaN( t ) )
    {
      if ( typeof( V[t] ) === 'undefined' )
        { 
          return retnok; 
        }
      else 
        { 
          return V[t]; 
        }
    }
    
  if ( tag.indexOf("!SLIM") === 0 ) 
    {
      t = tag.substr(5);
      if ( typeof( LIMSUPS[t] ) === 'undefined' )
        { 
          return 999999; 
        }
      return LIMSUPS[t];      
    }

  if ( tag.indexOf("!ILIM") === 0 ) 
    {
      t = tag.substr(5);
      if ( typeof( LIMINFS[t] ) === 'undefined' )
        { 
          return -999999; 
        }
      return LIMINFS[t];      
    }

  if ( tag.indexOf("!TAG") === 0 ) 
    {
      t = tag.substr(4);
      if ( typeof( TAGS[t] ) === 'undefined' )
        { 
          return 0; 
        }
      return TAGS[t];      
    }

  if ( tag.indexOf("!DCR") === 0 ) 
    {
      t = tag.substr(4);
      if ( typeof( DCRS[t] ) === 'undefined' )
        { 
          return 0; 
        }
      return DCRS[t];      
    }

  if ( tag.indexOf("!STON") === 0 ) 
    {
      t = tag.substr(5);
      if ( typeof( STONS[t] ) === 'undefined' )
        { 
          return ""; 
        }
      
      return STONS[t];      
    }

  if ( tag.indexOf("!STOFF") === 0 ) 
    {
      t = tag.substr(6);
      if ( typeof( STOFS[t] ) === 'undefined' )
        { 
          return ""; 
        }
      
      return STOFS[t];      
    }

  if ( tag.indexOf("!STVAL") === 0 ) 
    {
      t = tag.substr(6);
      if ( (F[t] & 0x03) === 0x02 )
        { 
        return STONS[t];   
        }
      if ( (F[t] & 0x03) === 0x01)
        { 
        return STOFS[t];   
        }
      if ( (F[t] & 0x03) === 0x00 )
        { 
        return retnok;   
        }
      if ( (F[t] & 0x03) === 0x03 )
        { 
        return retnok;
        }           
    }

  if ( tag.indexOf("!ALR") === 0 ) 
    {
      t = tag.substr(4);
      if ( typeof( F[t] ) === 'undefined' )
        { 
          return 0; 
        }
      
      if ( (F[t] & 0x100) )      
        { 
          return 1; 
        }
      else
        { 
          return 0; 
        }
    }

  if ( tag.indexOf("!ALM") === 0 ) 
    {
      t = tag.substr(3);
      if ( typeof( F[t] ) === 'undefined' )
        { 
          return 0; 
        }
      
      if ( (F[t] & 0x800) || (F[t] & 0x100) )      
        { 
          return 1; 
        }
      else
        { 
          return 0; 
        }
    }

  if ( tag.indexOf("ALM") === 0 ) 
    {
      t = tag.substr(3);
      if ( typeof( F[t] ) === 'undefined' )
        { 
          return 0; 
        }
      
      if ( (F[t] & 0x800) || (F[t] & 0x100) )      
        { 
          return 1; 
        }
      else
        { 
          return 0; 
        }
    }

  if ( tag.indexOf("!TMP") === 0 ) 
    {
      t = tag.substr(3);
      if ( typeof( T[t] ) === 'undefined' )
        { 
          return retnok; 
        }
      else
        { 
          return T[ tag.substr(3) ]; 
        }
    }

  if ( tag.indexOf("TMP") === 0 ) 
    {
      t = tag.substr(3);
      if ( typeof( T[t] ) === 'undefined' )
        { 
          return retnok; 
        }
      else
        { 
          return T[ tag.substr(3) ]; 
        }
    }
  
  if ( tag.indexOf("!EVAL") === 0 ) 
    {
      t = tag.substr(5);
      try 
        {
        return eval(t);
        }
      catch( err )
        {
        $('#SP_STATUS').text( err.name + ": " + err.message + " [3]" ); 
        document.getElementById("SP_STATUS").title = err.stack;
        return retnok;
        }
    }
  
  return retnok;
},

// imprime valor do ponto formatado padrão printf extendido, com código para setas direcionais
interpretaFormatoC: function( fmt, tag )
{
var valr;
var tptag = 0;

valr = WebSAGE.valorTagueado( tag );

if ( valr === "????" )
  { 
    return valr; 
  }
 
// se não tiver formato definido, retorna padrão
if ( typeof( fmt ) == 'undefined' || fmt.indexOf("%") < 0 )
  {
  if ( isNaN( parseFloat( valr ) ) )  
    { 
      fmt = "%s"; 
    }
  else 
    { 
      fmt = "%1.1f"; 
    }
  }

var v = "";

if ( typeof( F[tag] ) != 'undefined' )
if ( F[tag] & 0x20 )      
  {
  if ( WebSAGE.g_MostraQualAna )
    {
    // if ( F[tag] & 0x08 )
    //   { v=v+"F"; }
    if ( F[tag] & 0x100 )
      {
        v = v + "L"; 
      }
    if ( F[tag] & 0x200 )
      { 
        v = v + "A"; 
      }
    if ( (F[tag] & 0x0C) === 0x0C )
      { 
        v = v + "M"; 
      }
    if ( (F[tag] & 0x0C) === 0x08 )
      { 
        v = v + "X"; 
      }
    //if ( (F[tag] & 0x0C) == 0x04 )
    //  { v=v+"C"; }
    if ( F[tag] & 0x10 )
      { 
        v = v + "S"; 
      }
    if ( F[tag] & 0x800 )
      { 
        v = v + "N"; 
      }
    if ( F[tag] & 0x400 )
      { 
        v = v + "I"; 
      }
    if ( F[tag] & 0x1000 )
      {
        v = v + "U"; 
      }
    if ( v != "")
      {
        v = ":" + v; 
      }
    }  

  // trata código para setas  
  if ( fmt.search(/[udrla]\^/) >= 0 )
     {      
     fmt = fmt.replace( 'u^', String.fromCharCode(valr >= 0 ? 0x2191:0x2193) ); // u^ up arrow
     fmt = fmt.replace( 'd^', String.fromCharCode(valr >= 0 ? 0x2193:0x2191) ); // d^ down arrow
     fmt = fmt.replace( 'r^', String.fromCharCode(valr >= 0 ? 0x21a3:0x21a2) ); // r^ right arrow
     fmt = fmt.replace( 'l^', String.fromCharCode(valr >= 0 ? 0x21a2:0x21a3) ); // l^ left arrow
     fmt = fmt.replace( 'a^', '' ); // a^, absolute value
     valr = Math.abs( valr );
     }
     
  fmt = fmt.replace( 'f', 'f' + v );
  }

return printf( fmt, valr );
},

// resolves clone tags like %n to n = point number
pegaTagClone : function ( item , lb )
{
  var k;
  var l;
  var poseq;
  var pattern;
  var poscloned;
  
  // if there is a tag list
  if ( typeof( lb.list ) !== 'undefined' )
    {
      // for all the tag list 
      for ( var j = 0; j < lb.list.length; j++ )
        {
        if ( typeof( lb.list[j].tag ) !== 'undefined' )
        if ( lb.list[j].tag.indexOf("%") !== -1 ) // is a cloned tag? (with a % char)
        if ( item.parentNode.nodeName === "g" )
           {
           // looks for the parent node in the XSAC object list
           for ( k = 0; k < WebSAGE.InkSage.length; k++ )
             {
               if ( WebSAGE.InkSage[k].parent.id === item.parentNode.id )
                { // parent found
                  if  ( typeof( item.parentNode.noTrace ) !== "undefined" )
                     { // propagates notrace mark from parent to child
                       item.noTrace = item.parentNode.noTrace;
                     }

                  // looks for the tag in the map of cloned tags of the group           
                  for ( l = 0; l < WebSAGE.InkSage[k].map.length; l++ )
                    {
                    // position of the equal sign in the map item, after it there is the resoved tag  
                    poseq = WebSAGE.InkSage[k].map[l].indexOf( "=" ); 
                    // pattern is %n from  "%n=nnn" where nnn=point number
                    pattern = WebSAGE.InkSage[k].map[l].substring( 0, poseq );
                    // position of the % in the cloned tag (may be %n or like !SLIM%n)
                    poscloned = lb.list[j].tag.indexOf("%");
                    if ( pattern === lb.list[j].tag.substring( poscloned ) )
                      { // substitutes %n by the point number
                        lb.tag = lb.list[j].tag;
                        lb.list[j].tag = lb.list[j].tag.substring(0, poscloned) + WebSAGE.InkSage[k].map[l].substring( poseq + 1 );
                        WebSAGE.InkSage[k].tag = lb.list[j].tag;
                        break;
                      }
                    } 
                  break;
                }
              }
           }      
        }
    }
  else
    {
      if ( typeof( lb.tag ) !== 'undefined' )
      if ( lb.tag.indexOf( "%" ) !== -1 ) // is a cloned tag? (with a % char)
      if ( item.parentNode.nodeName === "g" )
      {
       if  ( typeof( item.parentNode.noTrace ) !== "undefined" )
         { // propagates notrace mark from parent to child
           item.noTrace = item.parentNode.noTrace;
         }
      
       // looks for the parent node in the XSAC object list
       for ( k = 0; k < WebSAGE.InkSage.length; k++ )
         {
         if ( WebSAGE.InkSage[k].parent.id === item.parentNode.id )
            { // parent found
              // looks for the tag in the map of cloned tags of the group           
              for ( l = 0; l < WebSAGE.InkSage[k].map.length; l++ )
                {
                // position of the equal sign in the map item, after it there is the resoved tag  
                poseq = WebSAGE.InkSage[k].map[l].indexOf( "=" );
                // pattern is %n from  "%n=nnn" where nnn=point number
                pattern = WebSAGE.InkSage[k].map[l].substring( 0, poseq );
                // position of the % in the cloned tag (may be %n or like !SLIM%n)
                poscloned = lb.tag.indexOf("%");
                if ( pattern === lb.tag.substring( poscloned ) )
                  { // substitutes %n by the point number
                    lb.tag = lb.tag.substring(0, poscloned) + WebSAGE.InkSage[k].map[l].substring( poseq + 1 );
                    item.temPaiGrupo = 1;
                    break;
                  }
                } 
              break;
            }
        }
      }

      if ( typeof( lb.src ) !== 'undefined' )
      if ( lb.src.indexOf( "%" ) !== -1 ) // is a cloned tag? (with a % char)
      if ( item.parentNode.nodeName === "g" )
      { 
       if ( typeof( item.parentNode.noTrace ) !== "undefined" )
          { // propagates notrace mark from parent to child
          item.noTrace = item.parentNode.noTrace;
          }
      
       // looks for the parent node in the XSAC object list
       for ( k = 0; k < WebSAGE.InkSage.length; k++ )
         { 
         if ( WebSAGE.InkSage[k].parent.id === item.parentNode.id )
            { // parent found
              // looks for the tag in the map of cloned tags of the group           
              for ( l = 0; l < WebSAGE.InkSage[k].map.length; l++ )
                {
                // position of the equal sign in the map item, after it there is the resoved tag  
                poseq = WebSAGE.InkSage[k].map[l].indexOf( "=" );
                // pattern is %n from  "%n=nnn" where nnn=point number
                pattern = WebSAGE.InkSage[k].map[l].substring( 0, poseq );
                // position of the % in the cloned tag (may be %n or like !SLIM%n)
                poscloned = lb.src.indexOf("%");
                if ( pattern === lb.src.substring( poscloned ) )
                  { // substitutes %n by the point number
                    lb.tag = lb.src.substring(0, poscloned) + WebSAGE.InkSage[k].map[l].substring( poseq + 1 );
                    lb.src = lb.tag;
                    item.temPaiGrupo = 1;
                    break;
                  }
                } 
              break;
            }
        }
      }
      
      if ( lb.attr === "tooltips" )
        {
        for ( j = 0; j < lb.param.length; j++ )
            {
              if ( lb.param[j].indexOf("!EVAL") !== -1  )
              if ( lb.param[j].indexOf( "%" ) !== -1 ) // is a cloned tag? (with a % char)
              if ( item.parentNode.nodeName === "g" )
                {
                 if ( typeof( item.parentNode.noTrace ) !== "undefined" )
                    { // propagates notrace mark from parent to child
                    item.noTrace = item.parentNode.noTrace;
                    }
              
                 // looks for the parent node in the XSAC object list
                 for ( k = 0; k < WebSAGE.InkSage.length; k++ )
                   { 
                   if ( WebSAGE.InkSage[k].parent.id === item.parentNode.id )
                      { // parent found
                        // looks for the tag in the map of cloned tags of the group           
                        for ( l = 0; l < WebSAGE.InkSage[k].map.length; l++ )
                          {
                          // position of the equal sign in the map item, after it there is the resoved tag  
                          poseq = WebSAGE.InkSage[k].map[l].indexOf( "=" );
                          // pattern is %n from  "%n=nnn" where nnn=point number
                          pattern = WebSAGE.InkSage[k].map[l].substring( 0, poseq );
                          // position of the % in the cloned tag (may be %n or like !SLIM%n)
                          poscloned = lb.param[j].indexOf( "%" );
                          if ( pattern === lb.param[j].substring( poscloned,  poscloned + pattern.length ) )
                            { // substitutes %n by the point number
                              lb.param[j] =  lb.param[j].substring( 0, poscloned ) + 
                                             WebSAGE.InkSage[k].map[l].substring( poseq + 1 ) + 
                                             lb.param[j].substring( poscloned + pattern.length );
                              item.temPaiGrupo = 1;
                              break;
                            }
                          } 
                        break;
                      }
                  }
                }
             }    
        
        }      
    }
},

// Distributes one object after another (to the right or bottom) inside a group  
setGroupDistrib : function ( grp )
{ 
var i, xright, bb, ybottom, dif, tl;

 for ( i = 0; i < grp.children.length; i++ )
    {
    if ( i > 0 )
      {
      if ( typeof( grp.children[i].inittransform ) === "undefined" )
        {
        grp.children[i].inittransform = grp.children[i].getAttributeNS( null, 'transform' );
        }                 
      bb = grp.children[i].getBoundingClientRect();
      
      if ( typeof( grp.children[i].lastXlate ) === "undefined" )
        {
        grp.children[i].lastXlate = 0;
        }
      
      if ( grp.groupDistribType === "vertical" )       
        {
        dif = parseFloat( ybottom - bb.top + grp.groupDistribSpacing ) + grp.children[i].lastXlate;
        tl = ' translate(0,' + dif + ')';   
        }
      else  
        {
        dif = parseFloat( xright - bb.left + grp.groupDistribSpacing ) + grp.children[i].lastXlate;
        tl = ' translate(' + dif + ',0)';
        }
        
      grp.children[i].setAttributeNS( null, 'transform', grp.children[i].inittransform + tl );
      grp.children[i].lastXlate = dif;
      }
    bb = grp.children[i].getBoundingClientRect();
    xright = bb.right;
    ybottom = bb.bottom;
    grp.children[i].groupDistrib = 1;
    }
},

// page preview on mouse over (after a timeout)
setPreview : function ( item, url, width, height )
{
  var winsz= "";		
  if ( typeof( width ) != "undefined" )
    {
	winsz = "top.document.getElementById('previewframe').width = " + width + ";";
	}
  if ( typeof( height ) != "undefined" )
    {
	winsz = winsz + "top.document.getElementById('previewframe').height = " + height + ";";
	}

  // when mouse over the item, after a timeout, show the preview page
  item.setAttributeNS( 
     null, 
     "onmouseover", 
	   "clearTimeout(top.WebSAGE.g_timerPreviewID); " + 
       "if ( top.document.getElementById('timemachinecontrols').style.display != 'none') { return; } " + // don't show if timemichine mode activated
	   winsz +
       "if ( top.window.innerWidth < 100 + parseInt(top.document.getElementById('previewframe').width) ) { return; } " + // don't show if window not wide enough
       "if ( top.window.innerHeight < 100 + parseInt(top.document.getElementById('previewframe').height) ) { return; } " + // don't show if window not high enough
       "top.WebSAGE.g_timerPreviewID = setTimeout( \"top.document.getElementById('previewframe').src = '" + url +  "'; " + "top.document.getElementById('previewdiv').style.display = '';\" , " + 
	                                                "top.WebSAGE.g_timeOutPreview); " );
  // when mouse out of the preview, close it
  document.getElementById('previewdiv').setAttributeNS( 
      null, 
      "onmouseout",  
	  "clearTimeout(top.WebSAGE.g_timerPreviewID); " + 
	    "top.document.getElementById('previewdiv').style.display = 'none'; " + 
		"top.document.getElementById('previewframe').src = '';" );
  // when mouse out of the item that activated the preview, close the preview	
  item.setAttributeNS( 
      null, 
	  "onmouseout", 
	  "clearTimeout(top.WebSAGE.g_timerPreviewID); " + 
	    "top.document.getElementById('previewdiv').style.display = 'none'; " +
		"top.document.getElementById('previewframe').src = '';" );
},

le_inkscapeSAGETags : function ( item )
{
// Tags do Integraxtor, XSAC, http://www.integraxor.com/
var inksage_labeltxt = item.getAttributeNS( "http://www.inkscape.org/namespaces/inkscape", "label" );
var lbv, pnt, inksage_labelvec, j, i, t;
var tspl, src, xsacsrc, arrcores, idtela;
var utm, calltps, tooltip, tooltiptext, textNode, clone, nohs, bb, xright, sep;
var tfm;
var arr = [];
var auxobj;

if ( inksage_labeltxt === null )
  { 
    return; 
  }

if ( inksage_labeltxt == "" )
  { 
    return; 
  }
  
if ( typeof( inksage_labeltxt ) != 'undefined' ) 
  {
  try 
    {
    inksage_labelvec = JSON.parse('[' + inksage_labeltxt + ']');  // transforma texto em vetor
    } 
  catch ( Exception )
    {
    return;
    }
    
  for ( lbv = 0; lbv < inksage_labelvec.length; lbv++ )
    {
    inksage_labelvec[lbv].parent = item;
    WebSAGE.pegaTagClone( item, inksage_labelvec[lbv] ); // resolve as tags de clones
    if ( typeof( inksage_labelvec[lbv].tag ) != 'undefined' ) // tem tag de ponto
      {
         pnt = WebSAGE.acrescentaPontoLista( inksage_labelvec[lbv].tag );
         if ( isInt( pnt ) )
         if ( pnt != 99999 ) // dummy point   
         if ( item.pontoPopup == undefined ) // se já não tem popup definido
           {
           item.setAttributeNS( null, "onclick", WebSAGE.g_obj_onclick.replace(/PONTO/g, pnt) );         
           if ( item.style !== null )
             {
               item.style.cursor = "pointer";
             }  

           if ( item.noTrace == undefined && item.parentNode.noTrace == undefined )
             {
             WebSAGE.produzEtiq( item, pnt );
             WebSAGE.produzDestaq( item, pnt );
             WebSAGE.produzRelac( item, pnt );
             }
           }
      }      
    
    switch ( inksage_labelvec[lbv].attr )
      {
      case "set":
         switch ( inksage_labelvec[lbv].tag )
           {
           case "#radar": // radar chart, defined under a rectangle
               // Lib: https://github.com/alangrafu/radar-chart-d3
               if ( item.tagName !== "rect" )
                 break;
               if ( ! WebSAGE.g_hasRadar )
                 {
                 WebSAGE.g_hasRadar = true;
                 // insert css for radar (spider) charts into the screen SVG
                 var el = $( document.createElementNS('http://www.w3.org/2000/svg', 'style') );
                 $(el).load( "lib/radar-chart.css", function() {
                        SVGDoc.getElementsByTagName("svg").item(0).appendChild( el[0] );
                        } ) ;
                 }
                 
               item.style.display = 'none'; // hide the rectangle
               item.dta = [ {
                 className: 'teste',
                 axes: 
                   [
                   {axis: "med", value: 1},
                   {axis: "med", value: 1},
                   {axis: "med", value: 1},
                   {axis: "med", value: 1},
                   {axis: "med", value: 1},
                   {axis: "med", value: 1},
                   {axis: "med", value: 1},
                   {axis: "med", value: 1},
                   {axis: "med", value: 1},
                   {axis: "med", value: 1},
                   {axis: "med", value: 1},
                   {axis: "med", value: 1},
                   {axis: "med", value: 1},
                   {axis: "med", value: 1},
                   {axis: "med", value: 1},
                   {axis: "med", value: 1},
                   {axis: "med", value: 1},
                   {axis: "med", value: 1},
                   {axis: "med", value: 1},
                   {axis: "med", value: 1},
                   {axis: "med", value: 1}
                   ]
                 } ];
               
               // point list in the Source field
               item.pnts = inksage_labelvec[lbv].src.split(",");
               for ( j = 0; j < item.pnts.length; j++ )
                 {
                 WebSAGE.acrescentaPontoLista( item.pnts[j] );
                 }                 
               item.dta[0].axes.splice( 0, item.dta[0].axes.length - item.pnts.length );
               item.chart = RadarChart.chart();    
               var jsoncfg = {};
               // load the chart config from the Prompt field
               if ( inksage_labelvec[lbv].prompt !== "" )
                 {
                 jsoncfg = JSON.parse( inksage_labelvec[lbv].prompt );
                 }
               // size and color from the rectangle
               jsoncfg.w = item.getAttributeNS( null, 'width' );
               jsoncfg.h = item.getAttributeNS( null, 'height' );
               jsoncfg.color = d3.scale.ordinal().range( [ item.style.fill ] );
               item.chart.config( jsoncfg );
               var svg = d3.select( SVGDoc.getElementsByTagName("svg").item(0) );
               // insert the chart under layer1 of the Inkscape drawing
               item.cht = svg.select("#layer1").append('g').datum(item.dta).call( item.chart );
               // position according to the rectangle
               item.cht[0][0].setAttributeNS( null, 
                                        'transform', 
                                        ( item.getAttributeNS( null, "transform" ) || "" )  + 
                                        " translate(" + item.getAttributeNS( null, "x" ) + "," + 
                                        item.getAttributeNS( null, "y" ) + ") " ); 
               break;
            case "#exec": // exec a script one time
               try 
                 {
                 eval( 'var thisobj=window.SVGDoc.getElementById("' + item.id + '"); ' + inksage_labelvec[lbv].src );
                 }
               catch( err )
                 {
                 $('#SP_STATUS').text( err.name + ": " + err.message + " [8]" ); 
                 document.getElementById("SP_STATUS").title = err.stack;
                 }
             break;
           case "#set_filter": // set filter to almbox
             if ( ! WebSAGE.g_hidetoolbar )
             if ( inksage_labelvec[lbv].src != "" )
             if ( document.getElementById("almiframe").src == "" )          
               {
               document.getElementById("almiframe").src = "almbox.html?SUBST=" + inksage_labelvec[lbv].src;
               document.getElementById('almiframe').style.display = '';
               } 
             break;
           case "#copy_xsac_from": // copy xsac tags from other object
             if ( inksage_labelvec[lbv].src != "" ) 
                {
                src = inksage_labelvec[lbv].src.split(",");
                for ( j = 0; j < src.length; j++ )
                  {
                  auxobj = SVGDoc.getElementById( src[j] );
                  if ( auxobj !== null )
                    {
                    xsacsrc = auxobj.getAttributeNS( "http://www.inkscape.org/namespaces/inkscape", "label" );
                    if ( xsacsrc != "" )
                      {
                      item.setAttributeNS( "http://www.inkscape.org/namespaces/inkscape", "label", xsacsrc );
                      WebSAGE.le_inkscapeSAGETags( item );
                      }
                    }
                  else
                    {
                    $('#SP_STATUS').text( "Err: 'copy_xsac_from' " + src[j] + " --> " + item.id ); 
                    }    
                  }             
                }
             break;
           case "#set_group_distribution": // Distributes one object after another (to the right or bottom) inside a group  
               {
               sep = parseFloat( inksage_labelvec[lbv].src );
               if ( isNaN(sep) )
                 {
                   item.groupDistribSpacing = 0;
                 }
               else    
                 {
                   item.groupDistribSpacing = sep;
                 }
               
               if ( inksage_labelvec[lbv].prompt === "vertical" )
                 {
                   item.groupDistribType = "vertical";
                 }
               else
                 {
                   item.groupDistribType = "horizontal";
                 }           
                 
               WebSAGE.setGroupDistrib( item );           
               }
             break;
           default:
             break;  
           }
         break;
      case "popup":
         if ( inksage_labelvec[lbv].src.indexOf("preview:") === 0 )
           {
           WebSAGE.setPreview( item, inksage_labelvec[lbv].src.substr(8),  inksage_labelvec[lbv].width, inksage_labelvec[lbv].height );
           }
         else  
         if ( inksage_labelvec[lbv].src === "block" )
           { // do not open point access on click
           item.setAttributeNS( null, "onclick", null );  
           if ( item.style != null)
             {
               item.style.cursor = "";
             }
           item.blockPopup = 1;
           item.noTrace = 1;
           }
         else  
         if ( inksage_labelvec[lbv].src === "notrace" )
           { // allows to open point access tracing other object on click
           item.noTrace = 1;
           }
         else  
         if ( isInt( inksage_labelvec[lbv].src ) )
           { // links other point to access on click  
           pnt = WebSAGE.acrescentaPontoLista( inksage_labelvec[lbv].src ); 
           item.setAttributeNS( null, "onclick", WebSAGE.g_obj_onclick.replace(/PONTO/g, pnt) );
           if ( item.style !== null || typeof( item.style ) === 'undefined' )
             {
               item.style.cursor = "pointer";
             }  
           item.pontoPopup = pnt;
           }           
         break;
      case "get":
         if ( inksage_labelvec[lbv].parent.textContent.indexOf("%") >= 0 ) // guarda formato C, se houver
           { 
           inksage_labelvec[lbv].formatoC = inksage_labelvec[lbv].parent.textContent; 
		   
		   // show the plot preview on mouseover
           WebSAGE.setPreview( item, "trend.html?NPONTO=" + inksage_labelvec[lbv].tag + "&HIDECTRLS=1", 610, 340 );

           var animation = document.createElementNS( 'http://www.w3.org/2000/svg', 'animate' );
           animation.setAttributeNS( null, 'attributeName', 'text-decoration' ); 
           animation.setAttributeNS( null, 'attributeType', 'XML' ); 
           animation.setAttributeNS( null, 'values', '' ); // 'line-through;overline;overline;line-through;overline;overline'
           animation.setAttributeNS( null, 'dur', '1.7s' );
           // animation.setAttributeNS( null, 'begin', 'DOMSubtreeModified' );
           item.appendChild( animation );
           item.changeAnim = animation;
           }
         break;
      case "color":
         if ( item.style !== null )
           {
             inksage_labelvec[lbv].initfill = item.style.fill;
             inksage_labelvec[lbv].initstroke = item.style.stroke;
           }
         else
           {
             inksage_labelvec[lbv].initfill = "";
             inksage_labelvec[lbv].initstroke = "";
           }
         for ( j = 0; j < inksage_labelvec[lbv].list.length; j++ )
           {
             pnt = WebSAGE.acrescentaPontoLista( inksage_labelvec[lbv].list[j].tag );
             inksage_labelvec[lbv].list[j].cscript = "";
             inksage_labelvec[lbv].list[j].cfill = "";
             inksage_labelvec[lbv].list[j].cstroke = "";
             inksage_labelvec[lbv].list[j].cattrib = "";
             inksage_labelvec[lbv].list[j].cattribval = "";             

             if ( inksage_labelvec[lbv].list[j].param.indexOf("attrib: ") === 0 )
               {
               arr = inksage_labelvec[lbv].list[j].param.substr( 8 ).split("=");
               if ( arr.length > 1 )
                 {
                 inksage_labelvec[lbv].list[j].cattrib = arr[0];
                 inksage_labelvec[lbv].list[j].cattribval = arr[1];
                 }
               }
             else
             if ( inksage_labelvec[lbv].list[j].param.indexOf("script: ") === 0 )
               {
               inksage_labelvec[lbv].list[j].cscript = inksage_labelvec[lbv].list[j].param.substr( 8 );
               }
             else
               {
               // executa tradução dos atalhos de cores definidos no config_visores.js
               arrcores = [];
               arrcores = inksage_labelvec[lbv].list[j].param.split("|"); 
               inksage_labelvec[lbv].list[j].cfill = WebSAGE.TraduzCor( arrcores[0] );
               if ( arrcores.length > 1 )
                 { 
                   inksage_labelvec[lbv].list[j].cstroke =  WebSAGE.TraduzCor( arrcores[1] ); 
                 }
               else  
                 { 
                   inksage_labelvec[lbv].list[j].cstroke =  inksage_labelvec[lbv].list[j].cfill; 
                 }
               }

             if ( isInt( pnt ) ) 
             if ( pnt != 99999 ) // dummy point     
             if ( item.pontoPopup === undefined ) // se já não tem popup definido
             if ( j === 0 ) // linka o clic no primeiro ponto (tag) de cor, ignora as demais
               {
               item.setAttributeNS( null, "onclick", WebSAGE.g_obj_onclick.replace(/PONTO/g, pnt) );                  
               if ( item.style !== null )
                 {
                   item.style.cursor = "pointer";
                 }
               if ( item.noTrace === undefined )
                 {
                 WebSAGE.produzEtiq( item, pnt );
                 WebSAGE.produzDestaq( item, pnt );
                 WebSAGE.produzRelac( item, pnt );
                 }
               }
           }
         break;
      case "bar":
         inksage_labelvec[lbv].initheight = item.getAttributeNS( null, "height" );
         break;      
      case "opac":
         break;        
      case "open":
         if ( inksage_labelvec[lbv].istag == 0 )
           { 
           // Source type = URL: 
           //   new:url open new page, 
           //   preview:url preview page (popup),
           //   link to another screen (name of the screen file without path/extension) 
           if ( inksage_labelvec[lbv].src.indexOf("new:") === 0 )
             {
             item.style.cursor = "pointer";
             item.setAttributeNS( null, "onclick", 
               "window.open( '" + inksage_labelvec[lbv].src.substr(4) + 
                 "','','dependent=yes,height=" + inksage_labelvec[lbv].height + ",width=" + inksage_labelvec[lbv].width + 
                 ",toolbar=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=no,modal=yes' );" );
             }
           else  
           if ( inksage_labelvec[lbv].src.indexOf("preview:") === 0 )
             {
             WebSAGE.setPreview( item, inksage_labelvec[lbv].src.substr(8), inksage_labelvec[lbv].width, inksage_labelvec[lbv].height );
             }
           else  
             {  
             idtela =  inksage_labelvec[lbv].src.trim();
             for ( t = 0; t < WebSAGE.g_seltela.length; t++ )
               {
                 if ( WebSAGE.g_seltela.options[t].value == idtela ||
                      WebSAGE.g_seltela.options[t].value == ( "../svg/" + idtela ) ||
                      WebSAGE.g_seltela.options[t].value == ( "../svg/" + idtela + ".svg" ) )
                    {
                        item.setAttributeNS( null, "onclick", "top.WebSAGE.g_seltela.selectedIndex=" + t + "; top.document.fmTELA.submit();" );
                        item.style.cursor = "pointer";
                        // show the linked page preview on mouseover
                        WebSAGE.setPreview( item, 'screen.html?SELTELA=../svg/' + idtela + '&ZPX=0&ZPY=0&ZPW=5280&ZPH=3300&HIDETB=1', 700, 480 );
                    }
               }
             }  
           }
         else
           { // Source type = TAG : gráfico, deve ser um retângulo
           if ( item.tagName === "rect" )
             {
             // values plot
             inksage_labelvec[lbv].grafico = document.createElementNS( 'http://www.w3.org/2000/svg','polyline' );
             // SVGDoc.documentElement.appendChild( inksage_labelvec[lbv].grafico );
             item.parentNode.appendChild( inksage_labelvec[lbv].grafico );
             inksage_labelvec[lbv].grafico.setAttributeNS( null, 'style', "fill:none; stroke:white; stroke-width: 2" );
             tfm = item.getAttributeNS( null, "transform" );
             if ( tfm != null )
               { 
                 inksage_labelvec[lbv].grafico.setAttributeNS( null, "transform", tfm );
               }

             // faz a cor e espessura do gráfico igual ao do retângulo que o contém
             if ( item.style != undefined )
               {
               if ( item.style.strokeWidth != "" )
                 { 
                   inksage_labelvec[lbv].grafico.style.strokeWidth = item.style.strokeWidth; 
                 }
               if ( item.style.stroke != "" ) 
                 { 
                   inksage_labelvec[lbv].grafico.style.stroke = item.style.stroke; 
                 }
               }
               
             // source field format: point number|plot style|superior limit style|inferior limit style
             // Ex: Source: 1234|stroke:green|stroke:red|stroke:orange 
             tspl = inksage_labelvec[lbv].src.split("|");  
             inksage_labelvec[lbv].tag = tspl[0];
             if ( typeof( tspl[1] ) != "undefined" )
               {
               if ( tspl[1].trim() != "" )
                 {
                 inksage_labelvec[lbv].grafico.setAttributeNS( null, 'style', tspl[1] );
                 }
               }
             
             inksage_labelvec[lbv].valores = [];
             inksage_labelvec[lbv].datas = [];
             // inksage_labelvec[lbv].bb = item.getBoundingClientRect();
             inksage_labelvec[lbv].bb = item.getBBox();
             inksage_labelvec[lbv].bb.left = inksage_labelvec[lbv].bb.x;
             inksage_labelvec[lbv].bb.right = inksage_labelvec[lbv].bb.x + inksage_labelvec[lbv].bb.width;
             inksage_labelvec[lbv].bb.top = inksage_labelvec[lbv].bb.y;
             inksage_labelvec[lbv].bb.bottom = inksage_labelvec[lbv].bb.y + inksage_labelvec[lbv].bb.height;             
             pnt = WebSAGE.acrescentaPontoLista( inksage_labelvec[lbv].tag );
             if ( item.pontoPopup == undefined ) // se já não tem popup definido
               {
               item.setAttributeNS( null, "onclick", WebSAGE.g_obj_onclick.replace(/PONTO/g, pnt) );
               if ( item.style != null )
                 {
                   item.style.cursor = "pointer";
                 }
               if ( item.noTrace == undefined )
                 {
                 WebSAGE.produzEtiq( item, pnt );
                 WebSAGE.produzDestaq( item, pnt );
                 WebSAGE.produzRelac( item, pnt );
                 }
               }
             
             // call server to get historic data to fill plot
             utm = (new Date()).getTime() - inksage_labelvec[lbv].width * 60 * 1000;
             calltps = '$.getScript( WebSAGE.g_timePntServer + "?P=' + inksage_labelvec[lbv].tag + '&U=' + utm/1000 + '&F=S' + '&B=histdata(' + WebSAGE.InkSage.length + ');histdata' + '"' + ' );';
             WebSAGE.g_timeshift = WebSAGE.g_timeshift + 2000;
             setTimeout( calltps , WebSAGE.g_timeshift );
             }
           }
         break;
      case "rotate":
         if ( item.getAttributeNS( null, "transform" ) === null )
           {
           inksage_labelvec[lbv].inittransform = "";
           }
         else
           {
           inksage_labelvec[lbv].inittransform = item.getAttributeNS( null, "transform" );
           }
         break;      
      case "tooltips":
         tooltiptext="";
         for ( j = 0; j < inksage_labelvec[lbv].param.length; j++ )
            {
              if ( j > 0 )  
                { 
                tooltiptext = tooltiptext + "\n"; 
                }
              tooltiptext = tooltiptext + inksage_labelvec[lbv].param[j];
            }
         tooltip = document.createElementNS( 'http://www.w3.org/2000/svg', 'title' );
         textNode = document.createTextNode( tooltiptext );
         tooltip.appendChild( textNode );
         item.appendChild( tooltip );
         if ( tooltiptext.indexOf("!EVAL") !== -1  )
           {
           inksage_labelvec[lbv].hasActiveTooltip = 1;
           inksage_labelvec[lbv].tooltipTitle = tooltip;
           inksage_labelvec[lbv].tooltipText = tooltiptext;           
           }
         break;      
        case "slider":
         if ( item.getAttributeNS( null, "transform" ) === null )
           {
           inksage_labelvec[lbv].inittransform = "";
           }
         else
           {
           inksage_labelvec[lbv].inittransform = item.getAttributeNS( null, "transform" );
           }
         inksage_labelvec[lbv].min = parseFloat ( inksage_labelvec[lbv].min );
         inksage_labelvec[lbv].max = parseFloat ( inksage_labelvec[lbv].max );
         
         // encotra o objeto clone "use"
         clone = undefined;
         nohs = SVGDoc.getElementsByTagName("use");
         for ( i = 0; i < nohs.length; i++ )
           {
           if ( nohs.item(i).getAttributeNS( "http://www.w3.org/1999/xlink", "href" ) == ( "#" + item.getAttributeNS( null, "id" ) ) )
             {
             clone = nohs.item(i);
             inksage_labelvec[lbv].clone = clone; 
             break;  
             }
           }
         if ( clone != undefined )
           {
           clone.style.display = "none"; // esconde o objeto clone
           var clonetfm = clone.getAttributeNS( null, "transform" );
           var st1 = clonetfm.indexOf("(");
           var st2 = clonetfm.indexOf(",");
           var st3 = clonetfm.indexOf(")");
           inksage_labelvec[lbv].rangex = parseFloat(clonetfm.substring( st1 + 1, st2 ));
           inksage_labelvec[lbv].rangey = parseFloat(clonetfm.substring( st2 + 1, st3 ));
           }
         break;               
      case "zoom":
         // quando o objeto for clicado, amplia e apaga o objeto clicado (desobstrui a área).
         bb = item.getBoundingClientRect();
         item.setAttributeNS( null, "onclick", 
                              " top.WebSAGE.g_zpX = " + ( bb.left ) + 
                              ";top.WebSAGE.g_zpY = " + ( bb.top ) + 
                              ";top.WebSAGE.g_zpW = " + ( bb.width * 2.0  ) +
                              ";top.WebSAGE.g_zpH = " + ( bb.height * 2.0 ) +
                              ";top.WebSAGE.zoomPan(10);evt.currentTarget.style.display='none';"
                            );  
         break;               
      case "script":
         for ( i = 0; i < inksage_labelvec[lbv].list.length; i++ )
           { 
           item.setAttributeNS( null, "on" + inksage_labelvec[lbv].list[i].evt, "thisobj=evt.currentTarget;" + inksage_labelvec[lbv].list[i].param ); 
           }
         break;               
      case "text":
         break;
      case "clone": // só presente em objetos agrupados
         break;
      default:
         break;          
      }

    WebSAGE.InkSage.push( inksage_labelvec[lbv] ); // salva para posterior processamento
    }          
  }
},

preprocessaTela: function()
{
  var cnt = 0;
  var val;
  var tipo;
  var nohs;
  var i;
  var j;
  var rtdacmd;
  var rtdashcor;
  var rtdatxtstonoff;
  
  WebSAGE.doResize();
  
    if ( SVGDoc === null )
       { 
         return; 
       }
    
    // Para as telas editadas no GLIPS Graffiti (Scada) Editor (http://glipssvgeditor.sourceforge.net/)
    
    // Obtem a Lista de pontos RTDA, objeto float
    nohs = SVGDoc.getElementsByTagNameNS("http://www.itris.fr/2003/animation","tag.float");
    for ( i = 0; i < nohs.length; i++ )
      {
      val = nohs.item(i).id || nohs.item(i).attributes[0].value; // a primeira forma funciona no IE, a outra no FF
      if ( val.substr(0,3)=='NPT' || val.substr(0,3)=='PNT' || val.substr(0,3)=='ALM' || val.substr(0,3)=='TMP' )
        {
        val = val.substr(3,22);
        WebSAGE.acrescentaPontoLista( val );
        }
      }  
      
    // Obtem a Lista de pontos RTDA, objeto enumerado (para os digitais)
    nohs = SVGDoc.getElementsByTagNameNS("http://www.itris.fr/2003/animation","tag.enumerated");
    // top.nohs=nohs;
    for ( i = 0; i < nohs.length; i++ )
      {
      val = nohs.item(i).id || nohs.item(i).attributes[0].value; // a primeira forma funciona no IE, a outra no FF
      if ( val.substr(0,3)=='NPT' || val.substr(0,3)=='PNT' || val.substr(0,3)=='ALM' || val.substr(0,3)=='TMP' )
        {
        val = val.substr(3,22);
        WebSAGE.acrescentaPontoLista( val );
        }
      }
      
    // processa primeiro os grupos por causa dos clones nas tags do inkscape SAGE
    nohs = SVGDoc.getElementsByTagName("g");  
    for ( i = 0; i < nohs.length; i++ )
      { 
        WebSAGE.le_inkscapeSAGETags( nohs.item(i) ); 
      }
     
    // trata os objetos text do SVG em busca dos TAGS dos pontos associados     
    nohs = SVGDoc.getElementsByTagName("text");
    var cntmed = 0;
    var cnttxtst = 0;
    var cntjs = 0;
    var txtbg;
 
    try 
    {   
    for ( i = 0; i < nohs.length; i++ )
      {
      WebSAGE.le_inkscapeSAGETags( nohs.item(i) );
      
      var rtdamed = nohs.item(i).getElementsByTagNameNS("http://www.itris.fr/2003/animation","measureText");
      var rtdacor = nohs.item(i).getElementsByTagNameNS("http://www.itris.fr/2003/animation","colorOnMeasure");
      var rtdatxtst = nohs.item(i).getElementsByTagNameNS("http://www.itris.fr/2003/animation","label");
      var rtdatxtstcor = nohs.item(i).getElementsByTagNameNS("http://www.itris.fr/2003/animation","colorOnState");      

      // evita que o duplo-clique selecione o texto, no IE apareceria com letra branca (como falhado) 
      nohs.item(i).setAttributeNS( null,"poiter-events","none");
            
      rtdacmd = nohs.item(i).getElementsByTagNameNS("http://www.itris.fr/2003/animation","runApplication");
      for ( j = 0; j < rtdacmd.length; j++ )
        {
        WebSAGE.RTDA_JSItems[cntjs] = nohs.item(i);
        WebSAGE.RTDA_JSCode[cntjs] = leftTrim(rtdacmd.item(j).getAttributeNS(null,"command"));
        WebSAGE.RTDA_JSEvent[cntjs] = leftTrim(rtdacmd.item(j).getAttributeNS(null,"confirmationDialog"));
        if ( WebSAGE.RTDA_JSCode[cntjs] != "" )
          { cntjs++; }
        }
      
      if ( rtdamed.length > 0 )
        {
        val = rtdamed.item(0).getAttributeNS(null,"tag").substr(3,22);
        WebSAGE.RTDA_MedsFmt[cntmed] = rtdamed.item(0).getAttributeNS(null,"pattern");
        WebSAGE.RTDA_MedsFillOk[cntmed] = nohs.item(i).style.getPropertyValue("fill");
        WebSAGE.RTDA_MedsFillInv[cntmed] = "rgb(80%,80%,80%);";
      
        // mata todos os textos para evitar dos childNodes, depois vou escrever só no último
        for ( j = 0; j < nohs.item(i).childNodes.length; j++ )
          {
          if ( nohs.item(i).childNodes.item(j).nodeValue!= null && 
              leftTrim(nohs.item(i).childNodes.item(j).nodeValue)!=""  )
            {
            txtbg = nohs.item(i).childNodes.item(j).nodeValue;   
            nohs.item(i).childNodes.item(j).nodeValue = "";
            }
          }
        }

      if ( rtdacor.length > 0 )
        {
        if ( rtdamed.length == 0 )
          { 
            val = rtdacor.item(0).getAttributeNS(null,"tag").substr(3,22); 
          }
        WebSAGE.RTDA_MedsFillInv[cntmed]=rtdacor.item(0).getAttributeNS(null,"invalidValueFill");
        }

      if ( rtdamed.length > 0 || rtdacor.length > 0 )
         {
         nohs.item(i).style.cursor = "pointer"; 	
         WebSAGE.RTDA_MedsItems[cntmed] = nohs.item(i);
         WebSAGE.RTDA_MedsNptos[cntmed] = val;
         
         WebSAGE.produzEtiq( WebSAGE.RTDA_MedsItems[cntmed], val );
         nohs.item(i).childNodes.item(0).nodeValue = txtbg;
         WebSAGE.produzDestaq( WebSAGE.RTDA_MedsItems[cntmed], val );
         WebSAGE.produzRelac( WebSAGE.RTDA_MedsItems[cntmed], val );
         nohs.item(i).childNodes.item(0).nodeValue = "";

         cntmed++;
         
         // prepara evento para quando clicado abrir janela info
         nohs.item(i).setAttributeNS( null, "onclick", WebSAGE.g_obj_onclick.replace(/PONTO/g, val) );
         }
         
      if ( rtdatxtst.length > 0 )
        {
        nohs.item(i).style.cursor = "pointer"; 	
        rtdatxtstonoff = rtdatxtst.item(0).getElementsByTagNameNS("http://www.itris.fr/2003/animation","value");
        WebSAGE.RTDA_TxtStOff[cnttxtst] = rtdatxtstonoff.item(0).getAttributeNS(null,"text");
        WebSAGE.RTDA_TxtStOn[cnttxtst] = rtdatxtstonoff.item(1).getAttributeNS(null,"text");
        WebSAGE.RTDA_TxtStInv[cnttxtst] = rtdatxtst.item(0).getAttributeNS(null,"invalidText");
        
        val = rtdatxtst.item(0).getAttributeNS(null,"tag").substr(3,22);
        tipo = rtdatxtst.item(0).getAttributeNS(null,"tag").substr(0,3);
        
        WebSAGE.RTDA_TxtStFillEstOn[cnttxtst] = "rgb(80%,0%,0%)";
        WebSAGE.RTDA_TxtStFillEstOff[cnttxtst] = "rgb(0%,80%,0%)";
        WebSAGE.RTDA_TxtStFillInv[cnttxtst] = "rgb(80%,80%,80%)";

        // mata todos os textos para evitar dos childNodes, depois vou escrever só no último
        for ( j = 0; j < nohs.item(i).childNodes.length; j++ )
          {
            if ( nohs.item(i).childNodes.item(j).nodeValue != null && 
                 leftTrim(nohs.item(i).childNodes.item(j).nodeValue) != "" )
            {
            txtbg = nohs.item(i).childNodes.item(j).nodeValue;   
            nohs.item(i).childNodes.item(j).nodeValue = "";
            }
          }
        }

      if ( rtdatxtstcor.length > 0 )
        {
        nohs.item(i).style.cursor = "pointer"; 	
        if ( rtdatxtst.length == 0 )
          {
          val = rtdatxtstcor.item(0).getAttributeNS(null,"tag").substr(3,22);
          tipo = rtdatxtstcor.item(0).getAttributeNS(null,"tag").substr(0,3);
          WebSAGE.RTDA_TxtStOff[cnttxtst] = nohs.item(i).childNodes.item(0).nodeValue;
          WebSAGE.RTDA_TxtStOn[cnttxtst] = nohs.item(i).childNodes.item(0).nodeValue;
          WebSAGE.RTDA_TxtStInv[cnttxtst] = nohs.item(i).childNodes.item(0).nodeValue;
          }

        var rtdatxtstcoronoff = rtdatxtstcor.item(0).getElementsByTagNameNS("http://www.itris.fr/2003/animation","state");
        if ( rtdatxtstcoronoff.length > 1 )
           {
           WebSAGE.RTDA_TxtStFillEstOff[cnttxtst] = rtdatxtstcoronoff.item(0).getAttributeNS(null,"fill");
           WebSAGE.RTDA_TxtStFillEstOn[cnttxtst] = rtdatxtstcoronoff.item(1).getAttributeNS(null,"fill");
           } 

        WebSAGE.RTDA_TxtStFillInv[cnttxtst] = rtdatxtstcor.item(0).getAttributeNS(null,"invalidValueFill");
        }

      if ( rtdatxtst.length > 0 || rtdatxtstcor.length > 0 )
         {
         WebSAGE.RTDA_TxtStItems[cnttxtst] = nohs.item(i);
         WebSAGE.RTDA_TxtStNptos[cnttxtst] = val;
         WebSAGE.RTDA_TxtStTipos[cnttxtst] = tipo;

         WebSAGE.produzEtiq( WebSAGE.RTDA_TxtStItems[cnttxtst], val );
         nohs.item(i).childNodes.item(0).nodeValue = txtbg;
         WebSAGE.produzDestaq( WebSAGE.RTDA_TxtStItems[cnttxtst], val );
         WebSAGE.produzRelac( WebSAGE.RTDA_TxtStItems[cnttxtst], val );
         nohs.item(i).childNodes.item(0).nodeValue = "";
         
         cnttxtst++;
         
         // prepara evento para quando pressionado SHIFT+CLICK abrir janela de comando
         nohs.item(i).setAttributeNS( null,"onclick", WebSAGE.g_obj_onclick.replace(/PONTO/g, val) );
         }
          
      }
    }
    catch ( err )
    {
      $('#SP_STATUS').text( "Erro na tela!" + " [4]" );
      document.getElementById("SP_STATUS").title = err.stack;
    }      

    // shapes     
    nohs = [];
    var tmp;
    tmp = SVGDoc.getElementsByTagName( "rect" );
    for ( i = 0; i < tmp.length; i++ ) 
      { nohs.push( tmp.item(i) ); }
    tmp = SVGDoc.getElementsByTagName( "ellipse" );
    for ( i = 0; i < tmp.length; i++ ) 
      { nohs.push( tmp.item(i) ); }
    tmp = SVGDoc.getElementsByTagName( "path" );
    for ( i = 0; i < tmp.length; i++ ) 
      { nohs.push( tmp.item(i) ); }
    tmp = SVGDoc.getElementsByTagName( "image" );
    for ( i = 0; i < tmp.length; i++ ) 
      { nohs.push( tmp.item(i) ); }
    tmp = SVGDoc.getElementsByTagName( "g" );
    for ( i = 0; i < tmp.length; i++ ) 
      { nohs.push( tmp.item(i) ); }

    var cntshst = 0;
    var rtdashcoronoff, rtdashvis, rtdashvisonoff;
    
    for ( i = 0; i < nohs.length; i++ )
      {
      if ( nohs[i].nodeName != "g" )  // grupos já foram processados no início
        { 
          WebSAGE.le_inkscapeSAGETags( nohs[i] ); 
        }

      rtdashcor = nohs[i].getElementsByTagNameNS("http://www.itris.fr/2003/animation","colorOnState");
      
      rtdacmd=nohs[i].getElementsByTagNameNS("http://www.itris.fr/2003/animation","runApplication");
      for ( j = 0; j < rtdacmd.length; j++ )
        {
        WebSAGE.RTDA_JSItems[cntjs] = nohs[i];
        WebSAGE.RTDA_JSCode[cntjs] = leftTrim(rtdacmd.item(j).getAttributeNS(null,"command"));
        WebSAGE.RTDA_JSEvent[cntjs] = leftTrim(rtdacmd.item(j).getAttributeNS(null,"confirmationDialog"));
        if ( WebSAGE.RTDA_JSCode[cntjs] != "" )
          { 
            cntjs++; 
          }
        }
      
      if ( rtdashcor.length > 0 )
        {
         val = rtdashcor.item(0).getAttributeNS(null,"tag").substr(3,22);
         tipo = rtdashcor.item(0).getAttributeNS(null,"tag").substr(0,3);
         rtdashcoronoff = rtdashcor.item(0).getElementsByTagNameNS("http://www.itris.fr/2003/animation","state");
         if ( rtdashcoronoff.length > 1 )
           {
           WebSAGE.RTDA_ShpFillEstOff[cntshst] = rtdashcoronoff.item(0).getAttributeNS(null,"fill");
           WebSAGE.RTDA_ShpFillEstOn[cntshst] = rtdashcoronoff.item(1).getAttributeNS(null,"fill");
           WebSAGE.RTDA_ShpStrokeEstOff[cntshst] = rtdashcoronoff.item(0).getAttributeNS(null,"stroke");
           WebSAGE.RTDA_ShpStrokeEstOn[cntshst] = rtdashcoronoff.item(1).getAttributeNS(null,"stroke");
           }          

         WebSAGE.RTDA_ShpVisEstOff[cntshst] = "";
         WebSAGE.RTDA_ShpVisEstOn[cntshst] = "";
         WebSAGE.RTDA_ShpFillInv[cntshst] = rtdashcor.item(0).getAttributeNS(null,"invalidValueFill");
         WebSAGE.RTDA_ShpStrokeInv[cntshst] = rtdashcor.item(0).getAttributeNS(null,"invalidValueStroke");
         
         // prepara evento para quando pressionado SHIFT+CLICK abrir janela de comando
         nohs[i].setAttributeNS( null,"onclick",WebSAGE.g_obj_onclick.replace(/PONTO/g, val) );
         }
      
      rtdashvis = nohs[i].getElementsByTagNameNS("http://www.itris.fr/2003/animation","attributeOnState");
      if ( rtdashvis.length > 0 )
        {
         if ( rtdashcor.length == 0 )
           {
           WebSAGE.RTDA_ShpFillEstOff[cntshst] = "rgb(0%,80%,0%)";
           WebSAGE.RTDA_ShpFillEstOn[cntshst] = "rgb(80%,0%,0%)";
           WebSAGE.RTDA_ShpFillInv[cntshst] = "rgb(80%,80%,80%)";
           WebSAGE.RTDA_ShpStrokeEstOff[cntshst] = "rgb(0%,80%,0%)";
           WebSAGE.RTDA_ShpStrokeEstOn[cntshst] = "rgb(80%,0%,0%)";
           WebSAGE.RTDA_ShpStrokeInv[cntshst] = "rgb(80%,80%,80%)";
           }
           
         rtdashvisonoff = rtdashvis.item(0).getElementsByTagNameNS("http://www.itris.fr/2003/animation","state");
         if ( rtdashvisonoff.length > 1 )
           {
           WebSAGE.RTDA_ShpVisEstOff[cntshst] = rtdashvisonoff.item(0).getAttributeNS(null,"attributeValue1");
           WebSAGE.RTDA_ShpVisEstOn[cntshst] = rtdashvisonoff.item(1).getAttributeNS(null,"attributeValue1");
           }
        } 

      if ( rtdashcor.length > 0 || rtdashvis.length > 0 )
         {
         WebSAGE.RTDA_ShpItems[cntshst] = nohs[i];
         WebSAGE.RTDA_ShpNptos[cntshst] = val;
         WebSAGE.RTDA_ShpTipos[cntshst] = tipo;
         cntshst++;
         }
      }

    // Para as telas do conversor da Rosana para as telas do SAGE para o formato SVG        
                   
    // Medidas
    nohs = SVGDoc.getElementsByTagName("text");
        
    for ( i = 0; i < nohs.length; i++ )
      {
      if ( typeof( nohs.item(i).id ) === "string"  )
      if ( nohs.item(i).id.substr(0,3) === 'PNT' )
        {
        val = nohs.item(i).id.substr(3,22);

        WebSAGE.C[val] = nohs.item(i).style.fill;
        WebSAGE.T[val] = nohs.item(i).childNodes.item(0).nodeValue;
          
        WebSAGE.produzDestaq( nohs.item(i), val );
        WebSAGE.produzRelac( nohs.item(i), val );
        // para as medidas a etiqueta atrolha muito, fica por cima das medidas, não vou usar
        // WebSAGE.produzEtiq(nohs.item(i), val);

        nohs.item(i).childNodes.item(0).nodeValue = "";
        nohs.item(i).style.cursor = "pointer";

        // prepara evento para quando pressionado SHIFT+CLICK abrir janela de comando
        nohs.item(i).setAttributeNS( null,"onclick",WebSAGE.g_obj_onclick.replace(/PONTO/g, val) );
          
        nohs.item(i).setAttributeNS( "http://www.w3.org/XML/1998/namespace","xml:space","preserve" );  // preserva os espaços no texto SVG, melhora o alinhamento das medidas

        WebSAGE.acrescentaPontoLista( val );
        cnt++;
        }
      else
        { // trata texto comum
//       string1=nohs.item(i).getAttributeNS(null,"style");
//       if ( string1.substring( string1.indexOf("fill:white")) ||
//            string1.substring( string1.indexOf("fill:rgb(100%,100%,100%)")) 
//          )
//         nohs.item(i).setAttributeNS(null,"style","fill:rgb(85%,85%,85%)");         
        }   
      }

    // Disjuntores
    nohs = SVGDoc.getElementsByTagName( "rect" );
    for ( i = 0; i < nohs.length; i++ )
      {
      if ( i == 0 )
        { WebSAGE.RectFundo = nohs.item(i); }

      if ( nohs.item(i).id !== undefined )
      if ( typeof( nohs.item(i).id ) === "string"  )
      if ( nohs.item(i).id.substr(0,3) === 'PNT' )
          {
          // marca disjuntores com a cor manual
          nohs.item(i).setAttributeNS(null,"style","fill:rgb(60%,0%,71%)");
          nohs.item(i).style.cursor = "pointer";

          val=nohs.item(i).id.substr(3,22);

          // prepara evento para quando pressionado SHIFT+CLICK abrir janela de comando
          nohs.item(i).setAttributeNS( null,"onclick",WebSAGE.g_obj_onclick.replace(/PONTO/g, val) );
          
          WebSAGE.produzEtiq( nohs.item(i), val );
          WebSAGE.produzDestaq( nohs.item(i), val );
          WebSAGE.produzRelac( nohs.item(i), val );
      
          WebSAGE.acrescentaPontoLista( val );
          cnt++;
         }
      }
    
	  // Seccionadoras	
    nohs = SVGDoc.getElementsByTagName("g");
    for ( i = 0; i < nohs.length; i++ )
      {
      // 
      if ( typeof( nohs.item(i).id ) === "string"  )
      if ( nohs.item(i).id.substr(0,3) === 'PNT' )
         {
         // Não remover estes comentários!
         //
         //
         //
         // Bug do Firefox, só aparece na tela da CIN        
          //if (nohs.item(i).id=="PNT9380")
            // alert(nohs.item(i).childNodes.item(3));  
          // PONTO__ = nohs.item(i).childNodes.item(3); // FAZ FUNCIONAR COM O FIREFOX A TELA DE CIN! Não pergunta pq
          
          if ( BrowserDetect.browser != 'Explorer' )
          if ( typeof nohs.item(i).childNodes.item(3).setAttributeNS != 'function' || 
               typeof nohs.item(i).childNodes.item(5).setAttributeNS != 'function' )
            { continue; }
             
          // marca todas inicialmente com a cor manual
          nohs.item(i).childNodes.item(3).setAttributeNS(null,"style","stroke:rgb(60%,0%,71%)");
          nohs.item(i).childNodes.item(5).setAttributeNS(null,"style","fill-opacity:0;stroke-opacity:0");
          nohs.item(i).style.cursor = "pointer";
 
          val=nohs.item(i).id.substr(3,22);

          WebSAGE.produzEtiq( nohs.item(i).childNodes.item(7), val );
          WebSAGE.produzDestaq( nohs.item(i).childNodes.item(7), val );
          WebSAGE.produzRelac( nohs.item(i).childNodes.item(7), val );

          // prepara evento para quando pressionado SHIFT+CLICK abrir janela de comando ou info
          nohs.item(i).setAttributeNS( null,"onclick",WebSAGE.g_obj_onclick.replace(/PONTO/g, val) );

          WebSAGE.acrescentaPontoLista( val );
          cnt++;
         }
      }

  // Código embutido na tela, prepara os event handlers, trata onload
  for ( i = 0; i < WebSAGE.RTDA_JSItems.length; i++ )
    { 
    var thisobj = WebSAGE.RTDA_JSItems[i];
    if ( WebSAGE.RTDA_JSEvent[i] != "")
      {
      if ( WebSAGE.RTDA_JSEvent[i] == 'onload' ) // evento de onload, apenas executa na primeira
        {
        try 
          { 
            eval( WebSAGE.RTDA_JSCode[i] ); 
          }
        catch ( err ) 
          {
            $('#SP_STATUS').text( err.name + ": " + err.message + " [5]" ); 
            document.getElementById("SP_STATUS").title = err.stack;
          }
        }
      else  
        { 
          thisobj.setAttributeNS( null, WebSAGE.RTDA_JSEvent[i], "thisobj=evt.currentTarget;" + WebSAGE.RTDA_JSCode[i] ); 
        }
      }
    }

  // ajusta as cores de fundo, no SVG e no HTML, após descobrir o rectFundo
  WebSAGE.setaCorFundo( VisorTelas_BackgroundSVG );
},

callServer : function () 
{
  if ( $('#timemachinecontrols').css('display') != "none" ) // vê se timemachine está ativo
    { 
    return; 
    }

  var cnt = 0;
  var val;
  var tipo;
  var nohs;

  // o argumento PASS é só para mudar a URL de forma a que o cache não seja usado pelo IE

  Data = ''; // apaga data, vai ser atualizada pelo script abaixo

  WebSAGE.g_timeoutFalhaID = setTimeout( WebSAGE.falhaTudo, WebSAGE.g_timeOutFalha );

  // pede dados de tempo real ao servidor, con informações sobre os pontos na primeira vez
  // asks for real time data from the server, with point info on the first time
  WebSAGE.getScript( WebSAGE.g_remoteServer + 
                    '?P=' + WebSAGE.lstpnt +
                    '&B=WebSAGE.showValsSVG' +  
                    '&I=' +  ( WebSAGE.Pass === 0  ? 1 : 0 ) +
                    '&PS=' + WebSAGE.Pass );

  // vou testar, na metade do tempo, o status do webserver para ver se houve alguma mudança 
  WebSAGE.g_toutStatusID = setTimeout( WebSAGE.getServerStatus, WebSAGE.g_timeOutRefresh / 2 );
  // próximo refresh
  WebSAGE.g_toutID = setTimeout( WebSAGE.callServer, WebSAGE.g_timeOutRefresh );
  WebSAGE.Pass++;    
},

// pega status do servidor, variável HA_ALARMES
getServerStatus: function()
{
  WebSAGE.getScript( WebSAGE.g_remoteServer + '?M=1&B=WebSAGE.cbf_Status' );  
},

cbf_Status: function()
{
  // se mudou estado de alarme, vou atualizar lista logo
  if ( NUM_VAR_ANT != NUM_VAR )
    {
    clearTimeout( WebSAGE.g_timeoutFalhaID );  
    clearTimeout( WebSAGE.g_toutID );
    WebSAGE.g_toutID = setTimeout( WebSAGE.callServer, 100 );
    }

  HA_ALARMES_ANT = HA_ALARMES;
  NUM_VAR_ANT = NUM_VAR;
},

blinkSeAlarmado: function(tag, item)
{
if ( typeof ( item.allowblink ) != 'undefined' )  
if ( !item.allowblink )  
  { 
    return; 
  }
  
if ( F[tag] & 0x100 ) // alarme
  {
  if ( (F[tag] & 0x20) == 0 ) // testa o tipo 
      { 
        if ( WebSAGE.g_blinkList.indexOf(item) === -1 )
          WebSAGE.g_blinkList.push( item ); 
      }
  else  
      { 
        if ( WebSAGE.g_blinkListAna.indexOf(item) === -1 )
          WebSAGE.g_blinkListAna.push( item ); 
      }
  }
},

// Substitui os conteudos objeto com ID=PNTnumero no SVG, ex: ID=PNT8056
showValsSVG: function()
{
var i, j;
var mudou_ana = WebSAGE.g_sha1ant_ana=='' || WebSAGE.g_sha1ant_ana!=Sha1Ana;
var mudou_dig = WebSAGE.g_sha1ant_dig=='' || WebSAGE.g_sha1ant_dig!=Sha1Dig;

  // guarda os hashes anteriores para detecção de mudanças de valores
  WebSAGE.g_sha1ant_ana = Sha1Ana;
  WebSAGE.g_sha1ant_dig = Sha1Dig;

  if ( WebSAGE.Pass == 1 ) // depois de ter a lista de valores de pontos, lista os objetos que tem ponto e destaque associados
      { 
        WebSAGE.listaDestacaveis(); 
      }

  WebSAGE.g_data_ant = Data;
   
  clearTimeout( WebSAGE.g_timeoutFalhaID );  

  var embed = document.getElementById('svgid');
  try 
    {
    SVGDoc = embed.getSVGDocument();
    embed = null;
    }
  catch( exception ) 
    {
    alert( Msg.ConfNSuport );
    return;
    }

// Para as telas editadas no GLIPS Graffiti (Scada) Editor (http://glipssvgeditor.sourceforge.net/)

// Código embutido na tela
for ( i = 0; i < WebSAGE.RTDA_JSItems.length; i++ )
  { 
  var thisobj = WebSAGE.RTDA_JSItems[i];
  if ( WebSAGE.RTDA_JSEvent[i] != "" )
    {
    // thisobj.setAttributeNS(null,WebSAGE.RTDA_JSEvent[i],"thisobj=evt.currentTarget;"+WebSAGE.RTDA_JSCode[i]);
    }
  else  
    {
    try 
      { 
        eval( WebSAGE.RTDA_JSCode[i] ); 
      }
    catch ( err ) 
      { 
        $('#SP_STATUS').text( err.name + ": " + err.message + " [6]" );
        document.getElementById("SP_STATUS").title = err.stack;
      }
    }    
  }

// MEDIDAS
// para cada elemento "text" contendo a tag RTDA.
var attr;
var cor;
var fill;
var stroke;
var attrib;
var attribval;
var vis; 
var x;
var flind;
var bb;
var ft;

if ( mudou_ana ) // se tem não tem hash ou mudou, atualiza
  {
  // coloca toda lista de objetos piscantes com opacidade 1
  for ( i = 0; i < WebSAGE.g_blinkListAna.length; i++ )
    {
    WebSAGE.g_blinkListAna[i].setAttributeNS( null, "opacity", 1 );
    }
  WebSAGE.g_blinkListAna.length = 0; // esvazia blink list
  WebSAGE.g_blinkcnt = 1;
  
  for ( i = 0; i < WebSAGE.RTDA_MedsItems.length; i++ )
    {
    x = WebSAGE.RTDA_MedsNptos[i];
      
    attr = WebSAGE.interpretaFormatoC( WebSAGE.RTDA_MedsFmt[i], x );
    if ( attr != WebSAGE.RTDA_MedsItems[i].textContent )  
      { 
        WebSAGE.RTDA_MedsItems[i].textContent = attr; 
      }
    
    // cor
    if ( F[x] & 0x80 ) // falha?
      { 
        attr = WebSAGE.RTDA_MedsFillInv[i]; 
      }
    else    
      { 
        attr = WebSAGE.RTDA_MedsFillOk[i]; 
      }
  
    if ( attr != WebSAGE.RTDA_MedsItems[i].style.getPropertyValue("fill") )
      { 
        WebSAGE.RTDA_MedsItems[i].style.setProperty("fill",attr,""); 
      }
    }
  }
  
if ( mudou_dig ) // se tem não tem hash ou mudou, atualiza
  {
  // coloca toda lista de objetos piscantes com opacidade 1
  for ( i = 0; i < WebSAGE.g_blinkList.length; i++ )
    {
    WebSAGE.g_blinkList[i].setAttributeNS(null,"opacity",1);
    }
  WebSAGE.g_blinkList.length = 0; // esvazia blink list
  WebSAGE.g_blinkcnt = 1;
  
  // TEXTOS DE ESTADOS
  for ( i = 0; i < WebSAGE.RTDA_TxtStItems.length; i++ )
    {
    x = WebSAGE.RTDA_TxtStNptos[i];
    flind = 0;
  
    if ( WebSAGE.RTDA_TxtStTipos[i] === 'ALM')
      { // testa nao normal ou alarmado 
      if ( (F[x] & 0x800) || (F[x] & 0x100) )
        {
        attr = WebSAGE.RTDA_TxtStOn[i];
        cor = WebSAGE.RTDA_TxtStFillEstOn[i];
        }
      else  
        {
        attr = WebSAGE.RTDA_TxtStOff[i];
        cor = WebSAGE.RTDA_TxtStFillEstOff[i];
        } 
      }
    else
    if ( WebSAGE.RTDA_TxtStTipos[i] === 'TMP')
      {
      attr = T[x];
      cor = '';
      }
    else
      {
      if ( (F[x] & 0x03) === 0x02 )
        { 
          attr = WebSAGE.RTDA_TxtStOn[i]; 
        }
      if ( (F[x] & 0x03) === 0x01)
        { 
          attr = WebSAGE.RTDA_TxtStOff[i]; 
        }
      if ( (F[x] & 0x03) === 0x00 )
        { 
          attr = Msg.QDPIntermed;flind=1; 
        }
      if ( (F[x] & 0x03) === 0x03 )
        { 
          attr = Msg.QDPInvalido;flind=1; 
        }
        
      if ( (F[x] & 0x02) === 0x02 )
        { 
          cor = WebSAGE.RTDA_TxtStFillEstOn[i]; 
        }
      else  
        { 
          cor = WebSAGE.RTDA_TxtStFillEstOff[i]; 
        }
      }      
  
    if ( F[x] & 0x80 )    
    if ( WebSAGE.RTDA_TxtStInv[i] !=  "" )
      { 
        attr = WebSAGE.RTDA_TxtStInv[i]; 
      }
       
    if ( attr != WebSAGE.RTDA_TxtStItems[i].textContent )
      { 
        WebSAGE.RTDA_TxtStItems[i].textContent = attr; 
      }
    
    WebSAGE.visibEtiq( x );

    // cor
    if ( (F[x] & 0x80) || flind === 1 ) // cor de falha?
       { 
         cor = WebSAGE.RTDA_TxtStFillInv[i]; 
       }
  
    if ( cor != WebSAGE.RTDA_TxtStItems[i].style.getPropertyValue("fill") && cor != ''  )
      { 
        WebSAGE.RTDA_TxtStItems[i].style.setProperty("fill",cor,""); 
      }
      
    if ( F[x] & 0x100 ) // alarme
      { 
        if ( WebSAGE.g_blinkList.indexOf( WebSAGE.RTDA_TxtStItems[i] ) === -1 )
          WebSAGE.g_blinkList.push( WebSAGE.RTDA_TxtStItems[i] ); 
      }
    }
    
  // SHAPES
  for ( i = 0; i < WebSAGE.RTDA_ShpItems.length; i++ )
    { 
    x = WebSAGE.RTDA_ShpNptos[i];
  
    if ( WebSAGE.RTDA_ShpTipos[i] === 'ALM')
    {
    // cor
    // testa nao normal ou alarmado 
       if ( (F[x] & 0x800) || (F[x] & 0x100) )
         {
         fill = WebSAGE.RTDA_ShpFillEstOn[i];
         stroke = WebSAGE.RTDA_ShpStrokeEstOn[i];
         }
       else  
         {
         fill = WebSAGE.RTDA_ShpFillEstOff[i];
         stroke = WebSAGE.RTDA_ShpStrokeEstOff[i];
         }
    }   
    else
    {
    // cor
       if ( (F[x] & 0x03) === 0x02)
         {
         fill = WebSAGE.RTDA_ShpFillEstOn[i];
         stroke = WebSAGE.RTDA_ShpStrokeEstOn[i];
         }
       else  
         {
         fill = WebSAGE.RTDA_ShpFillEstOff[i];
         stroke = WebSAGE.RTDA_ShpStrokeEstOff[i];
         }
    }        
  
    if ( (F[x] & 0x80) || (F[x] & 0x03) === 0x00 || (F[x] & 0x03) === 0x03 ) // falha?
       {
       if ( WebSAGE.RTDA_ShpFillInv[i] != "" )
         { 
           fill = WebSAGE.RTDA_ShpFillInv[i]; 
         }
       if ( WebSAGE.RTDA_ShpStrokeInv[i] != "" )
         { 
           stroke = WebSAGE.RTDA_ShpStrokeInv[i]; 
         }
       }
    
    if ( fill != WebSAGE.RTDA_ShpItems[i].style.getPropertyValue("fill") )
      { 
        WebSAGE.RTDA_ShpItems[i].style.setProperty( "fill", fill, ""); 
      }
  
    if ( stroke != WebSAGE.RTDA_ShpItems[i].style.getPropertyValue("stroke") )
      { 
        WebSAGE.RTDA_ShpItems[i].style.setProperty("stroke",stroke,""); 
      }
  
    if ( (F[x] & 0x02) === 0x02 )
      { 
        vis = WebSAGE.RTDA_ShpVisEstOn[i]; 
      }
    else  
      { vis = WebSAGE.RTDA_ShpVisEstOff[i]; }
  
    if ( F[x] & 0x100 ) // alarme
      { 
        if ( WebSAGE.g_blinkList.indexOf( WebSAGE.RTDA_ShpItems[i] ) === -1 )
          WebSAGE.g_blinkList.push(WebSAGE.RTDA_ShpItems[i]); 
      }
  
    if ( vis != WebSAGE.RTDA_ShpItems[i].style.getPropertyValue("visibility") )
      { 
        WebSAGE.RTDA_ShpItems[i].style.setProperty("visibility",vis,""); 
      }
    }
  }
  
// Para as telas do conversor da Rosana para as telas do SAGE para o formato SVG
var elem;
var borda, preen;

for ( x in V )
  {

  if ( (F[x] & 0x20) === 0 ) // testa o tipo 
    { // digital

    if ( !mudou_dig ) // se tem não tem hash ou mudou, atualiza
      { 
        continue; 
      }

    elem = SVGDoc.getElementById( 'PNT' + x );
    if  ( elem === null )
      { 
        continue; 
      }
    
    // testa se é seccionadora
    if  ( elem.tagName === "g" )
      {  // seccionadora
      if ( F[x] & 0x01 ) 
        {
        elem = elem.childNodes.item(3); // seccionadora aberta
        SVGDoc.getElementById( 'PNT' + x ).childNodes.item(5).setAttributeNS(null,"style","fill-opacity:0;stroke-opacity:0"); // seccionadora fechada
        elem.setAttributeNS( null, "style", VisorTelas_SC_Aberta ); // normal
        }
      else
        {
        elem = elem.childNodes.item(5); // seccionadora fechada
        SVGDoc.getElementById( 'PNT' + x ).childNodes.item(3).setAttributeNS(null,"style","fill-opacity:0;stroke-opacity:0"); // seccionadora aberta
        elem.setAttributeNS( null, "style", VisorTelas_SC_Fechada ); // normal
        }
      
      WebSAGE.visibEtiq( x );
       
      if ( (F[x] & 0x80) || (F[x] & 0x03) === 0x00 || (F[x] & 0x03) === 0x03 ) // é falhado, inválido ou indeterminado
        { 
          elem.setAttributeNS( null, "style", VisorTelas_SC_Falha ); 
        }

      if ( F[x] & 0x100 ) // alarme
        { 
          if ( WebSAGE.g_blinkList.indexOf( elem ) === -1 )
            WebSAGE.g_blinkList.push( elem ); 
        }

      if ( (F[x] & 0x10) || (F[x] & 0x0C) === 0x0C ) // é manual ou substituído
        { 
          elem.setAttributeNS( null, "style", VisorTelas_SC_Manual); 
        }
        
      // if ( (F[x] & 0x400) ) // se está inibido, fica amarelo
      //  { elem.style.stroke=VisorTelas_CorAlarmeInibido; }
      }
    else
    if  ( elem.tagName === "rect" ) // disjuntor tem que ser retângulo
      {  // disjuntor
      // normal                                        (aberto:fechado)
      borda = (F[x] & 0x01)? VisorTelas_DJ_Normal_Aberto_Borda  : VisorTelas_DJ_Normal_Fechado_Borda; 
      preen = (F[x] & 0x01)? VisorTelas_DJ_Normal_Aberto_Preen  : VisorTelas_DJ_Normal_Fechado_Preen;
      
      if ( (F[x] & 0x80) || (F[x] & 0x03) === 0x00 || (F[x] & 0x03) === 0x03 ) // é falhado, inválido ou indeterminado 
        {
        borda = (F[x] & 0x01)? VisorTelas_DJ_Falha_Aberto_Borda : VisorTelas_DJ_Falha_Fechado_Borda; 
        preen = (F[x] & 0x01)? VisorTelas_DJ_Falha_Aberto_Preen : VisorTelas_DJ_Falha_Fechado_Preen;
        } 

      if ( (F[x] & 0x100) ) // com alarme ?
        { 
          if ( WebSAGE.g_blinkList.indexOf( elem ) === -1 )
            WebSAGE.g_blinkList.push( elem ); 
        }
      
      if ( (F[x] & 0x10) || (F[x] & 0x0C) === 0x0C ) // é manual ou substituído 
        {
        borda = (F[x] & 0x01)? VisorTelas_DJ_Manual_Aberto_Borda : VisorTelas_DJ_Manual_Fechado_Borda; 
        preen = (F[x] & 0x01)? VisorTelas_DJ_Manual_Aberto_Preen : VisorTelas_DJ_Manual_Fechado_Preen;
        } 
      
      WebSAGE.visibEtiq( x );
        
      elem.setAttributeNS( null, "style", borda + preen );

      //if ( (F[x] & 0x400) ) // se está inibido
      //  elem.style.stroke=VisorTelas_CorAlarmeInibido;
        
      elem.style.cursor = "pointer";  
      }
      
    elem = null;
    }
  else
    { // analógico

    if ( !mudou_ana ) // se tem não tem hash ou mudou, atualiza
      { 
        continue; 
      }
    
    elem = SVGDoc.getElementById( 'PNT' + x );
    if  ( elem === null )
      { 
        continue; 
      }

    if  ( elem.tagName === "text" ) // tem que ser objeto texto
      {  
      val = WebSAGE.interpretaFormatoC( WebSAGE.T[x], x );
      if ( val != elem.textContent )  
        { 
          elem.textContent = val; 
        }

      if ( F[x] & 0x80 ) 
        {
        if ( elem.style.getPropertyValue( 'fill' ) !=  VisorTelas_Medidas_Cor_Falha )
          { 
            elem.style.setProperty( 'fill', VisorTelas_Medidas_Cor_Falha, ''); 
          }
        }  
      else
        {
        if ( elem.style.getPropertyValue( 'fill' ) !=  WebSAGE.C[x] )
          { 
            elem.style.setProperty( 'fill', WebSAGE.C[x], ''); 
          }
        }
    
      if ( F[x] & 0x100 ) // alarme
        { 
          if ( WebSAGE.g_blinkListAna.indexOf( elem ) === -1 )
            WebSAGE.g_blinkListAna.push( elem ); 
        }
      }

    elem = null;
    }   
  }

  // Processa as tags do Integraxor / XSAC
  var digital, val, tag, vt;
  
  if ( mudou_ana || mudou_dig) // se mudou algo
  for ( i = 0; i < WebSAGE.InkSage.length; i++ )
  {
    if ( typeof(WebSAGE.InkSage[i].xdone) != 'undefined' )
      continue;
      
    if ( WebSAGE.InkSage[i].tag != undefined )
      {
      tag = WebSAGE.InkSage[i].tag;
      vt = WebSAGE.valorTagueado( tag );
      if ( isInt( tag ) )    
        WebSAGE.visibEtiq( tag );      
      } 

    if ( vt != "????" || WebSAGE.InkSage[i].attr === "color" || WebSAGE.InkSage[i].attr === "set" )
      {  
      switch ( WebSAGE.InkSage[i].attr )
         {
         case "set":
            switch ( WebSAGE.InkSage[i].tag )
               { 
               case "#radar": // radar chart animation
                 for ( j = 0; j < WebSAGE.InkSage[i].parent.pnts.length; j++ )
                   {
                   WebSAGE.InkSage[i].parent.dta[0].axes[j].value = WebSAGE.valorTagueado( WebSAGE.InkSage[i].parent.pnts[j] );
                   WebSAGE.InkSage[i].parent.dta[0].axes[j].axis = BAYS[ WebSAGE.InkSage[i].parent.pnts[j] ] || "";
                   }
                 WebSAGE.InkSage[i].parent.cht.datum( WebSAGE.InkSage[i].parent.dta ).call( WebSAGE.InkSage[i].parent.chart );
                 break;
               }
            break;  
         case "open":
            // graphic plot ?
            if ( WebSAGE.InkSage[i].istag == 1 )
            if ( WebSAGE.InkSage[i].parent.tagName === "rect" )
              {
              var indv, xx, yy, sep;
              var dotlist = "";
              var d = new Date();
              
              // verify value not changing, so abort unnecessary replot. Passed 30 seconds plot it anyway.
              if ( WebSAGE.InkSage[i].valores.length > 0 )
              if ( vt == WebSAGE.InkSage[i].valores[WebSAGE.InkSage[i].valores.length - 1] )
              if ( ((d.getTime() - WebSAGE.InkSage[i].datas[WebSAGE.InkSage[i].datas.length - 1])/1000) < 30 )
                 break;

              WebSAGE.InkSage[i].valores.push( vt );
              WebSAGE.InkSage[i].datas.push( d.getTime() );
              bb = WebSAGE.InkSage[i].bb;
              for ( indv = WebSAGE.InkSage[i].valores.length-1; indv >= 0 ; indv--  )
                {
                var secdif = ( d.getTime() - WebSAGE.InkSage[i].datas[indv] ) / 1000;
                if ( secdif > WebSAGE.InkSage[i].width )
                  { // o tempo ficou muito grande, tira da lista
                    WebSAGE.InkSage[i].valores.splice( indv, 1 );
                    WebSAGE.InkSage[i].datas.splice( indv, 1 );
                  }
                else
                  { // ainda dentro da faixa de tempo determinada, plota
                  xx = bb.right - parseFloat( (( secdif - WebSAGE.InkSage[i].x ) / WebSAGE.InkSage[i].width ) * bb.width );
                  yy = bb.bottom - parseFloat( ( WebSAGE.InkSage[i].valores[indv] - WebSAGE.InkSage[i].y ) / WebSAGE.InkSage[i].height * bb.height );      
                  if ( yy > bb.bottom )       
                    { 
                      yy = bb.bottom; 
                    }
                  if ( yy < bb.top )       
                    { 
                      yy = bb.top; 
                    }
                  sep = indv === 0  ? "" : ",";  
                  dotlist = dotlist + xx.toFixed(3) + " " + yy.toFixed(3) + sep;
                  }
                }
              if ( dotlist.charAt( dotlist.length - 1 ) === ',' )
                {
                dotlist = dotlist.substring( 0, dotlist.length - 1 );
                }
              WebSAGE.InkSage[i].grafico.setAttributeNS( null, 'points', dotlist );  
              }
            break;
         case "get" :  // coloca o valor no texto
            val = WebSAGE.interpretaFormatoC( WebSAGE.InkSage[i].formatoC, tag );
            if ( val != WebSAGE.InkSage[i].parent.textContent ) // value changed?
              { 
                if ( WebSAGE.InkSage[i].parent.changeAnim != undefined )
                if ( WebSAGE.InkSage[i].lastVal != undefined )     
                  {
                  // is the value raising or lowering? (animate differently, over or undeline)
                  if ( Math.abs( V[tag] ) > Math.abs( WebSAGE.InkSage[i].lastVal ) )
                    {
                    WebSAGE.InkSage[i].parent.changeAnim.setAttributeNS( null, 'values', 'line-through;overline;overline;line-through;overline;overline' );
                    }
                  else  
                    {
                    WebSAGE.InkSage[i].parent.changeAnim.setAttributeNS( null, 'values', 'line-through;underline;underline;line-through;underline;underline' );
                    }
                  }

                WebSAGE.InkSage[i].parent.childNodes[0].textContent = val;
                if ( typeof( WebSAGE.InkSage[i].parent.changeAnim.beginElement ) === "function" )
                  {
                  WebSAGE.InkSage[i].parent.changeAnim.endElement();
                  WebSAGE.InkSage[i].parent.changeAnim.beginElement();
                  }
                 
                if ( WebSAGE.InkSage[i].parent.groupDistrib )
                  {
                  WebSAGE.setGroupDistrib( WebSAGE.InkSage[i].parent.parentNode );
                  }
                   
                WebSAGE.InkSage[i].lastVal = V[tag];    
              }
            WebSAGE.blinkSeAlarmado( tag, WebSAGE.InkSage[i].parent );
            break;
         case "color" : // altera a cor de acordo com o valor
            var script = "";
            var ch;
            fill = "";
            stroke = "";
            attrib = "";
            attribval = "";
            tag = "";
            vt = 0;
            for ( j = 0; j < WebSAGE.InkSage[i].list.length; j++ )
              {      
              if ( tag !==  WebSAGE.InkSage[i].list[j].tag ) 
                {
                tag = WebSAGE.InkSage[i].list[j].tag;
                vt = WebSAGE.valorTagueado( tag );
                }

              if ( typeof(F[tag]) === 'undefined' )
                { 
                  if ( vt === "????" )
                    {
                      ft = 0x80 | 0x20; // analog failed
                    }
                  else
                    {
                      ft = 0x20; // analog ok
                    } 
                }
              else
                { 
                  ft = F[tag]; 
                }
              digital = ( ft & 0x20 ) === 0;
             
              if ( vt !== "????" )
                {  
                  ch = WebSAGE.InkSage[i].list[j].data;
                  if ( digital )
                    {
                    val = parseInt( ch );
                    if ( 
                         !isNaN(val) && ((ft & 0x03) >= val) || 
                         !isNaN(val) && ((ft & 0x83) >= ( val | 0x80 )) || 
                         ( ch === "a" && (ft & 0x100) ) || // alarmado
                         ( ch === "f" && (ft & 0x80) ) // falha
                        )  
                        {
                        fill = WebSAGE.InkSage[i].list[j].cfill;
                        stroke = WebSAGE.InkSage[i].list[j].cstroke;
                        script = WebSAGE.InkSage[i].list[j].cscript;
                        attrib = WebSAGE.InkSage[i].list[j].cattrib;
                        attribval = WebSAGE.InkSage[i].list[j].cattribval;
                        }     
                    }
                  else  
                    {
                      val = parseFloat( ch );
                      
                      if ( 
                           ( ch === "n" && (ft & 0x800) ) || // não normal 
                           ( ch === "c" && (ft & 0x1000) ) || // congelado
                           ( ch === "a" && (ft & 0x100) ) || // alarmado
                           ( ch === "f" && (ft & 0x80) ) || // falha
                           ( !isNaN(val) && ( vt >= val ) )
                         )
                        {
                        fill = WebSAGE.InkSage[i].list[j].cfill;
                        stroke = WebSAGE.InkSage[i].list[j].cstroke;
                        script = WebSAGE.InkSage[i].list[j].cscript;
                        attrib = WebSAGE.InkSage[i].list[j].cattrib;
                        attribval = WebSAGE.InkSage[i].list[j].cattribval;                        
                        }
                      
                    }

                   WebSAGE.blinkSeAlarmado( tag, WebSAGE.InkSage[i].parent );
                }
              }
              
            if ( typeof(WebSAGE.InkSage[i].parent.temAnimacao) !== 'undefined' )
            if ( WebSAGE.InkSage[i].parent.temAnimacao )
               { 
                 RemoveAnimate(WebSAGE.InkSage[i].parent); 
               }

            if ( attrib !== "" )
              {
                WebSAGE.InkSage[i].parent.setAttributeNS( null, attrib, attribval );
              }
            else  
            if ( script !== "" )
              {
                  WebSAGE.InkSage[i].parent.temAnimacao = 1;
                  WebSAGE.InkSage[i].parent.style.fill = WebSAGE.InkSage[i].initfill;
                  WebSAGE.InkSage[i].parent.style.stroke = WebSAGE.InkSage[i].initstroke;
                  try 
                    {
                      eval( 'var thisobj=window.SVGDoc.getElementById("' + WebSAGE.InkSage[i].parent.id + '"); ' + script );
                    }                  
                  catch ( err ) 
                    { 
                      $('#SP_STATUS').text( err.name + ": " + err.message + " [7]" ); 
                      document.getElementById("SP_STATUS").title = err.stack;
                    }
              }
            else
              {
              if ( fill !== "" )
                { 
                  WebSAGE.InkSage[i].parent.style.fill = fill; 
                }
              else
                { 
                  WebSAGE.InkSage[i].parent.style.fill = WebSAGE.InkSage[i].initfill; 
                }
  
              if ( stroke !== "" )
                { 
                  WebSAGE.InkSage[i].parent.style.stroke = stroke; 
                }
              else
                { 
                  WebSAGE.InkSage[i].parent.style.stroke = WebSAGE.InkSage[i].initstroke; 
                }
              }
            if ( WebSAGE.InkSage[i].parent.groupDistrib )
              {
              WebSAGE.setGroupDistrib( WebSAGE.InkSage[i].parent.parentNode );
              }              
            if ( tag == 99999 ) // if constant value (99999), remove of subsequent processing
              {
              WebSAGE.InkSage[i].xdone = 1;
              }     
            break;
         case "bar":
            var altura = WebSAGE.InkSage[i].initheight * ( vt - WebSAGE.InkSage[i].min ) / ( WebSAGE.InkSage[i].max - WebSAGE.InkSage[i].min );
            // limit height: 0 to initial height
            if ( altura < 0 )
              { 
                altura = 0; 
              }
            if ( altura > WebSAGE.InkSage[i].initheight )
              { 
                altura = WebSAGE.InkSage[i].initheight; 
              }
            WebSAGE.InkSage[i].parent.setAttributeNS( null,"height", altura );            
            WebSAGE.blinkSeAlarmado( tag, WebSAGE.InkSage[i].parent );
            break;        
         case "opac":
            WebSAGE.InkSage[i].parent.style.opacity = ( vt - WebSAGE.InkSage[i].min) / ( WebSAGE.InkSage[i].max - WebSAGE.InkSage[i].min ) ;            

            // somente se o ponto for digital e a opacidade for 1, permite piscar 
            if ( typeof(F[tag]) == 'undefined' )
              { 
                WebSAGE.InkSage[i].parent.allowblink = false; 
              }
            else
            if ( (F[tag] & 0x20) == 0 && WebSAGE.InkSage[i].parent.style.opacity == 1 )    
              { 
                WebSAGE.InkSage[i].parent.allowblink = true; 
              }
            else
              { 
                WebSAGE.InkSage[i].parent.allowblink = false; 
              }

            WebSAGE.blinkSeAlarmado( tag, WebSAGE.InkSage[i].parent );
            break;     
         case "rotate":
            bb =  WebSAGE.InkSage[i].parent.getBBox();
            var tcx = parseFloat(WebSAGE.InkSage[i].parent.getAttributeNS("http://www.inkscape.org/namespaces/inkscape" , "transform-center-x"));
            var tcy = parseFloat(WebSAGE.InkSage[i].parent.getAttributeNS("http://www.inkscape.org/namespaces/inkscape" , "transform-center-y"));
            if ( isNaN( tcx ) )
              { 
                tcx = 0; 
              }
            if ( isNaN( tcy ) )
              { 
                tcy = 0; 
              }
            var xcen = bb.x + bb.width/2 - tcx;
            var ycen = bb.y + bb.height/2 - tcy;
            var ang = ( vt - WebSAGE.InkSage[i].min ) / ( WebSAGE.InkSage[i].max - WebSAGE.InkSage[i].min ) * 360;
            WebSAGE.InkSage[i].parent.setAttributeNS( null, 'transform', WebSAGE.InkSage[i].inittransform +
               ' rotate(' + ang + ' ' + xcen + ' ' + ycen + ') ' );
            WebSAGE.blinkSeAlarmado( tag, WebSAGE.InkSage[i].parent );
            break;    
         case "tooltips":
            if ( typeof( WebSAGE.InkSage[i].hasActiveTooltip ) !== "undefined" )
            if ( WebSAGE.InkSage[i].hasActiveTooltip === 1 )
              {
              var pini;
              var pend;
              var ev;
              var tc;
              tc = WebSAGE.InkSage[i].tooltipText;
              do
                {
                pini = tc.indexOf( "!EVAL", 0 );
                pend = tc.indexOf( "!END", 1 );
                if ( pend === -1 )
                   {
                   pend = 9999999;
                   }
                if ( pini !== -1 )
                   {
                    ev = eval( tc.substring( pini + 5 , pend ) );
                    if ( Number( ev ) !== NaN )
                      {
                      ev = printf( "%1.3f", ev );
                      }                     
                    
                    tc = tc.substring( 0, pini ) + ev + tc.substring( pend + 4 );
                   }
                } while ( pini !== -1 );  

              WebSAGE.InkSage[i].tooltipTitle.textContent = tc; 
              }             
            break;    
         case "slider":
            if ( vt > WebSAGE.InkSage[i].max )
               { 
                 vt = WebSAGE.InkSage[i].max; 
               }
            if ( vt <  WebSAGE.InkSage[i].min ) 
               { 
                 vt = WebSAGE.InkSage[i].min; 
               }
            var proporcao = ( vt - WebSAGE.InkSage[i].min ) / ( WebSAGE.InkSage[i].max - WebSAGE.InkSage[i].min );
            WebSAGE.InkSage[i].parent.setAttributeNS( null, 'transform', WebSAGE.InkSage[i].inittransform +
               ' translate(' + proporcao * WebSAGE.InkSage[i].rangex + ',' + proporcao * WebSAGE.InkSage[i].rangey + ') ' );
            WebSAGE.blinkSeAlarmado( tag, WebSAGE.InkSage[i].parent );
            break;        
         case "text":
            if ( typeof( F[tag] ) == 'undefined' )
              { 
                ft = vt; 
              }
            else
              { 
                ft = F[tag]; 
              }
            digital = ( ft & 0x20 ) == 0;
            var txt = "";
            var ch;
            for ( j = 0; j < WebSAGE.InkSage[i].map.length; j++ )
            {
              var poseq = WebSAGE.InkSage[i].map[j].indexOf("=");
              ch = WebSAGE.InkSage[i].map[j].substring(0, 1);
              if ( digital )
              { 
                val = parseInt( WebSAGE.InkSage[i].map[j].substring(0, poseq) );
                if ( (ft & 0x03) >= val || 
                     (ft & 0x83) >= ( val | 0x80 ) || 
                     ( ch === "a" && (ft & 0x100) ) || // alarmado
                     ( ch === "f" && (ft & 0x80) ) // falha
                   )  
                  { 
                    txt = WebSAGE.InkSage[i].map[j].substring( poseq + 1 ); 
                  }
              }
              else
              {
                val = parseFloat( WebSAGE.InkSage[i].map[j].substring(0, poseq) );
                if ( vt >= val || 
                     ( ch === "a" && (ft & 0x100) ) || // alarmado
                     ( ch === "f" && (ft & 0x80) ) // falha
                   )  
                  { 
                    txt = WebSAGE.InkSage[i].map[j].substring( poseq + 1 ); 
                  }
              }
            }
            if ( txt != WebSAGE.InkSage[i].parent.textContent )
              { 
                WebSAGE.InkSage[i].parent.textContent = txt; 
              }

            WebSAGE.blinkSeAlarmado( tag, WebSAGE.InkSage[i].parent );
            break;    
         case "clone":
            break;       
         default:
            break;
         }
      }
  }          

  if ( HA_ALARMES )
    {
    if ( document.getElementById("SILENCIA_ID").style.display != "" ) 
      {
      document.getElementById("SILENCIA_ID").style.display = "";
      }
    }  
  else    
    {
    if ( document.getElementById("SILENCIA_ID").style.display != "none" ) 
      {
      document.getElementById("SILENCIA_ID").style.display = "none";
      }
    }

try
  {  
  if ( WebSAGE.g_win_cmd !== NPTO )  
  if ( NPTO != 0 )
  if (  !WebSAGE.g_win_cmd ||
         typeof(WebSAGE.g_win_cmd.window) != 'object' ||
         WebSAGE.g_win_cmd.window === null ||
         WebSAGE.g_win_cmd.window.closed
     )    
    {
    WebSAGE.escondeDestaqPonto( NPTO );
    NPTO = 0;  
    }
  }
catch ( err ) 
  {
  WebSAGE.escondeDestaqPonto( NPTO );
  NPTO = 0;  
  }

$('#HORA_ATU').text( Data );

WebSAGE.g_blinkcnt = 0;

// show the svg after the first pass
if ( $("#svgid").css("opacity") != "1" )
   { 
     $("#svgid").css("opacity", "1"); 
   }
 
}, // showValsSVG

doSilenciaBeep : function ()
{
  document.getElementById("SILENCIA_ID").style.display = "none";
  WebSAGE.getScript( WebSAGE.g_remoteServer + "?Z=1" );
},

// cria as elipses amarelas de destaque de seleção de objetos 
produzDestaq : function ( obj , ponto )
{
 var svg_ns, block, bb, x, y, rx, ry, id, aux, el, xfm;

 if ( ponto == 99999 )
  return;

 if ( typeof( obj.getAttributeNS ) === 'undefined' )
   {
     return;
   }

 svg_ns = 'http://www.w3.org/2000/svg';
 block = SVGDoc.createElementNS( svg_ns, 'ellipse' );

 // bb = obj.getBoundingClientRect();
 // x = bb.left + bb.width/2;
 // y = bb.top + bb.height/2;
 
 try {
   bb = obj.getBBox();
 }
 catch (e) {
   return;
 }
 x = bb.x + bb.width/2;
 y = bb.y + bb.height/2;
  
 if ( x == 0 && y == 0 )
   {
   aux = obj.getAttributeNS( null, "x" );
   if ( aux != null ) x = aux;
   aux = obj.getAttributeNS( null, "y" );
   if ( aux != null ) y = aux;
   } 
  
 rx = bb.width;
 ry = bb.height;

 if ( rx < 18 )
   {
     rx = 18;
   }
 if ( ry < 18 )
   {
     ry = 18;
   }
 
 id = "DESTAQ" + ponto;
 el = SVGDoc.getElementById( id );
 if ( el !== null ) // avoid duplication of elipsis
   {
   return;
   }
 
  xfm = obj.getAttributeNS( null, "transform" );
  if ( xfm === null )
    xfm = "";
  
 block.setAttributeNS( null, 'id', id );
 block.setAttributeNS( null, 'cx', x );
 block.setAttributeNS( null, 'cy', y );
 block.setAttributeNS( null, 'rx', rx );
 block.setAttributeNS( null, 'ry', ry );
 block.setAttributeNS( null, 'stroke-opacity', 0.9 );
 block.setAttributeNS( null, 'fill-opacity', 0.1 );
 block.setAttributeNS( null, 'stroke',  'yellow' );
 block.setAttributeNS( null, 'stroke-width', 2  );
 block.setAttributeNS( null, 'display', 'none' );
 block.setAttributeNS( null, "onclick", WebSAGE.g_obj_onclick.replace(/PONTO/g, ponto) );
 block.setAttributeNS( null, 'transform', xfm );
 
 // SVGDoc.documentElement.appendChild( block );
 obj.parentNode.appendChild( block );
 if ( ANIMA & 0x01 )
     {
     var animation = document.createElementNS( svg_ns, 'animate' );
     animation.setAttributeNS( null, 'attributeName', 'ry' ); 
     animation.setAttributeNS( null, 'dur', '0.5' );
     animation.setAttributeNS( null, 'values', '0; ' + ry * 0.8 + '; ' + ry + '; ' + ry * 0.8 + '; 0' );
     animation.setAttributeNS( null, 'repeatCount', 'indefinite' );
     block.appendChild( animation );
     block.anim = animation;
     if ( block.anim.endElement )
       {
         block.anim.endElement();
       }
     }
},      

// cria as etiquetas de anotação 
produzEtiq : function ( obj , ponto )
{
 var animation, svg_ns, block, bb, x, y, id, eletq, aux, xfm;
 
 if ( ! isInt(ponto) )
   {
   return;
   }

 if ( ponto == 99999 )
   {
   return;
   }
 
 if ( typeof( obj.getAttributeNS ) === 'undefined' )
   {
     return;
   }

 id = "ANOT" + ponto;
 eletq = SVGDoc.getElementById( id );
 if ( eletq !== null ) // avoid duplication of labels
   {
   return;
   }
 
 svg_ns = 'http://www.w3.org/2000/svg';
 block = SVGDoc.createElementNS( svg_ns, 'path' );
 block.setAttributeNS( null, 'id', id );
 block.setAttributeNS( null, 'd', "M0.413787841796875 0.5425290489196777L0.413787841796875 5.095224800109864L7.873085021972656 11.345515670776367L12.482757568359375 6.48417896270752L5.6939697265625 0.38820165634155274L0.4976043701171875 0.31103796005249024L0.413787841796875 0.6196927452087402" );
 block.setAttributeNS( null, 'fill',  ScreenViewer_TagFillColor );
 block.setAttributeNS( null, 'stroke-opacity', 0.9 );
 block.setAttributeNS( null, 'fill-opacity', 0.8 );
 block.setAttributeNS( null, 'stroke',  ScreenViewer_TagStrokeColor );
 block.setAttributeNS( null, 'stroke-width', 1.1 );
 block.setAttributeNS( null, 'cursor', 'pointer' );
 block.setAttributeNS( null, 'display', 'none' );
 block.setAttributeNS( null, 'onclick', WebSAGE.g_obj_onclick.replace(/PONTO/g, ponto) );

 // bb = obj.getBoundingClientRect();
 // x = bb.left + bb.width;
 // y = bb.top + bb.height;
 
 try {
   bb = obj.getBBox();
 }
 catch (e) {
   return;
 }
 
 x = bb.x + bb.width;
 y = bb.y + bb.height;

 if ( x == 0 && y == 0 )
   {
   aux = obj.getAttributeNS( null, "x" );
   if ( aux != null ) x = aux;
   aux = obj.getAttributeNS( null, "y" );
   if ( aux != null ) y = aux;
   } 

  xfm = obj.getAttributeNS( null, "transform" );
  if ( xfm === null )
    xfm = "";

  block.setAttributeNS( null, 'transform', xfm + " translate(" + x + "," + y + ") " ); 
 
 // SVGDoc.documentElement.appendChild( block );
 obj.parentNode.appendChild( block );

 if ( ANIMA & 0x02 )
   {
   animation = document.createElementNS( svg_ns, 'animate' );
   animation.setAttributeNS( null, 'attributeName', 'fill-opacity' ); 
   animation.setAttributeNS( null, 'dur', '1' );
   animation.setAttributeNS( null, 'values', '0.2; 0.4; 0.6; 0.8; 0.5; 0.2;' );
   animation.setAttributeNS( null, 'repeatCount', 'indefinite' );
   // animation.setAttributeNS( null,'begin','1s' );
   // animation.setAttributeNS( null,'calcMode','discrete' );
   // animation.setAttributeNS( null,'keyTimes','0.0; 0.2; 0.4; 0.6; 0.8; 1.0;' );
   // animation.setAttributeNS( null,'fill','freeze');
   block.appendChild( animation );
   if ( typeof( animation.beginElement ) != "undefined" )
     {
     end.beginElement();
     animation.beginElement();
     }
   }            
   
  // obj.etiq = block;
},      

// Processa visibilidade das etiquetas
// Existem dois tipos de etiquetas com cores diferentes, para anotação e alarme inibido 
visibEtiq : function ( ponto )
{ 
  var eid = 'ANOT' + ponto;
  var eletq = SVGDoc.getElementById( eid );
  
  if ( eletq !== null ) // existe a etiqueta?
  {
    if ( F[ ponto ] & 0x400 ) // alarme inibido
    {
      if ( eletq.getAttributeNS(null, 'display') !== 'block' )
        {
        eletq.setAttributeNS( null, 'stroke', ScreenViewer_TagInhAlmStrokeColor );
        eletq.setAttributeNS( null, 'fill', ScreenViewer_TagInhAlmFillColor );
        eletq.setAttributeNS( null, 'display', 'block');  // mostra etiqueta
        }
    }
    else
    if ( F[ponto] & 0x200 ) // anotação
    {
      if ( eletq.getAttributeNS(null, 'display') !== 'inline' )
        {
        eletq.setAttributeNS( null, 'stroke', ScreenViewer_TagStrokeColor );
        eletq.setAttributeNS( null, 'fill', ScreenViewer_TagFillColor );
        eletq.setAttributeNS (null, 'display', 'inline');  // mostra etiqueta
        }
    }
    else
    { 
      if ( eletq.getAttributeNS( null, 'display') !== 'none' )
        { 
        eletq.setAttributeNS( null, 'display', 'none' );  // esconde etiqueta
        }
    }
  }  
},

// cria textos para mostrar relacionamentos
produzRelac : function ( obj , ponto )
{
 var svg_ns, block, bb, x, y, id, aux, xfm;

 if ( ponto == 99999 )
   return;

 if ( typeof( obj.getAttributeNS ) === 'undefined' )
   {
     return;
   }

 if ( ponto.charAt(0) === '#' || ponto.charAt(0) === '%' )
   {
     return;
   }

 svg_ns = 'http://www.w3.org/2000/svg';

 block = SVGDoc.createElementNS( svg_ns, 'text' );
 
 id = "RELAC" + ponto;
 block.setAttributeNS( null, 'id', id );
 // block.setAttributeNS( null, 'stroke-opacity', 0.9 );
 // block.setAttributeNS( null, 'fill-opacity', 0.8 );
 block.setAttributeNS( null, 'fill', ScreenViewer_RelationColor );
 // block.setAttributeNS( null, 'stroke',  'yellow' );
 // block.setAttributeNS( null, 'stroke-width', 1 );
 block.setAttributeNS( null, 'display', 'none' ); 

 // var bb = obj.getBoundingClientRect();
 // var x = bb.left + bb.width;
 // var y = bb.top + bb.height;
 
  try {
   bb = obj.getBBox();
 }
 catch (e) {
   return;
 }

 x = bb.x + bb.width;
 y = bb.y + bb.height;
 
 if ( x == 0 && y == 0 )
   {
   aux = obj.getAttributeNS( null, "x" );
   if ( aux != null ) x = aux;
   aux = obj.getAttributeNS( null, "y" );
   if ( aux != null ) y = aux;
   } 

 xfm = obj.getAttributeNS( null, "transform" );
 if ( xfm === null )
    xfm = "";
  
 block.setAttributeNS( null, 'transform', xfm + " translate(" + x + "," + y + ") " ); 
  
 block.textContent = ponto;
 
 block.relacionamento = 1;
 
 // SVGDoc.documentElement.appendChild( block );
 obj.parentNode.appendChild( block ); 
},      

// mostra/esconde os relacionamentos, através dos objetos criados na função produzRelac
mostraescRelac : function ()
{
  var nohs = SVGDoc.getElementsByTagName( "text" );
  for ( var i = 0; i < nohs.length; i++ )
     {
     if ( typeof( nohs.item(i).relacionamento ) === 'number' )
        { 
          nohs.item(i).setAttributeNS( null, 'display', nohs.item(i).getAttributeNS( null, 'display') === 'none' ? "" : "none" ); 
        }
     }
},

// falha todos os dados caso servidor pare de atualizar por um tempo  
falhaTudo: function ()
{
  for ( var x in F )
    {
    F[x] |= 0x80;    
    }
  Data = Msg.FalhaWebserver;
  Sha1Ana = "";
  Sha1Dig = "";
  WebSAGE.showValsSVG();
},
  
// faz sumir e aparecer a barra superior de botões  
hideShowBar : function ()
{ 
if ( document.getElementById("svgdiv").style.top == '0px' )
  {
  document.getElementById("bardiv").style.height = '40px';
  document.getElementById("svgdiv").style.top = '40px';
  // mostra a caixa de alarme
  document.getElementById('almiframe').style.display = '';
  }
else
  {
  document.getElementById("bardiv").style.height = '0px';
  document.getElementById("svgdiv").style.top = '0px';
  // esconde a caixa de alarme
  document.getElementById('almiframe').style.display = 'none';
  }  
},

zoomPan : function ( opc, mul )
{
if ( SVGDoc === null )  
  {
    return;
  }

if ( mul === undefined )
  mul = 1;
  
var rootnode = SVGDoc.getElementsByTagName("svg").item(0);

if ( rootnode === null )
  {
    return;
  }

switch ( opc )
  {
  case 0:
  case 2: // aumenta
    WebSAGE.g_zpW = WebSAGE.g_zpW * 0.9;
    WebSAGE.g_zpH = WebSAGE.g_zpH * 0.9;
    WebSAGE.g_zpX = WebSAGE.g_zpX + 1;
    break;
  case 1: // cima
    WebSAGE.g_zpY = WebSAGE.g_zpY + mul * 20 * WebSAGE.g_zpW / ScreenViewer_SVGMaxWidth;
    break;
  case 3: // esquerda  
    WebSAGE.g_zpX = WebSAGE.g_zpX + mul * 30 * WebSAGE.g_zpW / ScreenViewer_SVGMaxWidth;
    break;
  case 4: // centraliza
    WebSAGE.g_zpX = 0; 
    WebSAGE.g_zpY= 0;
    WebSAGE.g_zpW = ScreenViewer_SVGMaxWidth;
    WebSAGE.g_zpH = ScreenViewer_SVGMaxHeight;  
    break;
  case 5: // direita
    WebSAGE.g_zpX = WebSAGE.g_zpX - mul * 30 * WebSAGE.g_zpW / ScreenViewer_SVGMaxWidth;
    break;
  case 6:  
  case 8: // reduz 
    WebSAGE.g_zpW = WebSAGE.g_zpW * 1.1;
    WebSAGE.g_zpH = WebSAGE.g_zpH * 1.1;
    WebSAGE.g_zpX = WebSAGE.g_zpX + 1;
    break;
  case 7: // baixo 
    WebSAGE.g_zpY = WebSAGE.g_zpY - mul * 20 * WebSAGE.g_zpW / ScreenViewer_SVGMaxWidth;
    break;
  case 9: // reduz mais
    WebSAGE.g_zpW = WebSAGE.g_zpW * 1.3;
    WebSAGE.g_zpH = WebSAGE.g_zpH * 1.3;
    WebSAGE.g_zpX = WebSAGE.g_zpX + 1;
    break;
  default:
    break;
  }

rootnode.setAttributeNS( null, "viewBox", WebSAGE.g_zpX + " " + WebSAGE.g_zpY + " " +  WebSAGE.g_zpW + " " +  WebSAGE.g_zpH );
},  

anteTela: function()
{
    if ( WebSAGE.g_seltela.selectedIndex > 1 )
      {
          WebSAGE.g_seltela.selectedIndex--;
          document.fmTELA.submit();
      }
},

proxTela: function()
{
    if ( WebSAGE.g_seltela.selectedIndex < WebSAGE.g_seltela.length-1 )
      {
          WebSAGE.g_seltela.selectedIndex++;
          document.fmTELA.submit();
      }
},

playSlideshow: function()
{
    if ( WebSAGE.g_seltela.selectedIndex < WebSAGE.g_seltela.length-1 )
       { 
         WebSAGE.g_seltela.selectedIndex++; 
       }
    else
       { 
         WebSAGE.g_seltela.selectedIndex = 1; 
       }
       
    document.getElementById("PLAY").value = 1;   
    document.fmTELA.submit();
},

pauseSlideshow: function()
{
    if ( ScreenViewer_EnableTimeMachine )
       { 
         $('#TIMEMACHINE_ID').css('display', ''); 
       }

    $('#PLAY_ID').css('display', '');
    $('#PAUSE_ID').css('display', 'none');
    document.getElementById("PLAY").value=0;   
    clearTimeout( WebSAGE.g_timeoutSlideID );
},

// recarrega a página 1x por dia para contornar leak de memória
reload: function( whattodo )
{
  if ( whattodo === "init" )
    {
    var dt =  new Date ( (new Date()).getTime() + 1000 * 60 * 60 * 24 ); // próximo dia
    dt.setHours( 4 ); // fixa 4 horas
    dt.setMinutes( Math.random() * 60 ); // minuto aleatório
    var dif = dt - (new Date()); // quanto falta para chegar às 4:xx h do dia seguinte
    setTimeout( WebSAGE.reload, dif ); // vai chamar às 4 h
    return;
    }

  // só recarrego se a janela de info/comando estiver fechada
  if ( NPTO == 0 )
    {  
    // mantém as telas carregadas e o nível de zom
    document.getElementById("PTELA").value=tela;
    document.getElementById("ZPX").value=WebSAGE.g_zpX;
    document.getElementById("ZPY").value=WebSAGE.g_zpY;
    document.getElementById("ZPW").value=WebSAGE.g_zpW;
    document.getElementById("ZPH").value=WebSAGE.g_zpH;
    fmTELA.submit();
    }
  else
    { // se estiver ocupado, adia por 1 hora
    setTimeout( WebSAGE.reload, 60 * 60 * 1000 );
    }    
},

// envia ao servidor pedido reconhece alarmes do ponto
reconhece: function( nponto )
{
  if ( F[nponto] & 0x100 )
    { 
      WebSAGE.getScript( WebSAGE.g_remoteServer +
                      '?R=' + nponto + '&D=00/00/0000&H=00:00:00&M=000&A=0&' +
                      'PS=' + WebSAGE.g_pass++ 
                     );  
    }
},

setaCorFundo: function( cor )
{
    var rootnode = SVGDoc.getElementsByTagName("svg").item(0);
    if ( rootnode !== null )
      {
      // seta cor de background na raiz do svg
      rootnode.setAttributeNS( null, "style", "background-color: " + cor + ";" );
      // seta cor de background no div do svg
      $('#svgdiv').css( 'background-color', cor );   
        
      // se tela não for editada pelo inkscape
      if ( WebSAGE.g_isInkscape )  
        { // Inkscape
        }
      else  
        { // Não Inkscape
        // faz o primeiro retângulo na cor do background
        if ( typeof(WebSAGE.RectFundo) == 'object' )
          { 
            WebSAGE.RectFundo.setAttributeNS( null, 'style', 'fill:' + cor ); 
          }
        }
      }
    
    document.body.bgColor = cor;
},

mostraDestaqPonto: function( nponto )
{
    var id = SVGDoc.getElementById( 'DESTAQ' + nponto );
    if ( id != null )
      {
        id.setAttributeNS( null, 'display', 'inline' );
        if ( typeof( id.anim.beginElement ) != "undefined" )
         {
           id.anim.endElement();
           id.anim.beginElement();
         }
      }
},

escondeDestaqPonto: function( nponto )
{
    var id = SVGDoc.getElementById( 'DESTAQ' + nponto );
    if ( id !== null )
      {
        id.setAttributeNS( null, 'display', 'none' );
        if ( typeof( id.anim ) !== 'undefined' )
        if ( id.anim.endElement )
          { 
            id.anim.endElement(); 
          }
      }
},

// lista os pontos que tem objeto associado na tela, para seleção pelo teclado
listaDestacaveis: function ()
{
    var id;
    var nponto;
    
    for ( nponto in V )
      { 
        id = SVGDoc.getElementById( 'DESTAQ' + nponto );  
        if ( id != null )
         { 
           WebSAGE.g_destaqList.push( nponto ); 
         }
      }
},

mostraDestaqSel: function( direction, cmd )
{
    if ( NPTO != 0 )
       { 
         return;
       }
    
    var ind = WebSAGE.g_indSelPonto + direction;
    var id;
    
    // esconde o anterior, imediatamente
    WebSAGE.escondeDestaqPonto( WebSAGE.g_destaqList[WebSAGE.g_indSelPonto] );
            
    // faz a volta nas bordas        
    if ( ind < 0 )
       {
         ind = WebSAGE.g_destaqList.length - 1;
       }
    if ( ind >= WebSAGE.g_destaqList.length )
       {
         ind = 0;
       }

    if ( cmd == 1 ) // procura o próximo com comando
      {
      var loc = -1;
      for ( var i = ind ; ( i < WebSAGE.g_destaqList.length ) && ( i >= 0 ) ; i = i + direction )
        {
            if ( F[ WebSAGE.g_destaqList[ i ] ] & 0x4000 )
              {
              loc = i;
              break;
              }
        }
      ind = loc;  
      }
      
    WebSAGE.g_indSelPonto = ind;  
    if ( ind != -1 )
    {
        // mostra o selecionado  
        WebSAGE.mostraDestaqPonto( WebSAGE.g_destaqList[WebSAGE.g_indSelPonto] );
       
        // esconde o selecionado depois de um tempo   
        setTimeout( "WebSAGE.escondeDestaqPonto(" + WebSAGE.g_destaqList[WebSAGE.g_indSelPonto] + ")", 5000 );
    }
},

// Prepara a máquina do tempo
setupTimeMachine: function()
{
  $( '#TIMEMACHINE_ID' ).bind( 'click', 
     function() { // mostra controles da máquina do tempo
              clearTimeout( WebSAGE.g_toutID );
              clearTimeout( WebSAGE.g_toutStatusID );
              document.fmTELA.style.display = 'none';     
              $('#timemachinecontrols').css('display', '');
              
              var datenow = new Date();
              document.getElementById('dtpk').value = dateToYMDString( datenow );
              document.getElementById('tmpk').value = datenow.toTimeString().slice(0,8);
              document.getElementById('dtpk').max = dateToYMDString( datenow );   
              document.getElementById('dtpk').min = "2013-01-01"; 			  

              var hms = datenow.toTimeString().slice(0,8).split(":");
              var sec = parseFloat( hms[0] ) * 60 * 60 + parseFloat( hms[1] ) * 60 + parseFloat( hms[2] );
              document.getElementById('timesldr').value = sec; 
              document.getElementById('timesldr').max = sec; 			  
              
              $('#HORA_ATU').css( 'color', ScreenViewer_TimeMachineDateColor ); 
              $('#bardiv').css( 'background-color', ScreenViewer_TimeMachineBgColor ); 
              // esconde a caixa de alarme
              document.getElementById('almiframe').style.display = 'none';                           
              } );
			  
  $( '#TIMEMACHINECLOSE_ID' ).bind( 'click', 
     function() { // sai da máquina do tempo, retornando ao tempo real
              document.fmTELA.style.display = '';     
              $('#timemachinecontrols').css( 'display', 'none' );
              $('#HORA_ATU').css( 'color', ScreenViewer_DateColor );  
              $('#bardiv').css( 'background-color', ScreenViewer_ToolbarColor ); 
              WebSAGE.g_toutID = setTimeout( WebSAGE.callServer, 10 );
              // restaura a caixa de alarme
              document.getElementById('almiframe').style.display = '';                           
              } );
			  
  var tmoutchangeDate;
  function changeDate() {
       var dt = document.getElementById('dtpk').valueAsDate;
       
       var secs = document.getElementById('timesldr').value;
       var ms = dt.valueOf() + secs * 1000;
       
       dt = new Date( ms );
       var agora = new Date();
       if ( dt > agora )
         {
         dt = agora;
         document.getElementById('timesldr').value = dt.getHours()*60*60 + dt.getMinutes()*60 + dt.getSeconds();
         }       
       
	   // if selected day is today, limit the timeslider
	   if ( dateToYMDString( dt ) === dateToYMDString( agora ) )
	     {
		 document.getElementById('timesldr').max = agora.getHours()*60*60 + agora.getMinutes()*60 + agora.getSeconds(); 		   
	     }
       else 
         {
		 document.getElementById('timesldr').max = 86399;
         }		
	   
       secs = document.getElementById('timesldr').value;
       document.getElementById('tmpk').value = printf( "%02d:%02d:%02d", secs/60/60, (secs/60)%60, secs%60 ); 
       
       var p;
       for ( p in V )
         {
          V[p] = 0; 
         } 
       for ( p in F )
         {
         F[p] = F[p] | 0x83;
         }    
       
       dt = document.getElementById('dtpk').valueAsDate;
       var dtstr = printf( "%02d/%02d/%04d", dt.getUTCDate(), dt.getUTCMonth() + 1, dt.getUTCFullYear() );
       clearTimeout( WebSAGE.g_toutID );
       clearTimeout( WebSAGE.g_timeoutFalhaID );
       WebSAGE.getScript(
                  WebSAGE.g_timePntServer +
                 '?P=' + WebSAGE.lstpnt +
                 '&H=' + document.getElementById('tmpk').value +
                 '&D=' + dtstr +
                 '&B=WebSAGE.showValsSVG' +
                 '&PS=' + WebSAGE.Pass );

  document.getElementById('timesldr').focus();
  $('#timemachinecontrols').css('display', '');
  };   
  
  document.getElementById('timesldr').onchange = function() {
    clearTimeout( tmoutchangeDate );
    tmoutchangeDate = setTimeout( changeDate, 500 );
    var secs = document.getElementById('timesldr').value;
    document.getElementById('tmpk').value = printf( "%02d:%02d:%02d", secs/60/60, (secs/60)%60, secs%60 ); 
  };   
  
  document.getElementById('dtpk').onchange = function() {
    clearTimeout( tmoutchangeDate );
	$('#timemachinecontrols').css('display', 'none');
    tmoutchangeDate = setTimeout( changeDate, 500 );
  };

  document.getElementById('tmpk').onchange = function() {
    document.getElementById('timesldr').value = document.getElementById('tmpk').valueAsNumber / 1000;
    clearTimeout( tmoutchangeDate );
    tmoutchangeDate = setTimeout( changeDate, 500 );
  };
},

TraduzCor: function( cor )
{
  var num;
  if ( cor.substr(0,5) == "-cor-" )
  switch ( cor )
    {
    case "-cor-bgd":
      cor = VisorTelas_BackgroundSVG;
      break;
    case "-cor-tbr":
      cor = ScreenViewer_ToolbarColor;
      break;
    case "-cor-almini":
      cor = VisorTelas_CorAlarmeInibido;
      break;
    case "-cor-medfal":
      cor = VisorTelas_Medidas_Cor_Falha;
      break;
    default:
      num = parseInt( cor.substr( 5,3 ), 10 );
      if ( isNaN ( num ) )
        {
            cor = "none";
        }
      else  
        {
            cor = ScreenViewer_ColorTable[num];
        }
      break;
    }

  return cor; 
},

init: function()
  {
  var rootnode, embed;  
  
  WebSAGE.g_loadtime = new Date();
  
  $('#SP_STATUS').text("");
  
  // vai nos objetos com 'id' e coloca como 'title' a mensagem correspondente de Titles, carrega as imagens (de images.js)        
  $('img[id]').attr( 'src', function( index ) { return Imgs[this.id]; } );
  $('img[id]').attr( 'title', function( index ) { return Titles[this.id]; } );
  $('area[id]').attr( 'title', function( index ) { return Titles[this.id]; } );
  $('select[id]').attr( 'title', function( index ) { return Titles[this.id]; } );
  $('span[id]').attr( 'title', function( index ) { return Titles[this.id]; } );
  $('#SELTELA_OPC1').text( Msg.SELTELA_OPC1 );
  $('#HORA_ATU').css( 'color', ScreenViewer_DateColor ); 

  $('#bardiv').css('display', ''); // shows toolbar

  if ( location.host.indexOf("127.0.0.1") >= 0 || location.host.indexOf("localhost") >=0 ) // se está acessando máquina local
     { // na máquina local o webserver abre nova janela do navegador
     $( '#ANORM_ID' ).bind( 'click', function() { WebSAGE.getScript( WebSAGE.g_remoteServer + "?x=6" ); } ); 
     }
  else  
     { // na máquina remota abre uma janela nova tipo popup
     $( '#ANORM_ID' ).bind( 'click', function() {window.open( 'tabular.html?SELMODULO=TODOS_ANORMAIS', 'Anormais', 'dependent=no,height=700,width=900,location=no,toolbar=no,directories=no,status=no,menubar=no,resizable=yes,modal=no' );} );
     }

  $( '#PRODUTO_ID' ).bind( 'dblclick', function() {window.open( 'about.html', 'About ', 'dependent=no,height=600,width=800,location=no,toolbar=no,directories=no,status=no,menubar=no,resizable=yes,modal=no' );} );
  
  if ( ScreenViewer_EnableTimeMachine )
    { 
      $('#TIMEMACHINE_ID').css('display', ''); 
    }
  
  LoadFavicon(Imgs.FAVICON_ID);

  WebSAGE.g_seltela = document.getElementById("SELTELA");
  
  embed = document.getElementById('svgid');
  try 
    {
      SVGDoc = embed.getSVGDocument();
      embed = null;
      
      if ( SVGDoc == null && tela !== "" ) // if SVG not loaded, reload page
        {
        // faz uma retentativa após meio segundo, pois talvez não deu tempo para carregar o arquivo SVG
        if ( typeof( window.Retentativa ) == 'undefined' )
           {
           window.Retentativa = 1;
           setTimeout( 'WebSAGE.init()', 1000 );
           return;
           }
           
          WebSAGE.reload();
          return;
        }
        
      // Quando clicado o SVG, puxa o foco para a barra de seleção e libera. Necessário para que funcionem as teclas de atalho.
      if ( BrowserDetect.OS != "iPad" ) // não sendo iPad      
        { 
          SVGDoc.onclick = function () { var elem = top.document.getElementById('SELTELA'); elem.focus(); elem.blur(); }; 
        }
      else
        { 
          ANIMA = 0x00; // no IPad não anima etiquetas e destaques.           
        }
      
      rootnode = SVGDoc.getElementsByTagName("svg").item(0);
      if ( rootnode != null )
        { 
          WebSAGE.g_isInkscape = rootnode.getAttributeNS("http://www.inkscape.org/namespaces/inkscape", "version") != ""; 
        }
      if ( WebSAGE.g_isInkscape )
        {
        VisorTelas_BackgroundSVG = ScreenViewer_Background;  
        }    
        
      SVGSnap = Snap(SVGDoc.rootElement); // obtain Snap surface
      
    }
  catch( exception ) 
    {
    if ( tela !== "" )
      {  // foi passada uma tela como parâmetro e não renderizou, pede plugin
      
      // faz uma retentativa após meio segundo, pois talvez não deu tempo para carregar o arquivo SVG
      if ( typeof( window.Retentativa ) == 'undefined' )
         {
         window.Retentativa = 1;
         setTimeout( 'WebSAGE.init()', 1000 );
         return;
         }
         
      alert( exception.message );
      clearTimeout( WebSAGE.g_toutID );
      alert( Msg.BrowserNSup );
      return;      
      }
    else  
      { // não foi passada nenhuma tela como parâmetro, então deixa assim
        
      }
    }
    
  WebSAGE.g_blinktimerID = setInterval( WebSAGE.timerBlink, WebSAGE.g_blinkperiod );
  
  shortcut.add( "F9",
                function() { WebSAGE.doSilenciaBeep(); },
                {'type':'keydown', 'propagate':false,	'target':document} );
  shortcut.add( ",",
                WebSAGE.anteTela,
                {'type':'keydown', 'propagate':false, 'disable_in_input':true, 'target':document} );
  shortcut.add( ".",
                WebSAGE.proxTela,
                {'type':'keydown', 'propagate':false, 'disable_in_input':true,	'target':document} );
  shortcut.add( "1",
                function() { if (1 < WebSAGE.g_seltela.length) { WebSAGE.g_seltela.selectedIndex=1; document.fmTELA.submit(); }},
                {'type':'keydown', 'propagate':false,	'disable_in_input':true, 'target':document} );
  shortcut.add( "2",
                function() { if (2 < WebSAGE.g_seltela.length) { WebSAGE.g_seltela.selectedIndex=2; document.fmTELA.submit(); }},
                {'type':'keydown', 'propagate':false, 'disable_in_input':true, 'target':document} );
  shortcut.add( "3",
                function() { if (3 < WebSAGE.g_seltela.length) { WebSAGE.g_seltela.selectedIndex=3; document.fmTELA.submit(); }},
                {'type':'keydown', 'propagate':false, 'disable_in_input':true, 	'target':document} );
  shortcut.add( "4",
                function() { if (4 < WebSAGE.g_seltela.length) { WebSAGE.g_seltela.selectedIndex=4; document.fmTELA.submit(); }},
                {'type':'keydown', 'propagate':false, 'disable_in_input':true, 'target':document} );
  shortcut.add( "5",
                function() { if (5 < WebSAGE.g_seltela.length) { WebSAGE.g_seltela.selectedIndex=5; document.fmTELA.submit(); }},
                {'type':'keydown', 'propagate':false, 'disable_in_input':true, 'target':document} );
  shortcut.add( "6",
                function() { if (6 < WebSAGE.g_seltela.length) {WebSAGE.g_seltela.selectedIndex=6; document.fmTELA.submit(); }},
                {'type':'keydown', 'propagate':false, 'disable_in_input':true, 'target':document} );
  shortcut.add( "7",
                function() { if (7 < WebSAGE.g_seltela.length) { WebSAGE.g_seltela.selectedIndex=7; document.fmTELA.submit(); }},
                {'type':'keydown', 'propagate':false, 'disable_in_input':true, 'target':document} );
  shortcut.add( "8",
                function() { if (8 < WebSAGE.g_seltela.length) { WebSAGE.g_seltela.selectedIndex=8; document.fmTELA.submit(); }},
                {'type':'keydown', 'propagate':false, 'disable_in_input':true, 'target':document} );
  shortcut.add( "9",
                function() { if (9 < WebSAGE.g_seltela.length) { WebSAGE.g_seltela.selectedIndex=9; document.fmTELA.submit(); }},
                {'type':'keydown', 'propagate':false, 'disable_in_input':true, 'target':document} );
  shortcut.add( "0",
                function() { if (10 < WebSAGE.g_seltela.length) { WebSAGE.g_seltela.selectedIndex=10; document.fmTELA.submit(); }},
                {'type':'keydown', 'propagate':false, 'disable_in_input':true, 'target':document} );
  
  // teclas de atalho para zoom/pan
  shortcut.add( "", // + : zoom in
                function() {WebSAGE.zoomPan(0);},
                {'type':'keydown', 'propagate':false, 'target':document, 'keycode':107} );
  shortcut.add( "", // numpad9 : zoom in
                function() {WebSAGE.zoomPan(0);},
                {'type':'keydown', 'propagate':false, 'target':document, 'keycode':105} );
  shortcut.add( "", // - : zoom out
                function() {WebSAGE.zoomPan(6);},
                {'type':'keydown', 'propagate':false, 'target':document, 'keycode':109} );
  shortcut.add( "", // numpad3 : zoom out
                function() {WebSAGE.zoomPan(6);},
                {'type':'keydown', 'propagate':false, 'target':document, 'keycode':99} );
  shortcut.add( "up", // sobe sem numlock
                function() {WebSAGE.zoomPan(1);},
                {'type':'keydown', 'propagate':false, 'target':document} );
  shortcut.add( "", // sobe com numlock
                function() {WebSAGE.zoomPan(1);},
                {'type':'keydown', 'propagate':false, 'target':document, 'keycode':104} );
  shortcut.add( "down", // desce sem numlock
                function() {WebSAGE.zoomPan(7);},
                {'type':'keydown', 'propagate':false, 'target':document} );
  shortcut.add( "", // desce com numlock
                function() {WebSAGE.zoomPan(7);},
                {'type':'keydown', 'propagate':false, 'target':document, 'keycode':98} );
  shortcut.add( "left", // esquerda sem numlock
                function() {WebSAGE.zoomPan(3);},
                {'type':'keydown', 'propagate':false, 'disable_in_input':true, 'target':document} );
  shortcut.add( "", // esquerda com numlock
                function() {WebSAGE.zoomPan(3);},
                {'type':'keydown', 'propagate':false, 'target':document, 'keycode':100} );
  shortcut.add( "right", // direita sem numlock
                function() {WebSAGE.zoomPan(5);},
                {'type':'keydown', 'propagate':false, 'disable_in_input':true, 'target':document} );
  shortcut.add( "", // direita com numlock
                function() {WebSAGE.zoomPan(5);},
                {'type':'keydown', 'propagate':false, 'target':document, 'keycode':102} );
  shortcut.add( "", // centraliza, sem zoom, com numlock (numpad5)
                function() {WebSAGE.zoomPan(4);},
                {'type':'keydown', 'propagate':false, 'target':document, 'keycode':101} );
  shortcut.add( "home", // centraliza, sem zoom, (home)
                function() {WebSAGE.zoomPan(4);},
                {'type':'keydown', 'propagate':false, 'target':document} );
  shortcut.add( "", // centraliza, sem zoom, com numlock (numpad7)
                function() {WebSAGE.zoomPan(4);},
                {'type':'keydown', 'propagate':false, 'target':document, 'keycode':103} );
  shortcut.add( "", // esconde/mostra barra de comandos, com numlock (numpad *)
                function() { WebSAGE.hideShowBar(); },
                {'type':'keydown', 'propagate':false, 'target':document, 'keycode':106} );

  shortcut.add( "shift+right", // mostra item selecionado
                function() {WebSAGE.mostraDestaqSel(1,0);},
                {'type':'keydown', 'propagate':false, 'target':document} );
  shortcut.add( "shift+left", // mostra item selecionado
                function() {WebSAGE.mostraDestaqSel(-1,0);},
                {'type':'keydown', 'propagate':false, 'target':document} );
  shortcut.add( "control+right", // mostra item selecionado
                function() {WebSAGE.mostraDestaqSel(1,1);},
                {'type':'keydown', 'propagate':false, 'target':document} );
  shortcut.add( "control+left", // mostra item selecionado
                function() {WebSAGE.mostraDestaqSel(-1,1);},
                {'type':'keydown', 'propagate':false, 'target':document} );
  shortcut.add( "enter", // mostra item selecionado
                function() { 
                             if ( WebSAGE.g_indSelPonto < 0 )
                               return;
                             var obj = SVGDoc.getElementById( 'DESTAQ' + WebSAGE.g_destaqList[ WebSAGE.g_indSelPonto ] ); 
                             if ( obj.getAttributeNS( null, 'display') != 'none' )
                               {
                               var evt = {}; 
                               evt.ctrlKey = false; 
                               obj.onclick( evt ); 
                               }
                           },
                {'type':'keydown', 'propagate':true,	'target':document} );
  shortcut.add( "shift+backspace", // mostra pontos relacionados
                function() {WebSAGE.mostraescRelac();},
                {'type':'keydown', 'propagate':false, 'target':document} );
                         
  shortcut.add( "esc",
                function() { // sai da máquina do tempo, retornando ao tempo real
                                 clearTimeout( WebSAGE.g_toutID );
                                 document.fmTELA.style.display = '';     
                                 $('#timemachinecontrols').css( 'display', 'none' );
                                 $('#HORA_ATU').css('color', ScreenViewer_DateColor ); 
                                 WebSAGE.g_toutID = setTimeout( WebSAGE.callServer, 10 );

                             if ( typeof(WebSAGE.g_win_cmd.window) == 'object' ) // fecha janela info
                             if ( WebSAGE.g_win_cmd.window ) 
                               WebSAGE.g_win_cmd.window.close();
                                 
                           },
                {'type':'keydown', 'propagate':false, 'target':document} );           

  shortcut.add( "shift+enter", // make a snapshot that can be saved as a webpage complete  
                 function() { var html = d3.select( SVGDoc.getElementsByTagName("svg").item(0))
                                                      .attr("version", 1.1)
                                                      .attr("xmlns", "http://www.w3.org/2000/svg")
                                                      .node().parentNode.rootElement.innerHTML;
		                      var doc = document.open("image/svg+xml", "blank");
                              doc.write( '<p>' + Data + '</p><svg  width="2400" height="1500" style="background-color:' + VisorTelas_BackgroundSVG + ';" >' + html + '</svg>');
		                    },
                {'type':'keydown', 'propagate':false, 'target':document} );           
				
  Core.addEventListener( document.getElementById("CORFUNDO_ID"), "click", 
      function()
      {
        WebSAGE.cntclkfundo++;
        if ( WebSAGE.cntclkfundo % 2 )
           {  
             WebSAGE.setaCorFundo( 'white' ); 
           }
        else
           { 
             WebSAGE.setaCorFundo( VisorTelas_BackgroundSVG ); 
           }
      } );
  
  WebSAGE.doResize();
  Core.addEventListener( window, 'resize', WebSAGE.doResize );

  // trata eventos de play/pause slideshow
  Core.addEventListener( document.getElementById("PLAY_ID"),  "click", WebSAGE.playSlideshow ) ;
  Core.addEventListener( document.getElementById("PAUSE_ID"), "click", WebSAGE.pauseSlideshow ) ;

  if ( parseInt(gup("PLAY")) == 1 )
    {
    WebSAGE.g_timeoutSlideID = setTimeout('WebSAGE.playSlideshow()', ScreenViewer_SlideShowInterval * 1000);
    $('#TIMEMACHINE_ID').css('display', 'none');
    $('#PLAY_ID').css('display', 'none');
    $('#PAUSE_ID').css('display', '');
    }
  
  // desabilita o botão direito 
  document.oncontextmenu = function() { return false; };

  // torna elementos não selecionáveis
  $("html > head").append("<style> body { user-select:none; -webkit-user-select:none; } </style>");
  
  if ( typeof(SVGDoc) != "undefined" )
  if ( SVGDoc != null )
    { 
      SVGDoc.oncontextmenu = function() { return false; }; 
    }

  document.body.style.overflowX = "hidden";
  document.body.style.overflowY = "hidden";
    
  if ( BrowserDetect.OS == "iPad" ) // no iPad  
    { 
    WebSAGE.zoomPan(9); // Reduz tamanho inicial
    $('#DIV_HORA').css('right', "1650"); // reposiciona a hora para aparecer de acordo com o viewport
    }  

  // ajusta largura e altura do gráfico SVG para os valores configurados
  if ( typeof(SVGDoc) != "undefined" )
  if ( SVGDoc != null )
    {
    rootnode = SVGDoc.getElementsByTagName("svg").item(0);
    if ( rootnode != null )
      {
      rootnode.setAttributeNS( null, "width", ScreenViewer_SVGMaxWidth );  
      rootnode.setAttributeNS( null, "height", ScreenViewer_SVGMaxHeight );          
      }
  
    // evita seleção do texto em SVG  
    SVGDoc.onselectstart = new Function( "return false;" );
    }
      
  // reload page daily to avoid memory leaks
  WebSAGE.reload( "init" );
  
  WebSAGE.setupTimeMachine();
  
  WebSAGE.g_zpW = ScreenViewer_SVGMaxWidth;
  WebSAGE.g_zpH = ScreenViewer_SVGMaxHeight;
  
  try 
    {
      if ( parseInt(gup("HIDETB")) == 1 )
         { // Esconde a toolbar, o almbox, data, status, bloqueia acesso ao ponto
         WebSAGE.hideShowBar();
         WebSAGE.g_hidetoolbar = 1;
         WebSAGE.g_obj_onclick = '';
         document.getElementById("DIV_HORA").style.display = "none";
         document.getElementById("DIV_STATUS").style.display = "none";
         }
      else
         {
         lista_telas();
         WebSAGE.atalhosTela();
         }

      WebSAGE.preprocessaTela();
    }
  catch ( err )
    {
      $('#SP_STATUS').text( "Erro na tela!" + " [0]" );
      document.getElementById("SP_STATUS").title = err.stack;
    }      

    // acerta nível de zoom, se necessário | adjust zoom levels for page reloads
  if ( !isNaN( parseInt( gup("ZPX") ) ) &&  
       !isNaN( parseInt( gup("ZPY") ) ) &&  
       !isNaN( parseInt( gup("ZPW") ) ) &&  
       !isNaN( parseInt( gup("ZPH") ) ) )
    {
    WebSAGE.g_zpX = parseInt( gup("ZPX") );
    WebSAGE.g_zpY = parseInt( gup("ZPY") );
    WebSAGE.g_zpW = parseInt( gup("ZPW") );
    WebSAGE.g_zpH = parseInt( gup("ZPH") );
    WebSAGE.zoomPan( 10 );
    }  
  
  // prepares the begining of real time data tranfers
  WebSAGE.g_toutID = setTimeout( WebSAGE.callServer, 10 );
  
  // Manipula eventos de rolagem do mouse para dar zoom
  document.getElementById("svgdiv").addEventListener( "wheel", 
                           function() { 
                              if (event.deltaY > 0) 
                                WebSAGE.zoomPan( 2 ); 
                              else 
                              WebSAGE.zoomPan( 8 ); 
                              }, 
                           true );
                           
  // arraste do mouse para mover a tela
  if ( rootnode != null )
    { 
    rootnode.setAttributeNS( 
     null, 
     "onmousedown", 
     "top.MOUSEX=event.clientX;top.MOUSEY=event.clientY;top.SVGDoc.getElementsByTagName('svg').item(0).style.cursor='move';"
     );
    rootnode.setAttributeNS( 
     null, 
     "onmouseup",
     "top.SVGDoc.getElementsByTagName('svg').item(0).style.cursor='default';" +
     "if ( top.MOUSEX > event.clientX ) top.WebSAGE.zoomPan(3, (top.MOUSEX - event.clientX)/30 ); else top.WebSAGE.zoomPan(5, (event.clientX - top.MOUSEX )/30 );" + 
     "if ( top.MOUSEY > event.clientY ) top.WebSAGE.zoomPan(1, (top.MOUSEY - event.clientY)/20 ); else top.WebSAGE.zoomPan(7, (event.clientY - top.MOUSEY )/20 );"
     );
   }  
	 
  } // init
  
}; // WebSAGE
