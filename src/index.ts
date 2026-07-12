import { staticPlugin } from "@elysia/static";
import { Elysia } from "elysia";
import homepage from "./client/index.html";
import { proxyRoutes } from "./worker/routes/proxy";
import { shareRoutes } from "./worker/routes/share";
import { validateRoutes } from "./worker/routes/validate";

const app = new Elysia()
  .use(validateRoutes)
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
