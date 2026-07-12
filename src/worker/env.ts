import { env as cfEnv } from "cloudflare:workers";
import { bool, cleanEnv, num } from "envalid";

export const env = cleanEnv(
  cfEnv as unknown as Record<string, string | undefined>,
  {
    DEV_MODE: bool({ default: false }),
    ID_LENGTH: num({ default: 8 }),
    SHARE_TTL_DAYS: num({ default: 30 }),
    MAX_SPEC_SIZE: num({ default: 10 * 1024 ** 2 }),
    MAX_REDIRECTS: num({ default: 3 }),
    FETCH_TIMEOUT_MS: num({ default: 10_000 }),
  },
);
