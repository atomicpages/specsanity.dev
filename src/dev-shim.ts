import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { plugin } from "bun";

const LOCAL_KV_DIR = join(process.cwd(), ".local-kv");
mkdirSync(LOCAL_KV_DIR, { recursive: true });

function createFileStore() {
  return {
    async get(key: string): Promise<string | null> {
      try {
        const raw = readFileSync(join(LOCAL_KV_DIR, key), "utf-8");
        const entry = JSON.parse(raw) as { value: string; expiresAt: number };
        if (Date.now() > entry.expiresAt) {
          return null;
        }
        return entry.value;
      } catch {
        return null;
      }
    },

    async put(
      key: string,
      value: string,
      options?: { expirationTtl?: number },
    ): Promise<void> {
      const ttl = options?.expirationTtl ?? 30 * 24 * 60 * 60;
      const entry = { value, expiresAt: Date.now() + ttl * 1000 };
      writeFileSync(join(LOCAL_KV_DIR, key), JSON.stringify(entry));
    },
  };
}

plugin({
  name: "cloudflare-workers-shim",
  setup(builder) {
    builder.module("cloudflare:workers", () => ({
      exports: {
        env: {
          specsanity: createFileStore(),
          API_RATE_LIMITER: undefined,
          ...process.env,
        },
      },
      loader: "object",
    }));
  },
});
