; Restaurant Print Agent — Windows Installer (Phase 1-3)
; Requires Inno Setup 6+

#define AppName "مطعم النخة — وكيل الطباعة"
#define AppVersion "1.0.0"
#define AppPublisher "Restaurant"
#define InstallDir "{autopf}\RestaurantPrint"
#define TrayExe "RestaurantPrintTray.exe"
#define AgentExe "RestaurantPrintAgent.exe"

[Setup]
AppId={{B4E8F2A1-6C3D-4E91-9F0A-RestaurantPrint2026}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
DefaultDirName={#InstallDir}
DefaultGroupName={#AppName}
DisableProgramGroupPage=yes
OutputDir=..\release
OutputBaseFilename=RestaurantPrintSetup-x64
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=admin
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
UninstallDisplayIcon={app}\{#TrayExe}
CloseApplications=force
RestartApplications=no
UsePreviousAppDir=yes
ChangesAssociations=no

[Languages]
Name: "arabic"; MessagesFile: "compiler:Languages\Arabic.isl"

[Tasks]
Name: "desktopicon"; Description: "إنشاء اختصار على سطح المكتب"; GroupDescription: "اختصارات إضافية:"; Flags: unchecked

[Files]
Source: "..\dist\publish\RestaurantPrintTray.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\print-agent\release\{#AgentExe}"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\print-agent\assets\fonts\*.woff"; DestDir: "{app}\assets\fonts"; Flags: ignoreversion
Source: "migrate-config.ps1"; DestDir: "{app}\installer"; Flags: ignoreversion

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\{#TrayExe}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#TrayExe}"; Tasks: desktopicon

[Run]
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\installer\migrate-config.ps1"""; Flags: runhidden waituntilterminated
Filename: "{app}\{#TrayExe}"; Parameters: "--register-autostart"; Flags: runhidden waituntilterminated
Filename: "{app}\{#TrayExe}"; Description: "تشغيل وكيل الطباعة الآن"; Flags: postinstall nowait skipifsilent

[UninstallRun]
Filename: "{app}\{#TrayExe}"; Parameters: "--unregister-autostart"; Flags: runhidden waituntilterminated

[UninstallDelete]
Type: filesandordirs; Name: "{app}"

[Code]
function InitializeSetup(): Boolean;
begin
  Result := True;
end;

function ShouldSkipPage(PageID: Integer): Boolean;
begin
  Result := False;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usPostUninstall then
  begin
    { Preserve user config/token/logs in LocalAppData — do not delete }
  end;
end;
