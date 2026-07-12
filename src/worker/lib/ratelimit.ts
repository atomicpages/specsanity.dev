import { env } from "cloudflare:workers";
import { Elysia } from "elysia";
import { clientIp, rateLimitKey } from "./ratelimit-key";

interface RateLimit {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export { rateLimitKey };

export const rateLimit = new Elysia({ name: "rate-limit" }).onBeforeHandle(
  async ({ request, path, set }) => {
    // The generated env type does not include our optional binding; narrow it here.
    const limiter = (env as { API_RATE_LIMITER?: RateLimit }).API_RATE_LIMITER;
    if (!limiter) {
      return;
    }
    const ip = clientIp(request.headers);
    const { success } = await limiter.limit({ key: rateLimitKey(ip, path) });
    if (!success) {
      set.status = 429;
      return { error: "Rate limit exceeded. Try again shortly." };
    }
  },
);
