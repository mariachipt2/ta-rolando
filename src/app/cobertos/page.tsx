import {publicData} from '@/lib/data';
import {CoveredEvents} from '@/components/covered-events';
export const dynamic='force-dynamic';
export const metadata={title:'Tá chovendo? Rolês em locais cobertos | Tá Rolando'};
export default async function Page(){const data=await publicData();return <CoveredEvents events={data.events} error={data.error}/>}
