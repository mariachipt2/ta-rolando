import {publicData} from '@/lib/data';
import {SharedProgram} from '@/components/shared-program';
export const dynamic='force-dynamic';
export const metadata={title:'Programação compartilhada',robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{eventos?:string|string[];titulo?:string|string[]}>}){const [data,params]=await Promise.all([publicData(),searchParams]);return <SharedProgram events={data.events} error={data.error} ids={typeof params.eventos==='string'?params.eventos:undefined} title={typeof params.titulo==='string'?params.titulo:undefined}/>}
