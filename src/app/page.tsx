import { publicData } from "@/lib/data";
import { Discover } from "@/components/discover";
import {SubmitEvent} from '@/components/submit-event';
export const dynamic = "force-dynamic";
export default async function Home() {
  const data = await publicData();
  return <><Discover {...data} /><SubmitEvent categories={data.categories}/></>;
}
