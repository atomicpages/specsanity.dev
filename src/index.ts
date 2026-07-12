import { staticPlugin } from "@elysia/static";
import { Elysia } from "elysia";
import homepage from "./client/index.html";
import { proxyRoutes } from "./worker/routes/proxy";
import { shareRoutes } from "./worker/routes/share";

const workerBuild = await Bun.build({
  entrypoints: ["src/client/workers/validate.worker.ts"],
  outdir: "/tmp/specsanity-dev",
  minify: false,
  target: "browser",
});

const workerCode = workerBuild.success
  ? await workerBuild.outputs[0].text()
  : "console.error('Worker build failed');";

const app = new Elysia()
  .get("/validate.worker.js", () => {
    return new Response(workerCode, {
      headers: { "Content-Type": "application/javascript" },
    });
  })
  .use(proxyRoutes)
  .use(shareRoutes)
  .get("/s/:id", homepage)
  .use(
    await staticPlugin({
      assets: "src/client",
      prefix: "/",
      bunFullstack: true,
    }),
  )
  .listen(3000);

console.log(`Server running at http://localhost:${app.server?.port}`);
