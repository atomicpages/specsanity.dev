import { afterEach, describe, expect, it, spyOn } from "bun:test";
import { isPrivateHost, proxyRoutes } from "./proxy";

describe("isPrivateHost", () => {
  it.each([
    ["127.0.0.1", true],
    ["10.1.2.3", true],
    ["172.16.0.1", true],
    ["172.31.255.255", true],
    ["192.168.1.1", true],
    ["169.254.169.254", true],
    ["0.0.0.0", true],
    ["::1", true],
    ["::ffff:127.0.0.1", true],
    ["[::1]", true],
    ["localhost", true],
    ["LOCALHOST", true],
    ["localhost.", true],
    ["127.0.0.1.", true],
    ["fc00::1", true],
    ["fe80::1", true],
    ["93.184.216.34", false],
    ["example.com", false],
    ["8.8.8.8", false],
    ["172.32.0.1", false],
    ["api.github.com", false],
  ] as const)("isPrivateHost(%s) => %s", (host, expected) => {
    expect(isPrivateHost(host)).toBe(expected);
  });
});

describe("proxy fetch behavior", () => {
  let fetchSpy: ReturnType<typeof spyOn<typeof globalThis, "fetch">>;

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  function proxyRequest(url: string) {
    return new Request("http://localhost/api/proxy", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    });
  }

  it("blocks redirects that point at private hosts", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: "http://127.0.0.1/" },
      }),
    );

    const res = await proxyRoutes.handle(
      proxyRequest("https://example.com/spec.yaml"),
    );
    expect(res.status).toBe(400);

    const json = (await res.json()) as { error: string };
    expect(json.error).toBe(
      "Redirect to a disallowed or private URL was blocked",
    );
  });

  it("follows redirects to public hosts and returns the spec", async () => {
    fetchSpy = spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { location: "https://cdn.example.com/spec.yaml" },
        }),
      )
      .mockResolvedValueOnce(
        new Response("openapi: 3.0.0", {
          status: 200,
          headers: { "content-type": "text/yaml" },
        }),
      );

    const res = await proxyRoutes.handle(
      proxyRequest("https://example.com/spec.yaml"),
    );
    expect(res.status).toBe(200);

    const json = (await res.json()) as { spec: string; contentType: string };
    expect(json.spec).toBe("openapi: 3.0.0");
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("rejects redirect chains that exceed the hop limit", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: "https://loop.example.com/next" },
      }),
    );

    const res = await proxyRoutes.handle(
      proxyRequest("https://example.com/spec.yaml"),
    );
    expect(res.status).toBe(400);

    const json = (await res.json()) as { error: string };
    expect(json.error).toBe("Too many redirects");
  });

  it("rejects oversized responses", async () => {
    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("x", {
        status: 200,
        headers: { "content-length": String(11 * 1024 * 1024) },
      }),
    );

    const res = await proxyRoutes.handle(
      proxyRequest("https://example.com/spec.yaml"),
    );
    expect(res.status).toBe(413);

    const json = (await res.json()) as { error: string };
    expect(json.error).toBe("Response too large (max 10 MB)");
  });
});

describe("proxy input validation", () => {
  function proxyRequest(url: string) {
    return new Request("http://localhost/api/proxy", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    });
  }

  it.each([
    ["ftp://evil.com/spec.yaml"],
    ["javascript:alert(1)"],
    ["not a url"],
    ["file:///etc/passwd"],
  ])("rejects non-http(s) url %s with 422", async (url) => {
    const res = await proxyRoutes.handle(proxyRequest(url));
    expect(res.status).toBe(422);
  });
});
