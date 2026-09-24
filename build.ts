import { cpSync, rmSync } from "node:fs";
import { basename, relative } from "node:path";
import tailwind from "bun-plugin-tailwind";
import { Provider } from "jotai";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { redoclyBrowserPlugin } from "./src/client/workers/redocly-browser-plugin";

rmSync("dist", { recursive: true, force: true });

const result = await Bun.build({
  entrypoints: ["src/client/index.tsx"],
  outdir: "dist",
  minify: true,
  splitting: true,
  sourcemap: "external",
  target: "browser",
  plugins: [tailwind],
  naming: "[name]-[hash].[ext]",
});

if (!result.success) {
  console.error("Client build failed:");
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

const workerResult = await Bun.build({
  entrypoints: ["src/client/workers/validate.worker.ts"],
  outdir: "dist",
  minify: true,
  target: "browser",
  plugins: [redoclyBrowserPlugin],
  naming: "[name]-[hash].[ext]",
});

if (!workerResult.success) {
  console.error("Worker build failed:");
  for (const log of workerResult.logs) {
    console.error(log);
  }
  process.exit(1);
}

cpSync("src/client/assets/favicon.svg", "dist/favicon.svg");
cpSync("src/client/assets/og.png", "dist/og.png");

const entryJs = result.outputs.find(
  (o) => o.kind === "entry-point" && o.path.endsWith(".js"),
);
const entryCss =
  result.outputs.find((o) => o.kind === "asset" && o.path.endsWith(".css")) ??
  result.outputs.find((o) => o.path.endsWith(".css"));

const workerJs = workerResult.outputs.find(
  (o) => o.kind === "entry-point" && o.path.endsWith(".js"),
);

const jsPath = entryJs ? `/${basename(entryJs.path)}` : "/index.js";
const cssPath = entryCss ? `/${basename(entryCss.path)}` : "/index.css";
const workerPath = workerJs
  ? `/${basename(workerJs.path)}`
  : "/validate.worker.js";

const { App } = await import("./src/client/App");
const appHtml = renderToString(
  createElement(Provider, null, createElement(App)),
);

const jsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Spec Sanity",
  url: "https://specsanity.dev",
  description:
    "Free online OpenAPI linter powered by Redocly. Validate specs from URL, file, or paste. Configure rules, fix issues, and share results with your team.",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0" },
});

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Spec Sanity — Free Online OpenAPI Linter &amp; Validator</title>
    <meta
      name="description"
      content="Free online OpenAPI linter powered by Redocly. Validate specs from URL, file, or paste. Configure rules, fix issues, and share results with your team."
    />
    <meta property="og:title" content="Spec Sanity — Free Online OpenAPI Linter & Validator" />
    <meta
      property="og:description"
      content="Free online OpenAPI linter powered by Redocly. Validate specs from URL, file, or paste. Configure rules, fix issues, and share results with your team."
    />
    <meta property="og:url" content="https://specsanity.dev" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://specsanity.dev/og.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Spec Sanity — Free Online OpenAPI Linter & Validator" />
    <meta name="twitter:description" content="Free online OpenAPI linter powered by Redocly. Validate specs from URL, file, or paste. Configure rules, fix issues, and share results with your team." />
    <meta name="twitter:image" content="https://specsanity.dev/og.png" />
    <link rel="canonical" href="https://specsanity.dev" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="${cssPath}" />
    <script type="application/ld+json">${jsonLd}</script>
  </head>
  <body>
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:outline-none"
    >
      Skip to main content
    </a>
    <div id="root">${appHtml}</div>
    <script>window.__VALIDATE_WORKER_URL__="${workerPath}";</script>
    <script type="module" src="${jsPath}"></script>
  </body>
</html>
`;

await Bun.write("dist/index.html", html);

await Bun.write(
  "dist/_headers",
  `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains

/index.html
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; worker-src 'self'; frame-ancestors 'none'
`,
);

const allOutputs = [...result.outputs, ...workerResult.outputs];
const chunks = result.outputs.filter((o) => o.kind === "chunk");

console.log(
  `Built ${allOutputs.length} files to dist/ (${chunks.length} async chunks, 1 worker)`,
);

for (const o of allOutputs) {
  const size = o.size > 1024 ? `${(o.size / 1024).toFixed(1)}KB` : `${o.size}B`;
  console.log(
    `  ${o.kind.padEnd(12)} ${relative("dist", o.path).padEnd(30)} ${size}`,
  );
}
