import { describe, expect, it } from "bun:test";
import { shareRoutes } from "./share";

function postShare(spec: string, config = {}, cookie?: string) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (cookie) {
    headers.cookie = cookie;
  }
  return new Request("http://localhost/api/share", {
    method: "POST",
    headers,
    body: JSON.stringify({ spec, config }),
  });
}

function putShare(id: string, spec: string, config = {}, cookie?: string) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (cookie) {
    headers.cookie = cookie;
  }
  return new Request(`http://localhost/api/share/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ spec, config }),
  });
}

function getShare(id: string, cookie?: string) {
  const headers: Record<string, string> = {};
  if (cookie) {
    headers.cookie = cookie;
  }
  return new Request(`http://localhost/api/share/${id}`, { headers });
}

describe("POST /api/share", () => {
  it("creates a share and sets session cookie", async () => {
    const res = await shareRoutes.handle(postShare("openapi: 3.0.0"));
    expect(res.status).toBe(201);

    const json = (await res.json()) as { id: string };
    expect(json.id).toBeDefined();
    expect(json.id.length).toBeGreaterThan(0);

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("ss_session=");
    expect(setCookie).toContain("HttpOnly");
  });

  it("reuses existing session cookie (no new set-cookie)", async () => {
    const res = await shareRoutes.handle(
      postShare("openapi: 3.0.0", {}, "ss_session=my-existing-token"),
    );
    expect(res.status).toBe(201);

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeNull();
  });
});

describe("PUT /api/share/:id", () => {
  it("allows owner to update their share", async () => {
    const createRes = await shareRoutes.handle(postShare("v1"));
    const { id } = (await createRes.json()) as { id: string };
    const cookie = createRes.headers.get("set-cookie")?.split(";")[0];

    const updateRes = await shareRoutes.handle(putShare(id, "v2", {}, cookie));
    expect(updateRes.status).toBe(200);

    const updateJson = (await updateRes.json()) as { id: string };
    expect(updateJson.id).toBe(id);

    const getRes = await shareRoutes.handle(getShare(id));
    const data = (await getRes.json()) as { spec: string };
    expect(data.spec).toBe("v2");
  });

  it("rejects update without session cookie", async () => {
    const createRes = await shareRoutes.handle(postShare("v1"));
    const { id } = (await createRes.json()) as { id: string };

    const updateRes = await shareRoutes.handle(putShare(id, "v2"));
    expect(updateRes.status).toBe(403);
  });

  it("rejects update with wrong session cookie", async () => {
    const createRes = await shareRoutes.handle(postShare("v1"));
    const { id } = (await createRes.json()) as { id: string };

    const updateRes = await shareRoutes.handle(
      putShare(id, "v2", {}, "ss_session=wrong-token"),
    );
    expect(updateRes.status).toBe(403);
  });

  it("returns 404 for non-existent share", async () => {
    const res = await shareRoutes.handle(
      putShare("nonexistent", "v2", {}, "ss_session=any"),
    );
    expect(res.status).toBe(404);
  });
});

describe("GET /api/share/:id", () => {
  it("returns isOwner=true when cookie matches", async () => {
    const createRes = await shareRoutes.handle(postShare("spec-content"));
    const { id } = (await createRes.json()) as { id: string };
    const cookie = createRes.headers.get("set-cookie")?.split(";")[0];

    const getRes = await shareRoutes.handle(getShare(id, cookie));
    const data = (await getRes.json()) as { spec: string; isOwner: boolean };
    expect(data.spec).toBe("spec-content");
    expect(data.isOwner).toBe(true);
  });

  it("returns isOwner=false when no cookie", async () => {
    const createRes = await shareRoutes.handle(postShare("spec-content"));
    const { id } = (await createRes.json()) as { id: string };

    const getRes = await shareRoutes.handle(getShare(id));
    const data = (await getRes.json()) as { spec: string; isOwner: boolean };
    expect(data.spec).toBe("spec-content");
    expect(data.isOwner).toBe(false);
  });

  it("returns isOwner=false when cookie does not match", async () => {
    const createRes = await shareRoutes.handle(postShare("spec-content"));
    const { id } = (await createRes.json()) as { id: string };

    const getRes = await shareRoutes.handle(getShare(id, "ss_session=other"));
    const data = (await getRes.json()) as { isOwner: boolean };
    expect(data.isOwner).toBe(false);
  });

  it("does not leak sessionToken in response", async () => {
    const createRes = await shareRoutes.handle(postShare("spec"));
    const { id } = (await createRes.json()) as { id: string };

    const getRes = await shareRoutes.handle(getShare(id));
    const data = (await getRes.json()) as Record<string, unknown>;
    expect(data.sessionToken).toBeUndefined();
  });

  it("returns 404 for non-existent share", async () => {
    const res = await shareRoutes.handle(getShare("doesnotexist"));
    expect(res.status).toBe(404);
  });
});
