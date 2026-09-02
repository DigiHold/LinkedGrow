import { isCloud } from "@/lib/edition";
import { getInstanceSettings } from "@/lib/instance-settings";

/** What a self hosted instance calls itself where the cloud's emails show the logo. */
export async function instanceBrandName(): Promise<string | undefined> {
  if (isCloud()) return undefined;
  return (await getInstanceSettings()).instanceName || undefined;
}
