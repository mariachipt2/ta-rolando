import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {parsePlaces,parseAgendaPlaces} from '../supabase/functions/_shared/places';
import {venueEvent,buildVenueSubmitLink,type PublicVenue} from '../src/lib/venues';
import {venueSchema} from '../src/lib/venue-actions';
test('Busca separa bares/boates, limpa links e não infere música ao vivo nem Instagram ausente',()=>{
 const rows=parsePlaces({elements:[{type:'node',id:1,tags:{name:'Bar Um',amenity:'pub','addr:street':'Rua A','addr:housenumber':'12','contact:instagram':'@bar.um'}},{type:'way',id:2,tags:{name:'Boate',amenity:'nightclub',website:'javascript:alert(1)'}},{type:'node',id:3,tags:{name:'Outra cidade',amenity:'bar','addr:city':'Timóteo'}},{type:'node',id:4,tags:{name:'Restaurante',amenity:'restaurant'}}]});
 assert.equal(rows.length,2);assert.equal(rows[0].kind,'bar');assert.equal(rows[0].address,'Rua A, 12');assert.equal(rows[0].instagram_url,'https://www.instagram.com/bar.um/');assert.equal(rows[1].kind,'nightclub');assert.equal(rows[1].instagram_url,'');assert.equal(rows[1].website,'');assert.throws(()=>parsePlaces({remark:'timeout',elements:[]}));
});
test('Dados fixos preenchem só o local e link de envio respeita Pages e domínio próprio',()=>{
 const venue:PublicVenue={id:'00000000-0000-4000-8000-000000000001',name:'Boate Um',kind:'nightclub',address:'Rua A',neighborhood:'Centro',city:'Ipatinga',state:'MG',organizer:'Organizador',instagram_url:''};
 const event=venueEvent(venue);assert.equal(event.venue_name,'Boate Um');assert.equal('starts_at' in event,false);assert.equal('is_free' in event,false);
 assert.equal(buildVenueSubmitLink('https://mariachipt2.github.io/ta-rolando/#/admin',venue.id,true),'https://mariachipt2.github.io/ta-rolando/#/enviar-evento?local='+venue.id);
 assert.equal(buildVenueSubmitLink('https://site.test/admin?x=1',venue.id,false),'https://site.test/enviar-evento?local='+venue.id);
 assert.equal(venueSchema.safeParse({...venue,source_key:null,source_url:'',website:'javascript:alert(1)',active:true,share_enabled:true}).success,false);
});
test('Locais: escrita administrativa, atualização idempotente, recibo e link público desativável sem expor a lista',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated,service_role;`);
 for(const file of ['001_initial.sql','003_admin_totals.sql','004_event_instagram.sql','005_submissions_save_confirmation.sql','006_private_save_permissions.sql','007_event_management.sql'])await db.exec(readFileSync('supabase/migrations/'+file,'utf8'));
 await db.exec("insert into venues(id,name,address) values('00000000-0000-4000-8000-000000000099','Local antigo','Rua antiga')");
 await db.exec(readFileSync('supabase/migrations/011_venues.sql','utf8'));
 const old=(await db.query<{name:string;address:string;share_enabled:boolean;updated_at:unknown}>("select * from venues where id='00000000-0000-4000-8000-000000000099'")).rows[0];assert.equal(old.name,'Local antigo');assert.equal(old.address,'Rua antiga');assert.equal(old.share_enabled,false);assert.equal(old.updated_at,null);
 await db.exec(`insert into auth.users values('00000000-0000-4000-8000-000000000001');insert into admin_profiles(user_id,active) values('00000000-0000-4000-8000-000000000001',true)`);
 const id='00000000-0000-4000-8000-000000000002',data={name:'Boate Um',kind:'nightclub',address:'Rua A',active:true,share_enabled:true,source_key:'node/12',source_url:'https://www.openstreetmap.org/node/12'};
 const save=(value:unknown)=>db.query<{result:{venue:{id:string};saved_at:string}}>('select save_venue($1,$2) result',[id,JSON.stringify(value)]);
 await db.exec('set role anon');await assert.rejects(()=>db.query('select * from venues'));await assert.rejects(()=>save(data));
 await db.exec('reset role;set role authenticated');await assert.rejects(()=>save(data));await db.exec(`select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false)`);
 assert.ok((await save(data)).rows[0].result.saved_at);await save({...data,address:'Rua B'});assert.equal((await db.query('select * from venues')).rows.length,2);
 await assert.rejects(()=>db.query(`select save_venue('00000000-0000-4000-8000-000000000003',$1)`,[JSON.stringify(data)]));
 await db.exec('reset role;set role anon');const visible=(await db.query<{venue:Record<string,unknown>}>('select submission_venue($1) venue',[id])).rows[0].venue;assert.equal(visible.name,'Boate Um');assert.equal(visible.address,'Rua B');assert.equal('source_key' in visible,false);assert.equal('website' in visible,false);
 await db.exec(`reset role;set role authenticated`);await save({...data,share_enabled:false});await db.exec('reset role;set role anon');assert.equal((await db.query<{venue:unknown}>('select submission_venue($1) venue',[id])).rows[0].venue,null);
 await db.exec('reset role');assert.equal((await db.query<{entity:string}>('select entity from admin_save_state')).rows[0].entity,'venues');assert.equal((await db.query('select * from events')).rows.length,0);
 }finally{await db.close()}
});

 test('Agenda sugere locais de Ipatinga sem inventar classificação ou contatos',()=>{
 const event=(name:string,city='Ipatinga',url='https://socialyte.com.br/eventos/teste')=>'<script type="application/ld+json">'+JSON.stringify({'@type':'Event',url,location:{name,address:{addressLocality:city,streetAddress:'Rua A'}}})+'</script>';
 const rows=parseAgendaPlaces(event('Bar Um')+event('Boate Dois')+event('Garajão')+event('Hotel Três')+event('Bar Outra','Timóteo')+event('Bar Um'));
 assert.deepEqual(rows.map(p=>p.kind),['bar','nightclub','other']);assert.ok(rows.every(p=>p.instagram_url===''&&p.source_key===null));assert.equal(parseAgendaPlaces(event('Bar Um','Ipatinga','https://example.com')).length,0);
 });
