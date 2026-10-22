import {publicData} from '@/lib/data';
import {VenueSubmission} from '@/components/venue-submission';
export const dynamic='force-dynamic';
export const metadata={title:'Enviar programação',robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{local?:string}>}){const [params,data]=await Promise.all([searchParams,publicData()]);return <VenueSubmission id={typeof params.local==='string'?params.local:''} categories={data.categories}/> }
