// Proxies /__clerk/* to the Clerk Frontend API (production instance uses a proxy domain).
// Folder is `%5F_clerk` because Next treats `_`-prefixed folders as private (unrouted).
// Mirrors @clerk/backend/proxy, but the upstream comes from CLERK_FRONTEND_API_URL.

const PROXY_PATH = "/__clerk";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

async function proxy(request: Request): Promise<Response> {
  const base = process.env.CLERK_FRONTEND_API_URL?.replace(/\/+$/, "");
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!base || !secretKey) {
    return Response.json(
      { error: "Clerk proxy misconfigured: CLERK_FRONTEND_API_URL and CLERK_SECRET_KEY are required" },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const target = new URL(base + (url.pathname.slice(PROXY_PATH.length) || "/") + url.search);
  const upstreamHost = new URL(base).host;
  if (target.host !== upstreamHost) {
    return Response.json({ error: "Invalid proxy target" }, { status: 400 });
  }

  const forwardedHost = request.headers.get("x-forwarded-host") ?? url.host;
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const proxyUrl = `${forwardedProto}://${forwardedHost}${PROXY_PATH}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });
  // Clerk FAPI only accepts proxied requests carrying these.
  headers.set("Clerk-Proxy-Url", proxyUrl);
  headers.set("Clerk-Secret-Key", secretKey);
  headers.set("X-Forwarded-Host", forwardedHost);
  headers.set("X-Forwarded-Proto", forwardedProto);
  // fetch would decompress but keep content-encoding, corrupting the passthrough body.
  headers.set("Accept-Encoding", "identity");

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: `Clerk proxy request failed: ${message}` }, { status: 502 });
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower) || lower === "content-encoding" || lower === "set-cookie") return;
    responseHeaders.set(key, value);
  });
  for (const cookie of upstream.headers.getSetCookie()) {
    responseHeaders.append("set-cookie", cookie);
  }

  const location = upstream.headers.get("location");
  if (location) {
    const locationUrl = new URL(location, base);
    if (locationUrl.host === upstreamHost) {
      responseHeaders.set("location", proxyUrl + locationUrl.pathname + locationUrl.search + locationUrl.hash);
    }
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE, proxy as OPTIONS };
