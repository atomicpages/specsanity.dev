# Spec Sanity

Sanity-check your OpenAPI specs at [specsanity.dev](https://specsanity.dev).

Lint with Redocly rules, tune severity presets, and share validation results — from a URL, paste, or file upload.

## Stack

- **Runtime:** Bun (local dev), Cloudflare Workers (production)
- **Backend:** Elysia.js on Cloudflare Workers
- **Frontend:** React 19 + Tailwind CSS v4
- **Editor:** Monaco Editor
- **Validation:** `@redocly/openapi-core`
- **Storage:** Cloudflare Workers KV (shared specs)

## Development

```bash
bun install
bun run dev
```

Open http://localhost:3000/

Full-stack local testing with Wrangler:

```bash
bun run dev:worker
```

## Build & Deploy

```bash
bun run build
bun run deploy
```

### Custom domain

After deploying, attach `specsanity.dev` in the Cloudflare dashboard:

1. Workers & Pages → `specsanity` → Settings → Domains & Routes
2. Add custom domain: `specsanity.dev`
3. Optionally add `www.specsanity.dev` with redirect to apex

If the domain is in the same Cloudflare account, DNS is configured automatically.

## Share links

Shared specs are available at `https://specsanity.dev/s/{id}` for 30 days (configurable via `SHARE_TTL_DAYS`).
