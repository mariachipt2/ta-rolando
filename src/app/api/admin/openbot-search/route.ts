import {adminRoute} from '@/lib/admin-route';
export async function POST(req:Request){return adminRoute(req,async db=>{
 const raw=await req.text();if(raw.length>300)throw Error('Pedido inválido.');
 const {data:{session}}=await db.auth.getSession();if(!session)throw Error('Sessão expirada.');
 const r=await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL+'/functions/v1/openbot-search',{method:'POST',headers:{apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json',Origin:new URL(process.env.NEXT_PUBLIC_SITE_URL||req.url).origin},body:raw,signal:AbortSignal.timeout(20000)});
 const d=await r.json();if(!r.ok)throw Error(d.error);return d;
})}
