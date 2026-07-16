import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { canRoleAccessRoute, resolveRole, HOSPITAL_ROLES } from "@/lib/permissions";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)", "/onboarding(.*)", "/api/webhooks(.*)"]);

function getRoleFromClaims(sessionClaims: Record<string, unknown> | undefined | null): string | null {
  if (!sessionClaims || typeof sessionClaims !== "object") return null;

  // Clerk stores public metadata in the JWT as public_metadata (snake_case)
  const pubMeta = sessionClaims.public_metadata;
  if (pubMeta && typeof pubMeta === "object" && typeof (pubMeta as Record<string, unknown>).role === "string") {
    return (pubMeta as Record<string, unknown>).role as string;
  }

  // Fallback: check metadata (some Clerk configs use this key)
  const meta = sessionClaims.metadata;
  if (meta && typeof meta === "object" && typeof (meta as Record<string, unknown>).role === "string") {
    return (meta as Record<string, unknown>).role as string;
  }

  return null;
}

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  const authObj = await auth.protect();
  const { pathname } = request.nextUrl;

  const role = resolveRole(getRoleFromClaims(authObj.sessionClaims as Record<string, unknown>));

  // Redirect hospital-role users from /dashboard to /dashboard/home
  if (pathname === "/dashboard" && HOSPITAL_ROLES.includes(role as any)) {
    return NextResponse.redirect(new URL("/dashboard/home", request.url));
  }

  // Permission check for other protected routes
  const { allowed, redirect } = canRoleAccessRoute(role, pathname);
  if (!allowed) {
    return NextResponse.redirect(new URL(redirect, request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
