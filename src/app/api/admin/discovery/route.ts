import {service} from '@/lib/supabase';
import {adminRoute} from '@/lib/admin-route';
import {discoverEvents} from '../../../../../supabase/functions/_shared/discovery';
export async function POST(req:Request){return adminRoute(req,async db=>{
 const {data:{user}}=await db.auth.getUser();if(!user)throw Error('Sessão inválida.');
 const {data,error}=await service().rpc('consume_limit',{p_key:'discovery:'+user.id,p_max:6,p_seconds:3600});
 if(error||data!==true)throw Error('Limite de buscas atingido.');
 return discoverEvents();
})}

