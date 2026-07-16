interface RateLimiterEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterResult {
  allowed: boolean;
  retryAfter: number;
}

export interface RateLimiterConfig {
  windowMs: number;
  maxRequests: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimiterEntry>();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(private config: RateLimiterConfig) {
    this.cleanupInterval = setInterval(
      () => this.cleanup(),
      config.windowMs * 2,
    );
  }

  check(key: string): RateLimiterResult {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now >= entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.config.windowMs });
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
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}
