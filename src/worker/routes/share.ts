import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";
import { env } from "../env";
import { getShare, putShare } from "../lib/kv";
import { toPublic } from "../lib/share-data";

const ID_PATTERN = "^[A-Za-z0-9_-]+$";
const SESSION_TOKEN_LENGTH = 32;
const SESSION_MAX_AGE = 365 * 24 * 60 * 60;

const cookieSchema = t.Cookie({
  ss_session: t.Optional(t.String()),
});

function applySessionDefaults(cookie: { ss_session: { value: string; httpOnly: boolean; sameSite: string; path: string; maxAge: number } }) {
  cookie.ss_session.httpOnly = true;
  cookie.ss_session.sameSite = "strict";
  cookie.ss_session.path = "/";
  cookie.ss_session.maxAge = SESSION_MAX_AGE;
}

export const shareRoutes = new Elysia()
  .post(
    "/api/share",
    async ({ body, cookie, set }) => {
      const id = nanoid(env.ID_LENGTH);
      const ttlDays = env.SHARE_TTL_DAYS;

      let token = cookie.ss_session.value;
      if (!token) {
        token = nanoid(SESSION_TOKEN_LENGTH);
        cookie.ss_session.value = token;
        applySessionDefaults(cookie as never);
      }

      try {
        await putShare(id, { spec: body.spec, config: body.config, sessionToken: token }, ttlDays);
      } catch {
        set.status = 500;
        return { error: "Failed to save share" };
      }

      return { id };
    },
    {
      body: t.Object({
        spec: t.String({ maxLength: 5_000_000 }),
        config: t.Object({}, { additionalProperties: true }),
      }),
      cookie: cookieSchema,
    },
  )
  .put(
    "/api/share/:id",
    async ({ params, body, cookie, set }) => {
      const sessionToken = cookie.ss_session.value;

      if (!sessionToken) {
        set.status = 403;
        return { error: "No session" };
      }

      const existing = await getShare(params.id);

      if (!existing) {
        set.status = 404;
        return { error: "Not found" };
      }

      if (existing.sessionToken !== sessionToken) {
        set.status = 403;
        return { error: "Not the owner" };
      }

      const ttlDays = env.SHARE_TTL_DAYS;

      try {
        await putShare(
          params.id,
          { spec: body.spec, config: body.config, sessionToken },
          ttlDays,
        );
      } catch {
        set.status = 500;
        return { error: "Failed to update share" };
      }

      return { id: params.id };
    },
    {
      params: t.Object({ id: t.String({ pattern: ID_PATTERN }) }),
      body: t.Object({
        spec: t.String({ maxLength: 5_000_000 }),
        config: t.Object({}, { additionalProperties: true }),
      }),
      cookie: cookieSchema,
    },
  )
  .get(
    "/api/share/:id",
    async ({ params, cookie, set }) => {
      const data = await getShare(params.id);

      if (!data) {
        set.status = 404;
        return { error: "Not found" };
      }

      const sessionToken = cookie.ss_session.value;
      const isOwner = !!sessionToken && data.sessionToken === sessionToken;

      return { ...toPublic(data), isOwner };
    },
    {
      params: t.Object({ id: t.String({ pattern: ID_PATTERN }) }),
      cookie: cookieSchema,
    },
  );
