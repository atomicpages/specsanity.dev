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

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
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
  async ({ body }) => {
    let parsed: URL;
    try {
      parsed = new URL(body.url);
    } catch {
      return jsonError("Invalid URL", 400);
    }

    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return jsonError("Only http and https schemes are allowed", 400);
    }

    if (isPrivateHost(parsed.hostname)) {
      return jsonError("Private/internal URLs are not allowed", 400);
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
            return jsonError("Response too large (max 10 MB)", 413);
          }
          const spec = new TextDecoder().decode(bytes);
          const contentType =
            response.headers.get("content-type") ?? "text/plain";
          return { spec, contentType };
        }

        const location = response.headers.get("location");
        if (!location) {
          return jsonError("Failed to fetch the URL", 502);
        }

        const next = new URL(location, current);
        if (!isAllowedTarget(next)) {
          return jsonError(
            "Redirect to a disallowed or private URL was blocked",
            400,
          );
        }
        current = next.href;
      }

      return jsonError("Too many redirects", 400);
    } catch {
      return jsonError("Failed to fetch the URL", 502);
    }
  },
  {
    body: t.Object({
      url: t.String({ format: "uri", pattern: "^https?://" }),
    }),
  },
);
