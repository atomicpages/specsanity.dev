# OpenAPI/Swagger Validator

There are several server-side validators for OpenAPI/Swagger specs, and they all
aren't terribly great. The server-side ones are slow and lack configuration and
the client-side ones are inflexible. We can do better. We can build an OpenAPI
validation website that supports sharing results, specs, allows for
configuration, etc; all powered by
[`@redocly/openapi-core`](https://www.npmjs.com/package/@redocly/openapi-core).

## Tech Stack

- **Runtime:** Bun (local dev), Cloudflare Workers (production)
- **Backend:** Elysia.js on Cloudflare Workers with `node_compat` enabled
- **Frontend:** React 19 + Tailwind CSS v4, bundled via Bun HTML imports
- **Editor:** Monaco Editor (`@monaco-editor/react`)
- **Type Safety:** Eden Treaty for end-to-end typed API calls between client and
  Worker
- **Storage:** Cloudflare Workers KV for shared spec storage
- **Deployment:** Single Worker with Wrangler `--assets` binding for static
  files

## Spec Input

Users must be able to provide an OpenAPI/Swagger spec (OAPI) via three methods:

1. **URL** — paste a URL to a remote OAPI spec. The Worker fetches the spec
   server-side to avoid CORS issues.
2. **Paste** — paste raw YAML or JSON directly into a text area.
3. **Upload** — drag-and-drop or file picker for `.yaml`, `.yml`, and `.json`
   files.

These three input methods are presented on a dedicated landing page. Once a spec
is loaded, the user transitions to the editor view. A "New Spec" action in the
header returns the user to the landing page.

## Validation

Validation is performed server-side by the Cloudflare Worker using
`@redocly/openapi-core`. This avoids browser compatibility issues with the
library and allows the Worker to resolve external `$ref`s natively.

- Validation is triggered explicitly via a "Validate" button — there is no
  auto-validation on edit.
- The client sends the spec content and the current Redocly configuration to the
  Worker.
- The Worker returns a list of problems, each containing: severity (error or
  warning), message, rule ID, and source location (line and column).

## Editor View

Once a spec is loaded, the user sees a three-panel layout:

- **Editor (left, ~70%)** — a Monaco Editor instance displaying the spec in YAML
  or JSON with syntax highlighting, code folding, and find/replace.
- **Configuration (right, ~30%)** — the Redocly configuration panel (see
  below). Panes are resizable.
- **Problems (bottom, full width)** — the validation results panel (see below).

The header bar contains: app title/logo, theme toggle, "Validate" button,
"Share" button, and "New Spec" button.

## Validation Results

Validation results are displayed in two complementary ways:

1. **Inline diagnostics** — Monaco editor markers (squiggly underlines) with
   hover tooltips showing the error/warning message and rule ID.
2. **Problems panel** — a scrollable list of all errors and warnings. Each row
   shows a severity icon, the message, source location (line:column), and the
   rule ID. The rule ID links to the corresponding Redocly documentation page at
   `https://redocly.com/docs/cli/rules/{ruleId}`. Clicking a row scrolls the
   Monaco editor to the relevant line.

A summary bar displays total counts (e.g., "3 errors, 12 warnings"). The list
is filterable by severity.

## Redocly Configuration

The configuration panel gives users control over which Redocly rules are
applied. Configuration is modeled as a `RawUniversalConfig` from
`@redocly/openapi-core`.

The panel has two modes:

1. **Structured UI (default)** — a preset selector ("Minimal," "Recommended,"
   "Strict") populates a list of rules. Each rule displays its name and a
   severity dropdown (error, warn, off). Users can override individual rules
   after selecting a preset.
2. **Raw YAML** — a secondary Monaco instance for editing Redocly configuration
   as raw YAML. This supports decorators, preprocessors, and any advanced
   options not exposed in the structured UI.

The two modes sync bidirectionally: changes in the structured UI update the raw
YAML and vice versa. The "Recommended" preset is selected by default.

## Sharing

Users can share their current spec and configuration via a short link.

- Clicking "Share" sends the spec content and configuration to the Worker, which
  stores the bundle in Cloudflare KV under a nanoid-generated key.
- The resulting URL (`https://specsanity.dev/s/{id}`) is copied to the user's
  clipboard with a confirmation toast.
- When someone opens a share link, the Worker retrieves the bundle from KV and
  the client populates the editor with the spec and configuration, navigating
  directly to the editor view.
- KV entries expire after 30 days by default. The TTL is configurable via the
  `SHARE_TTL_DAYS` environment variable.
- URL-based specs do not require KV storage — the spec URL and config can be
  encoded in the URL hash fragment.

## Dark Mode and Light Mode

The app supports both dark and light themes.

- On first visit, the theme follows the user's operating system preference via
  `prefers-color-scheme`.
- A manual toggle in the header allows the user to override the system
  preference.
- The override is persisted in `localStorage` and respected on subsequent
  visits.
- Monaco Editor themes (`vs` for light, `vs-dark` for dark) sync with the app
  theme.

## Deployment

The app is deployed as a single Cloudflare Worker.

- Wrangler's `assets` binding serves the built frontend (React + Tailwind)
  from the edge.
- The Worker script handles API routes (`/api/validate`, `/api/proxy`,
  `/api/share`).
- Local development uses `Bun.serve()` with HTML imports for the frontend and
  `wrangler dev` for full-stack integration testing.
