import { prisma as defaultPrisma } from "@/lib/prisma";

export interface RateLimiterResult {
  allowed: boolean;
  retryAfter: number;
}

export interface RateLimiterConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

export interface IRateLimiter {
  check(key: string): Promise<RateLimiterResult> | RateLimiterResult;
  destroy?(): void;
}

export type RateLimiterInterface = IRateLimiter;

interface MemoryEntry {
  count: number;
  resetAt: number;
}

export class InMemoryRateLimiter implements IRateLimiter {
  private store = new Map<string, MemoryEntry>();
  private cleanupInterval?: ReturnType<typeof setInterval>;

  constructor(private config: RateLimiterConfig) {
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(
        () => this.cleanup(),
        config.windowMs * 2,
      );
      this.cleanupInterval.unref?.();
    }
  }

  check(key: string): RateLimiterResult {
    const prefixedKey = this.config.keyPrefix ? `${this.config.keyPrefix}:${key}` : key;
    const now = Date.now();
    const entry = this.store.get(prefixedKey);

    if (!entry || now >= entry.resetAt) {
      this.store.set(prefixedKey, { count: 1, resetAt: now + this.config.windowMs });
      return { allowed: true, retryAfter: 0 };
    }

    entry.count += 1;

    if (entry.count > this.config.maxRequests) {
      return { allowed: false, retryAfter: entry.resetAt - now };
    }

    return { allowed: true, retryAfter: 0 };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetAt) {
        this.store.delete(key);
      }
    }
  }

  destroy() {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

export class PrismaRateLimiter implements IRateLimiter {
  private cleanupTimer?: ReturnType<typeof setInterval>;
  private lastCleanup = 0;
  private cleanupIntervalMs: number;
  private fallbackLimiter: InMemoryRateLimiter;
  private client: any;

  constructor(
    private config: RateLimiterConfig,
    prismaClient?: any,
  ) {
    this.client = prismaClient ?? defaultPrisma;
    this.cleanupIntervalMs = Math.max(30_000, config.windowMs);
    this.fallbackLimiter = new InMemoryRateLimiter(config);

    if (typeof setInterval !== "undefined") {
      this.cleanupTimer = setInterval(() => {
        this.cleanupExpired().catch(() => {});
      }, this.cleanupIntervalMs);
      this.cleanupTimer.unref?.();
    }
  }

  async check(key: string): Promise<RateLimiterResult> {
    const prefixedKey = this.config.keyPrefix ? `${this.config.keyPrefix}:${key}` : key;
    const now = new Date();
    const resetAt = new Date(now.getTime() + this.config.windowMs);

    // Opportunistic cleanup of expired entries for serverless runtime instances
    if (Date.now() - this.lastCleanup > this.cleanupIntervalMs) {
      this.lastCleanup = Date.now();
      this.cleanupExpired().catch(() => {});
    }

    try {
      return await this.client.$transaction(async (tx: any) => {
        const entry = await tx.rateLimitEntry.findUnique({
          where: { key: prefixedKey },
        });

        if (!entry || entry.resetAt <= now) {
          await tx.rateLimitEntry.upsert({
            where: { key: prefixedKey },
            create: { key: prefixedKey, count: 1, resetAt },
            update: { count: 1, resetAt },
          });
          return { allowed: true, retryAfter: 0 };
        }

        if (entry.count >= this.config.maxRequests) {
          const retryAfter = Math.max(0, entry.resetAt.getTime() - now.getTime());
          return { allowed: false, retryAfter };
        }

        await tx.rateLimitEntry.update({
          where: { key: prefixedKey },
          data: { count: { increment: 1 } },
        });

        return { allowed: true, retryAfter: 0 };
      });
    } catch {
      // In case of database disconnect or unavailability, degrade gracefully to in-memory limiter
      return this.fallbackLimiter.check(key);
    }
  }

  async cleanupExpired(): Promise<number> {
    try {
      const res = await this.client.rateLimitEntry.deleteMany({
        where: { resetAt: { lt: new Date() } },
      });
      return res.count;
    } catch {
      return 0;
    }
  }

  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.fallbackLimiter.destroy();
  }
}

// Default export aliases for backwards compatibility
export {
  InMemoryRateLimiter as RateLimiter,
  InMemoryRateLimiter as MemoryRateLimiter,
  PrismaRateLimiter as DatabaseRateLimiter,
};
