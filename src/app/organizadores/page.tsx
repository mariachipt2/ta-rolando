import {publicData} from '@/lib/data';
import {OrganizerHub} from '@/components/organizer-hub';
export const dynamic='force-dynamic';
export const metadata={title:'Organizadores favoritos'};
export default async function Page(){const data=await publicData();return <OrganizerHub events={data.events} error={data.error}/>}
