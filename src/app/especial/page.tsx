import { publicData } from '@/lib/data';
import { AgendaSpecialPage } from '@/components/agenda-special-page';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Especial da agenda' };
export default async function Page({ searchParams }: { searchParams: Promise<{ inicio?: string; fim?: string; titulo?: string }> }) {
  const [data, params] = await Promise.all([publicData(), searchParams]);
  return <AgendaSpecialPage key={JSON.stringify(params)} events={data.events} error={data.error} selection={{ inicio: typeof params.inicio === 'string' ? params.inicio : null, fim: typeof params.fim === 'string' ? params.fim : null, titulo: typeof params.titulo === 'string' ? params.titulo : null }}/>;
}
