object fmSair: TfmSair
  Left = 175
  Top = 494
  ActiveControl = btDesligar
  BorderIcons = [biSystemMenu]
  BorderStyle = bsSingle
  Caption = 'Options'
  ClientHeight = 235
  ClientWidth = 274
  Color = clBtnFace
  DefaultMonitor = dmMainForm
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -11
  Font.Name = 'MS Sans Serif'
  Font.Style = []
  KeyPreview = True
  OldCreateOrder = False
  Position = poScreenCenter
  Scaled = False
  OnCreate = FormCreate
  OnHide = FormHide
  OnKeyDown = FormKeyDown
  OnShow = FormShow
  PixelsPerInch = 96
  TextHeight = 13
  object lbVersion: TLabel
    Left = 40
    Top = 0
    Width = 194
    Height = 13
    Alignment = taCenter
    Caption = 'OSHMI SHELL V4.3 � 2008-2017 - RLO'
  end
  object lbSenha: TLabel
    Left = 24
    Top = 128
    Width = 49
    Height = 13
    Caption = 'Password:'
  end
  object lbConfSenha: TLabel
    Left = 6
    Top = 160
    Width = 72
    Height = 13
    Caption = 'Password Rep.'
    Visible = False
  end
  object lbServer: TLabel
    Left = 8
    Top = 80
    Width = 39
    Height = 13
    Caption = 'lbServer'
  end
  object btDesligar: TBitBtn
    Left = 8
    Top = 16
    Width = 75
    Height = 33
    Hint = 'Desliga o computador'
    Caption = 'Turn Off'
    ParentShowHint = False
    ShowHint = True
    TabOrder = 0
    OnClick = btDesligarClick
  end
  object btReiniciar: TBitBtn
    Left = 96
    Top = 16
    Width = 75
    Height = 33
    Hint = 'Reinicia o computador'
    Caption = 'Reboot'
    ParentShowHint = False
    ShowHint = True
    TabOrder = 1
    OnClick = btReiniciarClick
  end
  object edSenha: TEdit
    Left = 80
    Top = 123
    Width = 185
    Height = 21
    MaxLength = 19
    PasswordChar = '*'
    TabOrder = 8
    OnChange = edSenhaChange
  end
  object btLogout: TBitBtn
    Left = 184
    Top = 16
    Width = 75
    Height = 33
    Hint = 'Cancela desligamento'
    Caption = 'Logoff'
    ParentShowHint = False
    ShowHint = True
    TabOrder = 2
    OnClick = btLogoutClick
  end
  object btExplorer: TButton
    Left = 16
    Top = 101
    Width = 57
    Height = 17
    Hint = 'Abre Shell do Windows'
    Caption = 'WinShell'
    ParentShowHint = False
    ShowHint = True
    TabOrder = 5
    Visible = False
    OnClick = btExplorerClick
  end
  object btPos: TButton
    Left = 110
    Top = 101
    Width = 49
    Height = 17
    Hint = 'Resseta posi��o'
    Caption = 'Rst Pos'
    ParentShowHint = False
    ShowHint = True
    TabOrder = 6
    Visible = False
    OnClick = btPosClick
  end
  object btRecup: TButton
    Left = 8
    Top = 56
    Width = 75
    Height = 17
    Hint = 'Op��es de recupera��o'
    Caption = 'Recover'
    ParentShowHint = False
    ShowHint = True
    TabOrder = 3
    OnClick = btRecupClick
  end
  object btProcExp: TButton
    Left = 198
    Top = 101
    Width = 49
    Height = 17
    Caption = 'ProcExp'
    TabOrder = 7
    Visible = False
    OnClick = btProcExpClick
  end
  object btCache: TButton
    Left = 96
    Top = 56
    Width = 75
    Height = 17
    Hint = 
      'Limpar cache do navegador. Pode ser necess�rio durante a instala' +
      '��o de novas telas.'
    Caption = 'Cache Clean'
    ParentShowHint = False
    ShowHint = True
    TabOrder = 4
    Visible = False
    OnClick = btCacheClick
  end
  object edSenha2: TEdit
    Left = 80
    Top = 152
    Width = 185
    Height = 21
    MaxLength = 19
    PasswordChar = '*'
    TabOrder = 9
    Visible = False
    OnChange = edSenha2Change
  end
  object btNovaSenha: TButton
    Left = 88
    Top = 184
    Width = 97
    Height = 25
    Caption = 'Change Password'
    TabOrder = 10
    Visible = False
    OnClick = btNovaSenhaClick
  end
  object btAjuda: TButton
    Left = 184
    Top = 56
    Width = 75
    Height = 17
    Caption = 'Help'
    TabOrder = 11
    OnClick = btAjudaClick
  end
end
