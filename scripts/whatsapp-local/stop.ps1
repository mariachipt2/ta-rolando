$ErrorActionPreference='Stop'
$docker=Get-Command docker.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
if(!$docker){$docker=@("$env:ProgramFiles\Docker\Docker\resources\bin\docker.exe","$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin\docker.exe") | Where-Object {Test-Path -LiteralPath $_} | Select-Object -First 1}
if(!$docker){throw 'Docker não encontrado.'}
$env:PATH=(Split-Path -Parent $docker)+';'+$env:PATH
try{Invoke-RestMethod -Uri 'http://127.0.0.1:8190/shutdown' -Method Post -Headers @{Origin='http://127.0.0.1:8190'} -TimeoutSec 5 | Out-Null}catch{}
$runtime=Join-Path $env:LOCALAPPDATA 'TaRolando\WhatsApp'
& $docker compose --project-directory $runtime -f (Join-Path $runtime 'compose.yaml') stop
