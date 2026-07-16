import { NextResponse } from "next/server";
import { RateLimiter } from "@/lib/rate-limiter";

const defaultLimiter = new RateLimiter({
  windowMs: 60_000,
  maxRequests: 60,
});

export function withRateLimit(
  request: Request,
  options?: { windowMs?: number; maxRequests?: number },
) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const limiter = options
    ? new RateLimiter({
        windowMs: options.windowMs ?? 60_000,
        maxRequests: options.maxRequests ?? 60,
      })
    : defaultLimiter;

  const { allowed, retryAfter } = limiter.check(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(retryAfter / 1000)),
          "X-RateLimit-Limit": String(options?.maxRequests ?? 60),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  return null;
}
