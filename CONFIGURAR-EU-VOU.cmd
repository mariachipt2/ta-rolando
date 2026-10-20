@echo off
cd /d "%~dp0"
node scripts/configurar-eu-vou.mjs
if errorlevel 1 echo A configuracao ainda nao foi concluida. Leia a mensagem acima.
pause
