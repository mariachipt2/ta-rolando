import {fromZonedTime} from 'date-fns-tz';
export function ownNumber(instance){const jid=instance?.ownerJid||instance?.instance?.ownerJid||'';if(!/^\d{10,15}@s\.whatsapp\.net$/.test(jid))return null;return jid.split('@')[0]}
export function messageFor(n,publicEvent){const date=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'});const title=String(n.title).slice(0,160);const link='https://mariachipt2.github.io/ta-rolando/#/evento/'+encodeURIComponent(publicEvent.slug);return '✅ Tá Rolando\nO evento “'+title+'” ficou público após o agendamento.\nAgendado: '+date.format(new Date(n.scheduled_at))+' (Brasília)\nConfirmado: '+date.format(new Date(n.confirmed_at))+'\n'+link}
export function pendingNotices(rows,settings,state){return rows.filter(n=>Date.parse(n.confirmed_at)>=Date.parse(settings.enabledAt)&&!state[n.id])}
export async function sendOnce(n,{send,persist,state,now=()=>new Date().toISOString()}){
 if(state[n.id])return state[n.id];
 // Persist before the network request: after a crash or ambiguous timeout, do not repeat automatically.
 state[n.id]={status:'sending',at:now()};await persist();
 try{const result=await send();if(!result?.key?.id)throw Error('Resposta sem comprovante');state[n.id]={status:'accepted',at:now(),messageId:result.key.id};await persist()}
 catch{state[n.id]={status:'uncertain',at:now()};await persist()}
 return state[n.id];
}

export function brasiliaDay(now=new Date()){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));
 const day=parts.year+'-'+parts.month+'-'+parts.day;
 const next=new Date(day+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);
 return {day,time:parts.hour+':'+parts.minute,start:fromZonedTime(day+'T00:00:00','America/Sao_Paulo').toISOString(),end:fromZonedTime(next.toISOString().slice(0,10)+'T00:00:00','America/Sao_Paulo').toISOString()};
}
export function dailyConfig(settings){return {enabled:settings.dailyEnabled!==false,time:/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(settings.dailyTime||'')?settings.dailyTime:'08:00'}}
export function dailyDue(settings,state,now=new Date()){
 const config=dailyConfig(settings),clock=brasiliaDay(now);return !!settings.enabled&&config.enabled&&clock.time>=config.time&&!state['daily:'+clock.day];
}
export function eventsForDay(rows,now=new Date()){
 const {start,end}=brasiliaDay(now),seen=new Set();
 return rows.filter(e=>{if(seen.has(e.id)||e.status==='cancelled'||e.status==='draft'||e.deleted_at||e.categories?.active===false)return false;
 const starts=Date.parse(e.starts_at),ends=Date.parse(e.ends_at||e.starts_at);
 if(!Number.isFinite(starts)||!Number.isFinite(ends)||starts>=Date.parse(end)||ends<Date.parse(start)||(ends===Date.parse(start)&&starts<Date.parse(start)))return false;
 seen.add(e.id);return true}).sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at)||a.title.localeCompare(b.title,'pt-BR'));
}
export function dailyMessage(rows,now=new Date()){
 const events=eventsForDay(rows,now);if(!events.length)return null;
 const date=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short'}).format(now),time=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const clean=(text,max)=>String(text||'').replace(/[\r\n\t]+/g,' ').slice(0,max);
 const lines=events.slice(0,15).map(e=>'• '+(Date.parse(e.starts_at)<Date.parse(brasiliaDay(now).start)?'Em andamento':time.format(new Date(e.starts_at)))+' — '+clean(e.title,90)+' — '+clean(e.venue_name,60));
 return '📅 Hoje no Tá Rolando · '+date+'\n'+lines.join('\n')+(events.length>15?'\n+ '+(events.length-15)+' outros eventos na agenda.':'')+'\n\nHorários de Brasília. Confira alterações e detalhes:\nhttps://mariachipt2.github.io/ta-rolando/#/';
}
