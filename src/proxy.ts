import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { canRoleAccessRoute, resolveRole } from "@/lib/permissions";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)", "/api/webhooks(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  // 1. Allow public routes through
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // 2. Protect: user must be signed in
  const authObj = await auth.protect();

  // 3. Resolve the user's role from Clerk session claims or fallback
  const role = resolveRole((() => {
    if (authObj.sessionClaims?.metadata && typeof authObj.sessionClaims.metadata === "object") {
      const metadata = authObj.sessionClaims.metadata as Record<string, unknown>;
      if (typeof metadata.role === "string") return metadata.role;
    }
    // Also check direct claim (e.g., if role is embedded at top level of session token)
    if (typeof authObj.sessionClaims?.role === "string") {
      return authObj.sessionClaims.role as string;
    }
    return null;
  })());

  // 4. Permission check for protected routes
  const { pathname } = request.nextUrl;
  const { allowed, redirect } = canRoleAccessRoute(role, pathname);

  if (!allowed) {
    const redirectUrl = new URL(redirect, request.url);
    return NextResponse.redirect(redirectUrl);
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
