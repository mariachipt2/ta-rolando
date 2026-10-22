import {adminRoute} from '@/lib/admin-route';
import {service} from '@/lib/supabase';
import {findPlaces} from '../../../../../supabase/functions/_shared/places';
export async function POST(req:Request){return adminRoute(req,async db=>{const {data:{user}}=await db.auth.getUser();if(!user)throw Error('Sessão inválida.');const {data,error}=await service().rpc('consume_limit',{p_key:'places:'+user.id,p_max:3,p_seconds:3600});if(error||data!==true)throw Error('Limite de buscas atingido.');return findPlaces()})}
