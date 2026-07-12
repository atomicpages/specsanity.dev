# Worker

Cloudflare Workers backend for Spec Sanity. Deployed via `wrangler deploy`.

## Entry Points

- **`index.ts`** -- Worker entry. Elysia app with `CloudflareAdapter`. Wrangler
  bundles this directly from source (not via `build.ts`).
- **`src/index.ts`** (parent dir) -- Local dev entry using Bun. Shares route
  modules but uses a `cloudflare:workers` shim via `src/dev-shim.ts`.

## Bindings (wrangler.toml)

| Binding            | Type      | Description                                  |
| ------------------ | --------- | -------------------------------------------- |
| `specsanity`       | KV        | Shared spec/config storage                   |
| `API_RATE_LIMITER` | RateLimit | 60 req/60s per IP+path                       |
| `DEV_MODE`         | Var       | `bool`, default `false`. Gates OpenAPI docs. |
| `SHARE_TTL_DAYS`   | Var       | Days before KV entries expire (30)           |
| `ID_LENGTH`        | Var       | nanoid length for share IDs (8)              |
| `MAX_SPEC_SIZE`    | Var       | Max spec bytes (10 MB)                       |
| `MAX_REDIRECTS`    | Var       | Proxy redirect limit (3)                     |
| `FETCH_TIMEOUT_MS` | Var       | Proxy fetch timeout (10 000)                 |

## Conventions

- All CF-specific modules use **static ESM import**
  (`import { env } from "cloudflare:workers"`). Do NOT use `require()`.
- `env.ts` validates and coerces vars via `envalid`. All route/lib modules
  import `env` from here.
- `lib/kv.ts` accesses the KV binding through `env.specsanity`. The file-based
  fallback for local dev lives in `src/dev-shim.ts`, not here.
- Rate limiting (`lib/ratelimit.ts`) is optional -- gracefully skipped when the
  binding is absent.

## Directory Layout

```
worker/
├── env.ts              # Validated env vars
├── index.ts            # Worker entry (Elysia + CloudflareAdapter)
├── lib/
│   ├── kv.ts           # KV get/put for shared specs
│   ├── ratelimit.ts    # Rate-limit middleware
│   ├── ratelimit-key.ts
│   └── share-data.ts   # ShareData types and helpers
└── routes/
    ├── proxy.ts        # POST /api/proxy (SSRF-safe URL fetch)
    └── share.ts        # CRUD /api/share (KV-backed)
```

## Notes

- OpenAPI validation runs **client-side** in a Web Worker
  (`src/client/workers/validate.worker.ts`). It was moved out of the CF Worker
  because `@redocly/ajv` uses `new Function()` at request time, which Cloudflare
  Workers permanently blocks.
