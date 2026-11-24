import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {baseVenues,findBaseVenue,venueOptions} from '../src/lib/venue-directory';
import {eventSchema} from '../src/lib/validation';
import {validateSubmission} from '../src/lib/submission-validation';
import type {Event} from '../src/lib/types';

test('Locais canônicos tratam acentos e aliases sem confundir cidades ou supor cobertura',()=>{
 assert.equal(findBaseVenue(' GARAJAO - ipatinga ')?.nome,'Garajão');
 assert.equal(findBaseVenue('Mais Eventos - Ipatinga')?.nome,'Mais Eventos');
 assert.equal(findBaseVenue('Garajão novo'),undefined);
 assert.equal(baseVenues.find(v=>v.nome==='Estação do Chopp')?.bairro,'');
 assert.equal(baseVenues.find(v=>v.nome==='Garajão')?.ambiente,'coberto');
 const events=[{venue_name:'Garajão - Ipatinga',city:'Ipatinga'},{venue_name:'Garajão',city:'Timóteo',neighborhood:'Centro',state:'MG'}] as Event[];
 const options=venueOptions([],events);
 assert.equal(options.filter(v=>v.name==='Garajão'&&v.city==='Ipatinga').length,1);
 assert.equal(options.filter(v=>v.name==='Garajão'&&v.city==='Timóteo').length,1);
 const saved={name:'Garajão',city:'Ipatinga',state:'MG',neighborhood:'Novo Centro',environment:'misto',active:true} as const;
 assert.equal(venueOptions([saved as any]).find(v=>v.name==='Garajão')?.environment,'misto');
 assert.equal(venueOptions([{...saved,active:false} as any]).some(v=>v.name==='Garajão'),false);
});

test('Sugestões aceitam os três ambientes ou desconhecido e rejeitam valores estranhos',()=>{
 const sample={title:'Evento teste',description:'Descrição do evento',category_id:'00000000-0000-4000-8000-000000000001',starts_at:'2030-11-28T20:00:00-03:00',venue_name:'Local',address:'Rua Um, 10',is_free:false};
 for(const value of ['coberto','ao_ar_livre','misto',null,undefined])assert.equal(validateSubmission({...sample,environment:value},0).environment,value??null);
 assert.throws(()=>validateSubmission({...sample,environment:'sem chuva'},0));
});

test('Supabase salva cobertura em série, edição, histórico, restauração, views e local sem ampliar escrita pública',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated,service_role;`);
 for(const name of ['001_initial.sql','003_admin_totals.sql','004_event_instagram.sql','005_submissions_save_confirmation.sql','006_private_save_permissions.sql','007_event_management.sql','011_venues.sql','017_nightlife_filter.sql','020_artists.sql','023_event_time_tbd.sql','018_organizer_profiles.sql','025_venue_environment.sql','026_organizer_environment_confirmed.sql','027_sold_out.sql'])await db.exec(readFileSync('supabase/migrations/'+name,'utf8'));
 const organizerDefaults=(await db.query<{name:string;environment:string}>("select name,environment from organizer_profiles order by name")).rows;
 assert.deepEqual(organizerDefaults,[{name:'Estação do Chopp',environment:'misto'},{name:'Garajão',environment:'coberto'}]);
 const category=(await db.query<{id:string}>('select id from categories limit 1')).rows[0].id;
 const data={title:'Teste ambiente',description:'Descrição completa',category_id:category,starts_at:'2030-11-28T20:00:00-03:00',time_tbd:false,ends_at:null,venue_name:'Local',address:'Rua A, 10',neighborhood:'Centro',city:'Ipatinga',state:'MG',organizer:'',instagram_url:'',is_free:false,price:'',ticket_url:'',age_rating:'Livre',cover_url:'',gallery:[],additional_info:'',status:'published',publish_at:null,featured:false,family_friendly:null,change_notice:'',environment:'coberto'};
 assert.equal(eventSchema.parse(data).environment,'coberto');assert.equal(eventSchema.safeParse({...data,environment:'chuva'}).success,false);
 const admin='00000000-0000-4000-8000-000000000001';
 await db.exec(`insert into auth.users values('${admin}');insert into admin_profiles values('${admin}',true);set role authenticated;select set_config('request.jwt.claim.sub','${admin}',false)`);
 const created=(await db.query<{result:{ids:string[];saved_at:string}}>('select create_event_series($1,$2,$3,$4) result',['00000000-0000-4000-8000-000000000002',JSON.stringify(data),'weekly',2])).rows[0].result;
 assert.ok(created.saved_at);assert.equal((await db.query("select id from admin_events where environment='coberto'")).rows.length,2);
 const id=created.ids[0];
 await db.query('update events set sold_out=true where id=$1',[id]);
 assert.equal((await db.query<{sold_out:boolean}>('select sold_out from public_events where id=$1',[id])).rows[0].sold_out,true);
 assert.equal((await db.query<{sold_out:boolean}>('select sold_out from admin_events where id=$1',[id])).rows[0].sold_out,true);
 const version=(await db.query<{id:string}>('select id from event_versions where event_id=$1 order by created_at limit 1',[id])).rows[0].id;
 await db.query("update events set environment='ao_ar_livre' where id=$1",[id]);
 await db.query('select restore_event_version($1)',[version]);
 assert.equal((await db.query<{sold_out:boolean}>('select sold_out from public_events where id=$1',[id])).rows[0].sold_out,false);
 assert.equal((await db.query<{environment:string}>('select environment from public_events where id=$1',[id])).rows[0].environment,'coberto');
 await assert.rejects(()=>db.query("update events set environment='indefinido' where id=$1",[id]));
 const venueId=(await db.query<{id:string}>("select id from venues where name='Garajão'")).rows[0].id;
 const saved=(await db.query<{result:{saved_at:string;venue:{environment:string}}}>('select save_venue($1,$2) result',[venueId,JSON.stringify({name:'Garajão',kind:'bar',environment:'misto',share_enabled:true})])).rows[0].result;
 assert.ok(saved.saved_at);assert.equal(saved.venue.environment,'misto');
 await db.exec('reset role;set role anon');
 const directory=(await db.query<{name:string;environment:string}>('select * from venue_directory()')).rows;
 assert.equal(directory.length,baseVenues.length);assert.equal(directory.find(v=>v.name==='Garajão')?.environment,'misto');
 assert.equal(Object.keys(directory[0]).sort().join(','),'city,environment,name,neighborhood,state');
 assert.equal((await db.query("select id from public_events where environment='coberto'")).rows.length,2);
 await assert.rejects(()=>db.exec("update events set environment='misto'"));await assert.rejects(()=>db.exec('select * from venues'));
 const publicVenue=(await db.query<{result:{environment:string}}>('select submission_venue($1) result',[venueId])).rows[0].result;assert.equal(publicVenue.environment,'misto');
 }finally{await db.close()}
});
