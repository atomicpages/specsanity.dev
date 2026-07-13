# Spec Sanity

Sanity-check your OpenAPI specs at [specsanity.dev](https://specsanity.dev).

Lint with Redocly rules, tune severity presets, and share validation results —
from a URL, paste, or file upload.

## TL;DR

Spec Sanity validates OpenAPI specifications from a URL, pasted YAML or JSON, or
a file upload. Adjust lint-rule severity to fit your API, then share a
validation result with a temporary link.

## Stack

- **Runtime:** Bun (local dev), Cloudflare Workers (production)
- **Backend:** Elysia.js on Cloudflare Workers
- **Frontend:** React 19 + Tailwind CSS v4
- **Editor:** Monaco Editor
- **Validation:** `@redocly/openapi-core`
- **Storage:** Cloudflare Workers KV (shared specs)

## Setup

### Prerequisites

- [Bun](https://bun.sh/)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) for full-stack
  Worker testing or deployment

```bash
bun install
bun run dev
```

Open http://localhost:3000/

For full-stack local testing with Cloudflare Workers:

```bash
bun run dev:worker
```

## Contributing

1. Fork the repository and create a branch for your change.
2. Make the change with focused tests where appropriate.
3. Run the same checks as CI:

```bash
bun run cf-typegen
bun run lint
bun run typecheck
bun run test
```

4. Open a pull request explaining the user-facing impact of the change.

## Build & Deploy

Deploying requires a Cloudflare account. Before the first deployment, configure
the KV namespace IDs in [`wrangler.toml`](./wrangler.toml).

```bash
bun run build
bun run deploy
```

### Custom domain

After deploying, attach `specsanity.dev` in the Cloudflare dashboard:

1. Workers & Pages → `specsanity` → Settings → Domains & Routes
2. Add custom domain: `specsanity.dev`
3. Optionally add `www.specsanity.dev` with redirect to apex

If the domain is in the same Cloudflare account, DNS is configured
automatically.

## Share links

Shared specs are available at `https://specsanity.dev/s/{id}` for 30 days
(configurable via `SHARE_TTL_DAYS`).
