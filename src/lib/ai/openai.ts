import OpenAI from "openai";
import { logAIEvent } from "@/lib/ai/logger";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API,
  timeout: 60_000,
  maxRetries: 0,
});

const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

// Simple circuit breaker to avoid hammering a downed provider
class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private readonly threshold = 5;
  private readonly cooldownMs = 30_000;

  isOpen(): boolean {
    if (this.failures >= this.threshold) {
      if (Date.now() - this.lastFailure > this.cooldownMs) {
        logAIEvent("circuit_breaker.closed", { level: "info", errorCode: "recovery" });
        this.failures = 0;
        return false;
      }
      logAIEvent("circuit_breaker.open", { level: "warn", errorCode: "open" });
      return true;
    }
    return false;
  }

  recordFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    logAIEvent("circuit_breaker.failure", {
      level: "warn",
      errorCode: String(this.failures),
      errorMessage: `Failure ${this.failures}/${this.threshold}`,
    });
  }

  recordSuccess() {
    if (this.failures > 0) {
      logAIEvent("circuit_breaker.success", { level: "info" });
    }
    this.failures = 0;
  }
}

const circuitBreaker = new CircuitBreaker();

function isRetryableError(err: unknown): boolean {
  if (err instanceof OpenAI.APIError) {
    return (
      err.status === 429 ||
      err.status === 500 ||
      err.status === 502 ||
      err.status === 503 ||
      err.status === 504
    );
  }
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes("timeout") ||
      msg.includes("rate limit") ||
      msg.includes("network") ||
      msg.includes("econnrefused") ||
      msg.includes("econnreset") ||
      msg.includes("econnaborted") ||
      msg.includes("enotfound") ||
      msg.includes("socket hang up")
    );
  }
  return false;
}

function getRetryDelay(err: unknown, attempt: number): number {
  if (err instanceof OpenAI.APIError && err.status === 429 && err.headers?.["retry-after"]) {
    const parsed = parseInt(err.headers["retry-after"], 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 120) return parsed * 1000;
  }
  const baseDelay = attempt === 0 ? BASE_DELAY : BASE_DELAY * Math.pow(2, attempt);
  // Cap delay at 30s for 5xx errors (server needs time to recover)
  if (err instanceof OpenAI.APIError && err.status >= 500) {
    return Math.min(baseDelay, 30_000) + Math.random() * 500;
  }
  return baseDelay + Math.random() * 500;
}

export async function withRetry<T>(
  fn: (signal?: AbortSignal) => Promise<T>,
  options: { signal?: AbortSignal; attempt?: number } = {},
): Promise<T> {
  if (circuitBreaker.isOpen()) {
    logAIEvent("circuit_breaker.rejected", { level: "warn" });
    throw new Error("AI service is currently unavailable. Please try again later.");
  }

  const attempt = options.attempt ?? 0;
  try {
    const result = await fn(options.signal);
    circuitBreaker.recordSuccess();
    return result;
  } catch (err) {
    if (options.signal?.aborted) throw err;

    circuitBreaker.recordFailure();

    if (attempt < MAX_RETRIES && isRetryableError(err)) {
      const delay = getRetryDelay(err, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
      if (options.signal?.aborted) throw err;
      return withRetry(fn, { signal: options.signal, attempt: attempt + 1 });
    }
    throw err;
  }
}

export function createAIRequestConfig(): {
  model: string;
  timeout: number;
} {
  return {
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    timeout: parseInt(process.env.OPENAI_TIMEOUT ?? "60000", 10),
  };
}
