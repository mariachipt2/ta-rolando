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
