$ErrorActionPreference='Stop'
$runtime=Join-Path $env:LOCALAPPDATA 'TaRolando\WhatsApp'
New-Item -ItemType Directory -Path $runtime -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'compose.yaml') -Destination (Join-Path $runtime 'compose.yaml')
$envFile=Join-Path $runtime '.env'
if(!(Test-Path -LiteralPath $envFile)){
 $rng=[Security.Cryptography.RandomNumberGenerator]::Create()
 $keyBytes=New-Object byte[] 32;$passBytes=New-Object byte[] 24
 $rng.GetBytes($keyBytes);$rng.GetBytes($passBytes);$rng.Dispose()
 $key=([BitConverter]::ToString($keyBytes)).Replace('-','').ToLowerInvariant()
 $pass=([BitConverter]::ToString($passBytes)).Replace('-','').ToLowerInvariant()
 [IO.File]::WriteAllText($envFile,"AUTHENTICATION_API_KEY=$key`nPOSTGRES_PASSWORD=$pass`n",(New-Object Text.UTF8Encoding($false)))
}
Write-Output "Arquivos preparados em $runtime. Chaves locais preservadas."
