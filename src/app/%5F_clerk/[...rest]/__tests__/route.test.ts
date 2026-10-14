import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../route";

describe("/__clerk proxy", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("forwards method, path, query, body and passes set-cookie through", async () => {
    vi.stubEnv("CLERK_FRONTEND_API_URL", "https://frontend-api.clerk.services/");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test");
    const upstreamHeaders = new Headers({ location: "https://frontend-api.clerk.services/v1/client?x=1" });
    upstreamHeaders.append("set-cookie", "a=1; Path=/");
    upstreamHeaders.append("set-cookie", "b=2; Path=/");
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 302, headers: upstreamHeaders }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(
      new Request("https://app.example.com/__clerk/v1/oauth_callback?code=abc", {
        method: "POST",
        headers: { cookie: "c=3" },
        body: "payload",
      }),
    );

    const [target, init] = fetchMock.mock.calls[0];
    expect(String(target)).toBe("https://frontend-api.clerk.services/v1/oauth_callback?code=abc");
    expect(init.method).toBe("POST");
    expect(new TextDecoder().decode(init.body)).toBe("payload");
    expect(init.headers.get("cookie")).toBe("c=3");
    expect(init.headers.get("Clerk-Proxy-Url")).toBe("https://app.example.com/__clerk");
    expect(init.headers.get("Clerk-Secret-Key")).toBe("sk_test");
    expect(res.status).toBe(302);
    expect(res.headers.getSetCookie()).toEqual(["a=1; Path=/", "b=2; Path=/"]);
    expect(res.headers.get("location")).toBe("https://app.example.com/__clerk/v1/client?x=1");
  });

  it("returns 500 when CLERK_FRONTEND_API_URL is unset", async () => {
    vi.stubEnv("CLERK_FRONTEND_API_URL", "");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test");
    const res = await POST(new Request("https://app.example.com/__clerk/v1/client", { method: "POST" }));
    expect(res.status).toBe(500);
  });
});
