@ECHO OFF
pushd %~dp0
cd %~dp0
IF NOT EXIST ffmpeg.exe (
  CLS
  ECHO ffmpeg.exe could not be found.
  GOTO:error
)

regsvr32 "screen-capture-recorder.dll" /s
regsvr32 "screen-capture-recorder-x64.dll" /s
vcredist_x86.exe /passive /Q:a /c:"msiexec /qb /i vcredist.msi"
vcredist_x64.exe /passive /Q:a /c:"msiexec /qb /i vcredist.msi"
ffmpeg -version
ECHO.
ECHO For help run: ffmpeg -h
ECHO.

GOTO:EOF

ECHO.
GOTO:EOF

:EOF
popd
exit