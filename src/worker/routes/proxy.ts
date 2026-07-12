import { Elysia, t } from "elysia";
import { env } from "../env";

const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^fc00:/i,
  /^fd[0-9a-f]{2}:/i,
  /^fe80:/i,
  /^::1?$/,
  /^localhost$/i,
];

export function isPrivateHost(hostname: string): boolean {
  const h = hostname
    .replace(/^\[|\]$/g, "")
    .replace(/\.$/, "")
    .toLowerCase();

  const stripped = h.startsWith("::ffff:") ? h.slice(7) : h;

  return PRIVATE_IP_RANGES.some(
    (pattern) => pattern.test(stripped) || pattern.test(h),
  );
}

function isAllowedTarget(url: URL): boolean {
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return false;
  }

  return !isPrivateHost(url.hostname);
}

/**
 * Read a response body into bytes, aborting if it exceeds `max`.
 * Returns null when the response is too large (via header or streamed size).
 */
async function readCapped(
  response: Response,
  max: number,
): Promise<Uint8Array | null> {
  const contentLength = Number(response.headers.get("content-length") || 0);

  if (contentLength > max) {
    return null;
  }

  const body = response.body;

  if (!body) {
    return new Uint8Array(0);
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    total += value.byteLength;

    if (total > max) {
      await reader.cancel();
      return null;
    }

    chunks.push(value);
  }

  const out = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return out;
}

export const proxyRoutes = new Elysia().post(
  "/api/proxy",
  async ({ body, set }) => {
    let parsed: URL;

    try {
      parsed = new URL(body.url);
    } catch {
      set.status = 400;
      return { error: "Invalid URL" };
    }

    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      set.status = 400;
      return { error: "Only http and https schemes are allowed" };
    }

    if (isPrivateHost(parsed.hostname)) {
      set.status = 400;
      return { error: "Private/internal URLs are not allowed" };
    }

    try {
      let current = parsed.href;

      for (let hop = 0; hop <= env.MAX_REDIRECTS; hop++) {
        const response = await fetch(current, {
          redirect: "manual",
          signal: AbortSignal.timeout(env.FETCH_TIMEOUT_MS),
        });

        const isRedirect = response.status >= 300 && response.status < 400;

        if (!isRedirect) {
          const bytes = await readCapped(response, env.MAX_SPEC_SIZE);

          if (!bytes) {
            set.status = 413;
            return { error: "Response too large (max 10 MB)" };
          }

          const spec = new TextDecoder().decode(bytes);

          const contentType =
            response.headers.get("content-type") ?? "text/plain";

          return { spec, contentType };
        }

        const location = response.headers.get("location");

        if (!location) {
          set.status = 502;
          return { error: "Failed to fetch the URL" };
        }

        const next = new URL(location, current);

        if (!isAllowedTarget(next)) {
          set.status = 400;
          return {
            error: "Redirect to a disallowed or private URL was blocked",
          };
        }

        current = next.href;
      }

      set.status = 400;
      return { error: "Too many redirects" };
    } catch {
      set.status = 502;
      return { error: "Failed to fetch the URL" };
    }
  },
  {
    body: t.Object({
      url: t.String({ format: "uri", pattern: "^https?://" }),
    }),
    response: {
      200: t.Object({
        spec: t.String(),
        contentType: t.String(),
      }),
      400: t.Object({
        error: t.String(),
      }),
      413: t.Object({
        error: t.String(),
      }),
      502: t.Object({
        error: t.String(),
      }),
    },
  },
);
