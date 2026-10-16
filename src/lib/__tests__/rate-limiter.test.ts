import { describe, it, expect, vi, beforeEach } from "vitest";
import { InMemoryRateLimiter, PrismaRateLimiter } from "../rate-limiter";

describe("CB-005: Pluggable RateLimiter (In-Memory and Database-backed)", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  describe("InMemoryRateLimiter", () => {
    it("allows requests up to maxRequests and blocks subsequent requests", () => {
      const limiter = new InMemoryRateLimiter({ windowMs: 10_000, maxRequests: 2 });
      const r1 = limiter.check("1.2.3.4");
      expect(r1.allowed).toBe(true);
      expect(r1.retryAfter).toBe(0);

      const r2 = limiter.check("1.2.3.4");
      expect(r2.allowed).toBe(true);

      const r3 = limiter.check("1.2.3.4");
      expect(r3.allowed).toBe(false);
      expect(r3.retryAfter).toBeGreaterThan(0);

      limiter.destroy();
    });

    it("differentiates keys and respects keyPrefix", () => {
      const limiterA = new InMemoryRateLimiter({ windowMs: 10_000, maxRequests: 1, keyPrefix: "auth" });
      const limiterB = new InMemoryRateLimiter({ windowMs: 10_000, maxRequests: 1, keyPrefix: "api" });

      expect(limiterA.check("user-1").allowed).toBe(true);
      expect(limiterA.check("user-1").allowed).toBe(false);

      // Same key in limiterB should not collide with limiterA
      expect(limiterB.check("user-1").allowed).toBe(true);

      limiterA.destroy();
      limiterB.destroy();
    });
  });

  describe("PrismaRateLimiter", () => {
    it("records entries in Prisma database and tracks count across transactions", async () => {
      let storedEntry: { key: string; count: number; resetAt: Date } | null = null;

      const prismaMock = {
        $transaction: vi.fn().mockImplementation(async (callback) => {
          const tx = {
            rateLimitEntry: {
              findUnique: vi.fn().mockImplementation(({ where: { key } }) => {
                return storedEntry && storedEntry.key === key ? { ...storedEntry } : null;
              }),
              upsert: vi.fn().mockImplementation(({ create }) => {
                storedEntry = { ...create };
                return storedEntry;
              }),
              update: vi.fn().mockImplementation(({ data: { count } }) => {
                if (storedEntry) {
                  storedEntry.count += count.increment;
                }
                return storedEntry;
              }),
            },
          };
          return callback(tx);
        }),
        rateLimitEntry: {
          deleteMany: vi.fn().mockResolvedValue({ count: 3 }),
        },
      };

      const limiter = new PrismaRateLimiter(
        { windowMs: 60_000, maxRequests: 2, keyPrefix: "auth" },
        prismaMock,
      );

      const res1 = await limiter.check("192.0.2.1");
      expect(res1.allowed).toBe(true);
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(storedEntry).toMatchObject({ key: "auth:192.0.2.1", count: 1 });

      const res2 = await limiter.check("192.0.2.1");
      expect(res2.allowed).toBe(true);
      expect(storedEntry).toMatchObject({ key: "auth:192.0.2.1", count: 2 });

      const res3 = await limiter.check("192.0.2.1");
      expect(res3.allowed).toBe(false);
      expect(res3.retryAfter).toBeGreaterThan(0);

      // Periodic cleanup
      const deletedCount = await limiter.cleanupExpired();
      expect(deletedCount).toBe(3);
      expect(prismaMock.rateLimitEntry.deleteMany).toHaveBeenCalled();

      limiter.destroy();
    });

    it("gracefully falls back to in-memory rate limiting when database fails", async () => {
      const failingPrismaMock = {
        $transaction: vi.fn().mockRejectedValue(new Error("Database connection refused")),
        rateLimitEntry: {
          deleteMany: vi.fn().mockRejectedValue(new Error("DB error")),
        },
      };

      const limiter = new PrismaRateLimiter(
        { windowMs: 60_000, maxRequests: 1, keyPrefix: "fallback" },
        failingPrismaMock,
      );

      const res1 = await limiter.check("10.0.0.1");
      expect(res1.allowed).toBe(true);

      const res2 = await limiter.check("10.0.0.1");
      expect(res2.allowed).toBe(false);

      limiter.destroy();
    });
  });
});
