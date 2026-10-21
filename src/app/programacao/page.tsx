import {publicData} from '@/lib/data';
import {ProgramBuilder} from '@/components/program-builder';
export const dynamic='force-dynamic';
export const metadata={title:'Minha programação',robots:{index:false,follow:false}};
export default async function Page(){const data=await publicData();return <ProgramBuilder events={data.events} error={data.error}/>}
