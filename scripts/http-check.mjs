import assert from 'node:assert/strict';
const base='http://127.0.0.1:3000';
for(const path of ['/','/agenda','/admin','/privacidade','/manifest.webmanifest','/sitemap.xml','/robots.txt','/icons/icon-192.png']){
 const r=await fetch(base+path);assert.equal(r.status,200,path);console.log('OK GET',path);
}
assert.equal((await fetch(base+'/evento/inexistente')).status,404);
const blocked=await fetch(base+'/api/admin/events',{method:'POST',headers:{'Content-Type':'application/json','Origin':base},body:'{}'});assert.equal(blocked.status,401);
const csrf=await fetch(base+'/api/admin/events',{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://foreign.example'},body:'{}'});assert.equal(csrf.status,403);
assert.equal((await fetch(base+'/api/maintenance')).status,401);
console.log('OK acesso anônimo bloqueado, origem externa bloqueada, manutenção protegida e 404.');
