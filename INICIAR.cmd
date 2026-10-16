@echo off
cd /d "%~dp0"
if not exist node_modules call npm.cmd ci
if errorlevel 1 goto error
node scripts/prepare-env.mjs
echo Abra http://127.0.0.1:3000 no navegador.
call npm.cmd run dev
goto end
:error
echo Nao foi possivel instalar as dependencias. Verifique Node.js e internet.
:end
pause
