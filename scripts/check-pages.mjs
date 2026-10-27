import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync('dist-pages/index.html','utf8');
const base=process.env.PAGES_BASE||'/ta-rolando/';
const assets=[...html.matchAll(/(?:src|href)="([^"]+\/assets\/[^\"]+)"/g)].map(x=>x[1]);
assert.ok(assets.length>=2,'HTML deve incluir JS e CSS');
for(const asset of assets){assert.ok(asset.startsWith(base),'Asset fora do subdiretório Pages');assert.ok(fs.existsSync('dist-pages/'+asset.slice(base.length)))}
const css=fs.readdirSync('dist-pages/assets').filter(x=>x.endsWith('.css')).map(x=>fs.readFileSync('dist-pages/assets/'+x,'utf8')).join('\n');
for(const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)){
 const asset=match[1];if(!asset.startsWith('/'))continue;
 assert.ok(asset.startsWith(base),'Imagem CSS fora do subdiretório Pages');
 assert.ok(fs.existsSync('dist-pages/'+asset.slice(base.length)),'Imagem CSS não incluída no build');
}
const script=fs.readdirSync('dist-pages/assets').filter(x=>x.endsWith('.js')).map(x=>fs.readFileSync('dist-pages/assets/'+x,'utf8')).join('\n');
if(fs.existsSync('.env.local'))for(const line of fs.readFileSync('.env.local','utf8').split(/\r?\n/)){const m=line.match(/^(SUPABASE_SECRET_KEY|VISITOR_SECRET|TURNSTILE_SECRET_KEY|CRON_SECRET)=(.+)$/);if(m&&m[2].length>=8)assert.ok(!script.includes(m[2]),'Segredo privado encontrado no build')}
assert.ok(!script.includes('process.env.'),'Variável Node não substituída no navegador');
const manifest=JSON.parse(fs.readFileSync('dist-pages/manifest.webmanifest','utf8'));assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');assert.ok(fs.existsSync('dist-pages/.nojekyll'));
console.log('Pages: assets relativos, manifest, arquivo .nojekyll e ausência de segredos privados verificados.');
