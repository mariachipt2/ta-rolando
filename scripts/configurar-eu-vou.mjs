import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
process.chdir(root);
const file=path.join(root,'.env.local');
function readConfig(){
 if(!fs.existsSync(file))throw Error('Execute primeiro INICIAR.cmd para preparar o arquivo .env.local.');
 return Object.fromEntries(fs.readFileSync(file,'utf8').split(/\r?\n/).map(line=>line.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map(m=>[m[1],m[2].trim().replace(/^(["'])(.*)\1$/,'$2')]));
}
// Only fixed CLI arguments are used. Private values are sent through a temporary
// ignored env file, never as command-line arguments or console output.
function cli(args){
 const result=spawnSync('cmd.exe',['/d','/s','/c','npm.cmd exec --yes --package=supabase@2.121.0 -- supabase '+args.join(' ')+' --agent no --output-format text'],{cwd:root,stdio:'inherit'});
 if(result.error||result.status!==0)throw Error('O comando Supabase nao foi concluido. Verifique a mensagem acima.');
}
async function main(){
 const env=readConfig();
 const projectRef='oiejqsgkrrwqlgohtxta';
 if(env.NEXT_PUBLIC_SUPABASE_URL!==`https://${projectRef}.supabase.co`)throw Error('A URL local nao corresponde ao projeto Ta Rolando esperado.');
 for(const name of ['NEXT_PUBLIC_TURNSTILE_SITE_KEY','TURNSTILE_SECRET_KEY'])if(!env[name])throw Error(`Preencha ${name} no arquivo .env.local. Veja docs/ATIVAR-EU-VOU.md.`);
 if(/[\r\n]/.test(env.TURNSTILE_SECRET_KEY))throw Error('Chave Turnstile invalida.');
 let secret=env.VISITOR_SECRET;
 if(!secret||secret.length<32){secret=randomBytes(32).toString('hex');const text=fs.readFileSync(file,'utf8');fs.writeFileSync(file,/^VISITOR_SECRET=.*$/m.test(text)?text.replace(/^VISITOR_SECRET=.*$/m,'VISITOR_SECRET='+secret):text+'\nVISITOR_SECRET='+secret+'\n');}
 const work=path.join(root,'work');fs.mkdirSync(work,{recursive:true});
 const temp=path.join(work,'edge-secrets.env');
 try{
  console.log('1/4 - Entre na conta Supabase que administra o projeto Ta Rolando.');
  console.log('A CLI oficial pode abrir o navegador e pedir sua confirmacao.');
  cli(['login']);
  fs.writeFileSync(temp,`VISITOR_SECRET=${secret}\nTURNSTILE_SECRET_KEY=${env.TURNSTILE_SECRET_KEY}\nALLOWED_ORIGINS=https://mariachipt2.github.io,http://127.0.0.1:4173\n`,{mode:0o600});
  console.log('2/4 - Configurando os segredos da funcao no seu Supabase...');
  cli(['secrets','set','--env-file','work/edge-secrets.env','--project-ref',projectRef]);
  console.log('3/4 - Publicando public-events no seu Supabase...');
  cli(['functions','deploy','public-events','--project-ref',projectRef,'--use-api']);
 }finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}
 console.log('4/4 - Conferindo se a funcao responde ao site...');
 const response=await fetch(`https://${projectRef}.supabase.co/functions/v1/public-events`,{method:'OPTIONS',headers:{Origin:'https://mariachipt2.github.io',apikey:env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY},signal:AbortSignal.timeout(20000)});
 if(response.status!==204||response.headers.get('access-control-allow-origin')!=='https://mariachipt2.github.io')throw Error('A funcao foi enviada, mas ainda nao respondeu como esperado. Tente novamente em alguns instantes.');
 console.log('Funcao publicada e acessivel ao site.');
 console.log('Falta colocar NEXT_PUBLIC_TURNSTILE_SITE_KEY nas Variables do GitHub Actions e publicar pelo seu aplicativo.');
 console.log('Depois teste marcar um evento, abrir Minha Agenda e retirar a marcacao.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1});
