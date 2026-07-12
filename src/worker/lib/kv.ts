import { join } from "node:path";
import { type ShareData, safeParseShare, ttlSeconds } from "./share-data";

interface KVStore {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
}

function getStore(): KVStore {
  try {
    const { env } = require("cloudflare:workers");
    return env.SHARE_STORE as KVStore;
  } catch {
    return createFileStore();
  }
}

const LOCAL_STORE_DIR = join(import.meta.dir, "../../../.local-kv");

function createFileStore(): KVStore {
  const { mkdirSync, readFileSync, writeFileSync } = require("node:fs");
  mkdirSync(LOCAL_STORE_DIR, { recursive: true });

  return {
    async get(key) {
      try {
        const raw = readFileSync(join(LOCAL_STORE_DIR, key), "utf-8");
        const entry = JSON.parse(raw) as { value: string; expiresAt: number };
        if (Date.now() > entry.expiresAt) {
          return null;
        }
        return entry.value;
      } catch {
        return null;
      }
    },
    async put(key, value, options) {
      const ttl = options?.expirationTtl ?? 30 * 24 * 60 * 60;
      const entry = { value, expiresAt: Date.now() + ttl * 1000 };
      writeFileSync(join(LOCAL_STORE_DIR, key), JSON.stringify(entry));
    },
  };
}

const kvStore = getStore();
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
