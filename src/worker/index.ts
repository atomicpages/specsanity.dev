import { openapi } from "@elysia/openapi";
import { Elysia } from "elysia";
import { CloudflareAdapter } from "elysia/adapter/cloudflare-worker";
import { env } from "./env";
import { rateLimit } from "./lib/ratelimit";
import { proxyRoutes } from "./routes/proxy";
import { shareRoutes } from "./routes/share";

const app = new Elysia({ adapter: CloudflareAdapter })
  .use(openapi({ enabled: env.DEV_MODE }))
  .use(rateLimit)
  .use(proxyRoutes)
  .use(shareRoutes)
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 422;
      return { error: "Invalid request payload" };
    }

    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: "Not found" };
    }

    set.status = 500;
    console.error(error);

    return { error: "Internal server error" };
  })
  .compile();

export default app;
export type App = typeof app;
