import { Elysia, t } from "elysia";
import { env } from "../env";
import { Problem, validateSpec } from "../lib/redocly";

export const validateRoutes = new Elysia().post(
  "/api/validate",
  async ({ body, set }) => {
    try {
      const problems = await validateSpec(body.spec, body.config);

      return { problems };
    } catch (err) {
      set.status = 400;

      const message =
        err instanceof Error ? err.message : "Failed to parse spec";

      return { error: message };
    }
  },
  {
    body: t.Object({
      spec: t.String({ maxLength: env.MAX_SPEC_SIZE }),
      config: t.Object({}, { additionalProperties: true }),
    }),
    response: {
      200: t.Object({
        problems: t.Array(Problem),
      }),
      400: t.Object({
        error: t.String(),
      }),
    },
  },
);
