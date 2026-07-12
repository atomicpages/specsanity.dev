import { cpSync, rmSync } from "node:fs";
import { basename, relative } from "node:path";
import tailwind from "bun-plugin-tailwind";

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

const entryJs = result.outputs.find(
  (o) => o.kind === "entry-point" && o.path.endsWith(".js"),
);
const entryCss =
  result.outputs.find((o) => o.kind === "asset" && o.path.endsWith(".css")) ??
  result.outputs.find((o) => o.path.endsWith(".css"));

const workerJs = workerResult.outputs.find(
  (o) => o.kind === "entry-point" && o.path.endsWith(".js"),
);

const jsPath = entryJs ? `./${basename(entryJs.path)}` : "./index.js";
const cssPath = entryCss ? `./${basename(entryCss.path)}` : "./index.css";
const workerPath = workerJs
  ? `./${basename(workerJs.path)}`
  : "./validate.worker.js";

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Spec Sanity — Sanity-check your OpenAPI specs</title>
    <meta
      name="description"
      content="Lint, configure Redocly rules, and share OpenAPI validation results."
    />
    <meta property="og:title" content="Spec Sanity" />
    <meta
      property="og:description"
      content="Lint, configure Redocly rules, and share OpenAPI validation results."
    />
    <meta property="og:url" content="https://specsanity.dev" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary" />
    <link rel="canonical" href="https://specsanity.dev" />
    <link rel="icon" href="./favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="${cssPath}" />
  </head>
  <body>
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:outline-none"
    >
      Skip to main content
    </a>
    <div id="root"></div>
    <script>window.__VALIDATE_WORKER_URL__="${workerPath}";</script>
    <script type="module" src="${jsPath}"></script>
  </body>
</html>
`;

await Bun.write("dist/index.html", html);

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
