import { cleanEnv, num } from "envalid";

function getRawEnv(): Record<string, string | undefined> {
  try {
    const { env: cfEnv } = require("cloudflare:workers");
    return cfEnv as Record<string, string | undefined>;
  } catch {
    return process.env as Record<string, string | undefined>;
  }
}

export const env = cleanEnv(getRawEnv(), {
  ID_LENGTH: num({ default: 8 }),
  SHARE_TTL_DAYS: num({ default: 30 }),
  MAX_SPEC_SIZE: num({ default: 10 * 1024 ** 2 }),
  MAX_REDIRECTS: num({ default: 3 }),
  FETCH_TIMEOUT_MS: num({ default: 10_000 }),
});
