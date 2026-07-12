import { env } from "cloudflare:workers";
import { type ShareData, safeParseShare, ttlSeconds } from "./share-data";

interface KVStore {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
}

const kvStore = env.specsanity as KVStore;
const DEFAULT_TTL_DAYS = 30;

export async function getShare(id: string): Promise<ShareData | null> {
  const raw = await kvStore.get(id);
  return safeParseShare(raw);
}

export async function putShare(
  id: string,
  data: ShareData,
  ttlDays?: number,
): Promise<void> {
  const days = ttlDays ?? DEFAULT_TTL_DAYS;
  await kvStore.put(id, JSON.stringify(data), {
    expirationTtl: ttlSeconds(days),
  });
}
