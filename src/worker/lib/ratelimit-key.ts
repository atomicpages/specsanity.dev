export function rateLimitKey(ip: string, path: string): string {
  return `${ip}:${path}`;
}

/**
 * Resolve the client IP for rate limiting. Prefers Cloudflare's
 * `cf-connecting-ip`, then the first `x-forwarded-for` entry, and finally
 * falls back to "anon" (e.g. local dev without a proxy).
 */
export function clientIp(headers: Headers): string {
  const cf = headers.get("cf-connecting-ip");
  if (cf) {
    return cf;
  }

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  return "anon";
}
