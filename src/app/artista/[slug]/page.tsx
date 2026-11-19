import { publicData } from '@/lib/data';
import { ArtistAgenda } from '@/components/artist-agenda';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Agenda do artista' };
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const [data, { slug }] = await Promise.all([publicData(), params]);
  return <ArtistAgenda key={slug} events={data.events} error={data.error} slug={slug}/>;
}
