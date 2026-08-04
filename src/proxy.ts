import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { RateLimiter } from "@/lib/rate-limiter";
import { canRoleAccessRoute, resolveRole, HOSPITAL_ROLES } from "@/lib/permissions";

const apiLimiter = new RateLimiter({ windowMs: 60_000, maxRequests: 60 });
const authLimiter = new RateLimiter({ windowMs: 900_000, maxRequests: 20 });

const isPublicRoute = createRouteMatcher([
  "/",
  "/lead(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/onboarding(.*)",
  "/api/public(.*)",
  "/api/webhooks(.*)",
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
      const limiter = request.nextUrl.pathname.startsWith("/api/webhooks")
        ? authLimiter
        : apiLimiter;
      const { allowed, retryAfter } = limiter.check(ip);

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

    const authObj = await auth.protect();
    const { pathname } = request.nextUrl;

    const role = resolveRole(getRoleFromClaims(authObj.sessionClaims as Record<string, unknown>));

    if (pathname === "/dashboard" && HOSPITAL_ROLES.includes(role as any)) {
      return NextResponse.redirect(new URL("/dashboard/home", request.url));
    }

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
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": [
          "'self'",
          "data:",
          "blob:",
          "https://*.storage.railway.app",
        ],
        "connect-src": [
          "'self'",
          "https://*.clerk.accounts.dev",
          "wss://*.clerk.accounts.dev",
          "https://*.storage.railway.app",
        ],
        "frame-src": ["'self'", "https://*.clerk.accounts.dev"],
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
