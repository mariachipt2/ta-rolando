import { publicData } from "@/lib/data";
import { Discover } from "@/components/discover";
export const dynamic = "force-dynamic";
export default async function Home() {
  const data = await publicData();
  return <Discover {...data} />;
}
