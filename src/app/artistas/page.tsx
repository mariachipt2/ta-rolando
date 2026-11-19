import { publicData } from '@/lib/data';
import { ArtistAgenda } from '@/components/artist-agenda';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Agenda dos artistas' };
export default async function Page() {
  const data = await publicData();
  return <ArtistAgenda events={data.events} error={data.error}/>;
}
