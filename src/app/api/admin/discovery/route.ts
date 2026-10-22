import {service} from '@/lib/supabase';
import {adminRoute} from '@/lib/admin-route';
import {discoverEvents,discoverySource} from '../../../../../supabase/functions/_shared/discovery';
export async function POST(req:Request){return adminRoute(req,async db=>{
 const raw=await req.text();if(raw.length>300)throw Error('Requisição inválida.');const source=discoverySource(raw?JSON.parse(raw).source:undefined);
 const {data:{user}}=await db.auth.getUser();if(!user)throw Error('Sessão inválida.');
 const {data,error}=await service().rpc('consume_limit',{p_key:'discovery:'+user.id,p_max:6,p_seconds:3600});
 if(error||data!==true)throw Error('Limite de buscas atingido.');
 return discoverEvents(source);
})}

