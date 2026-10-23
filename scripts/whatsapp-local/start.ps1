$ErrorActionPreference='Stop'
& (Join-Path $PSScriptRoot 'prepare.ps1')
$dockerCandidates=@("$env:ProgramFiles\Docker\Docker\resources\bin\docker.exe","$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin\docker.exe")
$docker=Get-Command docker.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
if(!$docker){$docker=$dockerCandidates | Where-Object {Test-Path -LiteralPath $_} | Select-Object -First 1}
if(!$docker){throw 'Instale e abra o Docker Desktop antes de continuar.'}
$env:PATH=(Split-Path -Parent $docker)+';'+$env:PATH
& $docker info --format '{{.ServerVersion}}'
if($LASTEXITCODE -ne 0){throw 'O Docker ainda não está pronto. Abra o Docker Desktop e conclua a configuração do WSL.'}
$runtime=Join-Path $env:LOCALAPPDATA 'TaRolando\WhatsApp'
& $docker compose --project-directory $runtime -f (Join-Path $runtime 'compose.yaml') up -d
if($LASTEXITCODE -ne 0){throw 'A Evolution não iniciou. Confira a mensagem anterior.'}
Write-Output 'Evolution iniciada. API: http://127.0.0.1:8188'

$project=Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location -LiteralPath $project
node.exe (Join-Path $PSScriptRoot 'server.mjs')
