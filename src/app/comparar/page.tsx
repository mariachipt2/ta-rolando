import {publicData} from '@/lib/data';
import {CompareEvents} from '@/components/compare-events';
export const dynamic='force-dynamic';
export const metadata={title:'Comparar rolês',robots:{index:false,follow:false}};
export default async function Page(){const data=await publicData();return <CompareEvents events={data.events} error={data.error}/>}
