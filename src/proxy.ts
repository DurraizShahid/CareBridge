import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { InMemoryRateLimiter, PrismaRateLimiter } from "@/lib/rate-limiter";
import { canRoleAccessRoute, resolveRole } from "@/lib/permissions";

const apiLimiter = new InMemoryRateLimiter({
  windowMs: 60_000,
  maxRequests: 60,
  keyPrefix: "api",
});
const authLimiter = new PrismaRateLimiter({
  windowMs: 900_000,
  maxRequests: 20,
  keyPrefix: "auth",
});

const isPublicRoute = createRouteMatcher([
  "/",
  "/lead(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/onboarding(.*)",
  "/api/public(.*)",
  "/api/webhooks(.*)",
  "/__clerk(.*)",
]);

const isApiRoute = createRouteMatcher(["/api(.*)"]);

function getRoleFromClaims(sessionClaims: Record<string, unknown> | undefined | null): string | null {
  if (!sessionClaims || typeof sessionClaims !== "object") return null;

  const pubMeta = sessionClaims.public_metadata;
  if (pubMeta && typeof pubMeta === "object" && typeof (pubMeta as Record<string, unknown>).role === "string") {
    return (pubMeta as Record<string, unknown>).role as string;
  }

  const meta = sessionClaims.metadata;
  if (meta && typeof meta === "object" && typeof (meta as Record<string, unknown>).role === "string") {
    return (meta as Record<string, unknown>).role as string;
  }

  return null;
}

export default clerkMiddleware(
  async (auth, request: NextRequest) => {
    if (isApiRoute(request)) {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        request.headers.get("x-real-ip") ??
        "unknown";
      const isAuthSensitive =
        request.nextUrl.pathname.startsWith("/api/webhooks") ||
        request.nextUrl.pathname.startsWith("/api/invite-codes") ||
        request.nextUrl.pathname.startsWith("/api/onboarding");
      const limiter = isAuthSensitive ? authLimiter : apiLimiter;
      const { allowed, retryAfter } = await limiter.check(ip);

      if (!allowed) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: { "Retry-After": String(Math.ceil(retryAfter / 1000)) },
          },
        );
      }
    }

    if (isPublicRoute(request)) {
      return NextResponse.next();
    }

    const { userId, sessionClaims } = await auth();

    if (!userId) {
      if (isApiRoute(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set(
        "redirect_url",
        request.nextUrl.pathname + request.nextUrl.search,
      );
      return NextResponse.redirect(signInUrl);
    }

    const { pathname } = request.nextUrl;

    const role = resolveRole(getRoleFromClaims(sessionClaims as Record<string, unknown>));

    const { allowed, redirect } = canRoleAccessRoute(role, pathname);
    if (!allowed) {
      return NextResponse.redirect(new URL(redirect, request.url));
    }

    const response = NextResponse.next();

    response.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );

    return response;
  },
  {
    // Use Clerk's built-in /__clerk proxy; no custom upstream env var is required.
    frontendApiProxy: { enabled: true },
    contentSecurityPolicy: {
      strict: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": [
          "'self'",
          "https://clerk.carebridge-plum.vercel.app",
          "https://*.clerk.accounts.dev",
          "https://accounts.google.com",
          "https://apis.google.com",
        ],
        // Clerk strictly requires 'unsafe-inline' for style-src because Clerk UI components inject dynamic inline CSS at runtime without nonces.
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": [
          "'self'",
          "data:",
          "blob:",
          "https://*.storage.railway.app",
          "https://images.unsplash.com",
          "https://clerk.carebridge-plum.vercel.app",
          "https://*.clerk.accounts.dev",
          "https://lh3.googleusercontent.com",
        ],
        "connect-src": [
          "'self'",
          "https://clerk.carebridge-plum.vercel.app",
          "https://*.clerk.accounts.dev",
          "wss://*.clerk.accounts.dev",
          "https://*.storage.railway.app",
          "https://accounts.google.com",
        ],
        "frame-src": [
          "'self'",
          "https://clerk.carebridge-plum.vercel.app",
          "https://*.clerk.accounts.dev",
          "https://accounts.google.com",
        ],
        "font-src": ["'self'"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"],
      },
    },
  },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
