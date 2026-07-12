import { Elysia, t } from "elysia";
import { env } from "../env";
import { validateSpec } from "../lib/redocly";

export const validateRoutes = new Elysia().post(
  "/api/validate",
  async ({ body }) => {
    try {
      const problems = await validateSpec(body.spec, body.config);
      return { problems };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to parse spec";
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
  {
    body: t.Object({
      spec: t.String({ maxLength: env.MAX_SPEC_SIZE }),
      config: t.Object({}, { additionalProperties: true }),
    }),
  },
);
