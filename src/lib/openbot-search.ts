import type {
  DiscoveryResult,
  DiscoverySource,
} from "../../supabase/functions/_shared/discovery";
export type OpenBotSearchJob = {
  id: string;
  source: DiscoverySource;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  requested_at: string;
  started_at: string | null;
  finished_at: string | null;
  heartbeat_at: string | null;
  result: DiscoveryResult | null;
  error: string | null;
};
