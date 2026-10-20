import {publicData} from '@/lib/data';
import {EventTimeline} from '@/components/event-timeline';
export const dynamic='force-dynamic';
export const metadata={title:'Linha do tempo'};
export default async function Page(){const data=await publicData();return <EventTimeline events={data.events} error={data.error}/>}
