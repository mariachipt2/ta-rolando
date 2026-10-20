import {publicData} from '@/lib/data';
import {WeekendSummary} from '@/components/weekend-summary';
export const dynamic='force-dynamic';
export const metadata={title:'Resumo do fim de semana'};
export default async function Page({searchParams}:{searchParams:Promise<{inicio?:string|string[]}>}){const [data,params]=await Promise.all([publicData(),searchParams]);return <WeekendSummary events={data.events} error={data.error} initialStart={typeof params.inicio==='string'?params.inicio:undefined}/>}
