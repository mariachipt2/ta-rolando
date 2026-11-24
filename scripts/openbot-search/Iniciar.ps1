$ErrorActionPreference='Stop'
$taskPython=(Get-Command python.exe).Source
$taskScript=Join-Path $PSScriptRoot 'connector.py'
Start-Process -FilePath $taskPython -ArgumentList @('"'+$taskScript+'"') -WindowStyle Hidden -WorkingDirectory $PSScriptRoot
