import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerOrganization } from "@/lib/server-organization";
import { openai, withRetry } from "@/lib/ai/openai";
import { AI_TOOLS } from "@/lib/ai/tools";
import { toolHandlers, type ToolHandlerContext } from "@/lib/ai/tool-handlers";
import { SYSTEM_PROMPT } from "@/lib/ai/prompt";
import type { Facility } from "@/types";
import { logAIEvent, logAIError } from "@/lib/ai/logger";

function combineAbortSignals(...signals: AbortSignal[]): [AbortSignal, () => void] {
  const controller = new AbortController();
  const cleanups: (() => void)[] = [];
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return [controller.signal, () => {}];
    }
    const handler = () => controller.abort(signal.reason);
    signal.addEventListener("abort", handler, { once: true });
    cleanups.push(() => signal.removeEventListener("abort", handler));
  }
  return [controller.signal, () => cleanups.forEach((fn) => fn())];
}

const encoder = new TextEncoder();

function safeStringify(value: unknown): string {
  try {
    const s = JSON.stringify(value);
    return s ?? "null";
  } catch {
    return JSON.stringify({ error: "Failed to serialize result" });
  }
}

// Rate limiter: 20 req/min per userId sliding window
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 20;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW;
  let timestamps = rateLimitMap.get(key);
  if (!timestamps) {
    timestamps = [];
    rateLimitMap.set(key, timestamps);
  } else {
    // Prune stale entries in-place
    let i = 0;
    while (i < timestamps.length && timestamps[i] < cutoff) i++;
    if (i > 0) timestamps.splice(0, i);
  }
  if (timestamps.length >= RATE_LIMIT_MAX) return false;
  timestamps.push(now);
  return true;
}

// Periodic cleanup of stale rate-limit entries (don't block process exit)
setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW;
  for (const [key, timestamps] of rateLimitMap) {
    const recent = timestamps.filter((t) => t >= cutoff);
    if (recent.length === 0) rateLimitMap.delete(key);
    else rateLimitMap.set(key, recent);
  }
}, 60_000).unref();

// Per-user concurrency limiter: max 3 concurrent streams
const activeStreams = new Map<string, number>();
const MAX_CONCURRENT_STREAMS = 3;

function acquireStreamSlot(userId: string): boolean {
  const current = activeStreams.get(userId) ?? 0;
  if (current >= MAX_CONCURRENT_STREAMS) return false;
  activeStreams.set(userId, current + 1);
  return true;
}

function releaseStreamSlot(userId: string): void {
  const current = activeStreams.get(userId) ?? 0;
  if (current <= 1) activeStreams.delete(userId);
  else activeStreams.set(userId, current - 1);
}

// Tool handler timeout: 15s
function withTimeout<T>(fn: () => Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Tool handler timed out")), ms);
    fn().then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

// Jailbreak pattern detection
const JAILBREAK_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(all\s+)?prior\s+instructions/i,
  /ignore\s+(all\s+)?your\s+(system\s+)?prompt/i,
  /ignore\s+(all\s+)?safety/i,
  /you\s+are\s+(now\s+)?(in\s+)?developer\s+mode/i,
  /you\s+are\s+(now\s+)?(an?\s+)?unrestricted/i,
  /output\s+(your\s+)?(complete\s+)?prompt/i,
  /output\s+(your\s+)?(complete\s+)?configuration/i,
  /reveal\s+(your\s+)?(system\s+)?prompt/i,
  /print\s+(your\s+)?(system\s+)?prompt/i,
  /show\s+(your\s+)?(system\s+)?prompt/i,
  /display\s+(your\s+)?(system\s+)?prompt/i,
  /repeat\s+(the\s+)?(words\s+)?(above\s+)?(starting\s+with\s+)?["']/i,
  /\bDAN\b/i,
];

function containsJailbreakPattern(text: string): boolean {
  return JAILBREAK_PATTERNS.some((pattern) => pattern.test(text));
}

// Per-request state
function createPerRequestState() {
  return {
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalToolCalls: 0,
  };
}

function startKeepAlive(controller: ReadableStreamDefaultController, intervalMs = 15_000): ReturnType<typeof setInterval> {
  return setInterval(() => {
    try {
      controller.enqueue(encoder.encode(": keepalive\n\n"));
    } catch {
      // stream already closed
    }
  }, intervalMs);
}

function sseEvent(event: string, data: string): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${data}\n\n`);
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID().slice(0, 8);
  let userId: string | undefined;
  let org: Awaited<ReturnType<typeof getServerOrganization>> | null = null;
  let slotAcquired = false;
  try {
    const authResult = await auth();
    userId = authResult.userId ?? undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Content-length check (fastest reject, no rate-limit slot consumed)
    const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
    if (contentLength > 524288) {
      return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }

    // Rate limit check
    if (!checkRateLimit(userId)) {
      logAIEvent("rate_limit", {
        level: "warn",
        requestId,
        userId,
        retryAfter: 60,
      });
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": "60", "X-Request-Id": requestId } },
      );
    }

    // Concurrency limit check
    if (!acquireStreamSlot(userId)) {
      logAIEvent("concurrency_limit", {
        level: "warn",
        requestId,
        userId,
      });
      return NextResponse.json(
        { error: "Too many concurrent requests. Please wait for existing requests to complete." },
        { status: 429, headers: { "Retry-After": "30", "X-Request-Id": requestId } },
      );
    }
    slotAcquired = true;

    org = await getServerOrganization();
    if (!org?.organizationId) {
      return NextResponse.json(
        { error: "No organization context" },
        { status: 400 },
      );
    }

    const { messages: rawMessages } = await req.json();
    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 },
      );
    }

    // Validate message count
    if (rawMessages.length > 50) {
      return NextResponse.json(
        { error: "Too many messages (max 50)" },
        { status: 400 },
      );
    }

    const resolvedOrg = org;
    const currentOrgId = resolvedOrg.organizationId;

    // Validate and process messages
    const MAX_MESSAGE_LENGTH = 10000;
    let totalChars = 0;
    const validMessages: { role: "user" | "assistant"; content: string }[] = [];

    for (const msg of rawMessages) {
      if (!msg || typeof msg !== "object") {
        return NextResponse.json(
          { error: "Invalid message format" },
          { status: 400 },
        );
      }
      if (msg.role !== "user" && msg.role !== "assistant") {
        return NextResponse.json(
          { error: "Invalid message role. Only 'user' and 'assistant' roles are accepted." },
          { status: 400 },
        );
      }
      if (typeof msg.content !== "string") {
        return NextResponse.json(
          { error: "Message content must be a string" },
          { status: 400 },
        );
      }
      if (msg.content.length > MAX_MESSAGE_LENGTH) {
        return NextResponse.json(
          { error: "Message content too long (max 10,000 characters)" },
          { status: 400 },
        );
      }
      totalChars += msg.content.length;
      if (totalChars > 500000) {
        return NextResponse.json(
          { error: "Total message size too large" },
          { status: 400 },
        );
      }

      // Check for jailbreak patterns in user messages only
      if (msg.role === "user" && containsJailbreakPattern(msg.content)) {
        logAIEvent("jailbreak_detected", {
          level: "warn",
          requestId,
          userId,
          organizationId: currentOrgId,
        });
        return NextResponse.json(
          { error: "Message contains prohibited instructions" },
          { status: 400 },
        );
      }

      validMessages.push({ role: msg.role, content: msg.content });
    }

    const ctx: ToolHandlerContext = {
      organizationId: currentOrgId,
      role: resolvedOrg.role,
      userId,
    };

    // History truncation: keep last 20 messages
    const MAX_HISTORY = 20;
    const trimmedMessages = validMessages.length > MAX_HISTORY
      ? validMessages.slice(-MAX_HISTORY)
      : validMessages;

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(validMessages.length > MAX_HISTORY
        ? [{ role: "system" as const, content: "[Earlier messages omitted]" }]
        : []),
      ...trimmedMessages,
    ];

    const startTime = Date.now();

    req.signal.addEventListener("abort", () => {
      logAIEvent("chat.client_disconnect", {
        level: "warn",
        requestId,
        userId,
        organizationId: currentOrgId,
        duration: Date.now() - startTime,
      });
    });

    logAIEvent("chat.request", {
      level: "info",
      requestId,
      userId,
      organizationId: currentOrgId,
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messageCount: messages.length,
    });

    const state = createPerRequestState();
    // Abort controller shared between cancel() and start() for client-disconnect handling
    let currentAbortController: AbortController | null = null;

    const stream = new ReadableStream({
      cancel() {
        currentAbortController?.abort();
        logAIEvent("chat.stream_cancelled", {
          level: "warn",
          requestId,
          userId,
          organizationId: currentOrgId,
        });
      },
      async start(controller) {
        let keepAliveHandle: ReturnType<typeof setInterval> | undefined;
        let flushTimer: ReturnType<typeof setTimeout> | null = null;
        let chunkWatchdog: ReturnType<typeof setTimeout> | null = null;
        let textBuffer = "";
        const FLUSH_INTERVAL = 30;

        const flushTextBuffer = () => {
          if (textBuffer) {
            try {
              controller.enqueue(sseEvent("text", JSON.stringify(textBuffer)));
              textBuffer = "";
            } catch {}
          }
          flushTimer = null;
        };

        try {
          keepAliveHandle = startKeepAlive(controller);
          const currentMessages: any[] = messages;
          let maxRounds = 5;

          while (maxRounds > 0) {
            const round = 5 - maxRounds + 1;
            maxRounds--;
            logAIEvent("chat.round_start", {
              level: "debug",
              requestId,
              round,
              messageCount: currentMessages.length,
            });

            currentAbortController = new AbortController();
            const onClientAbort = () => currentAbortController!.abort();
            req.signal.addEventListener("abort", onClientAbort, { once: true });

            const completion = await withRetry(
              async (signal) => {
                const [mergedSignal, cleanupSignals] = signal
                  ? combineAbortSignals(signal, currentAbortController!.signal)
                  : [currentAbortController!.signal, () => {}];
                try {
                  return await openai.chat.completions.create({
                    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
                    messages: currentMessages,
                    tools: AI_TOOLS,
                    stream: true,
                    temperature: 0.7,
                    max_tokens: 2048,
                    stream_options: { include_usage: true },
                  }, { signal: mergedSignal });
                } finally {
                  cleanupSignals();
                }
              },
              { signal: currentAbortController!.signal },
            );
            req.signal.removeEventListener("abort", onClientAbort);

            let fullContent = "";
            const toolCallAccumulators: Record<
              number,
              {
                id: string;
                type: "function";
                function: { name: string; arguments: string };
              }
            > = {};

            // Per-chunk watchdog: abort if no chunk arrives for 60s
            const CHUNK_TIMEOUT = 60_000;
            function resetChunkWatchdog() {
              if (chunkWatchdog) clearTimeout(chunkWatchdog);
              chunkWatchdog = setTimeout(() => currentAbortController?.abort(), CHUNK_TIMEOUT);
            }
            resetChunkWatchdog();

            for await (const chunk of completion) {
              resetChunkWatchdog();
              if (currentAbortController?.signal.aborted) break;

              const choice = chunk.choices?.[0];
              if (!choice) continue;

              const delta = choice.delta;

              if (delta?.content) {
                fullContent += delta.content;
                textBuffer += delta.content;
                if (!flushTimer) {
                  flushTimer = setTimeout(flushTextBuffer, FLUSH_INTERVAL);
                }
              }

              if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const idx = tc.index;
                  if (!toolCallAccumulators[idx]) {
                    toolCallAccumulators[idx] = {
                      id: "",
                      type: "function",
                      function: { name: "", arguments: "" },
                    };
                  }
                  if (tc.id) toolCallAccumulators[idx].id += tc.id;
                  if (tc.function?.name)
                    toolCallAccumulators[idx].function.name +=
                      tc.function.name;
                  if (tc.function?.arguments)
                    toolCallAccumulators[idx].function.arguments +=
                      tc.function.arguments;
                }
              }

              if (chunk.usage) {
                state.totalPromptTokens = chunk.usage.prompt_tokens;
                state.totalCompletionTokens = chunk.usage.completion_tokens;
              }
            }

            if (chunkWatchdog) { clearTimeout(chunkWatchdog); chunkWatchdog = null; }

            const toolCalls = Object.values(toolCallAccumulators);

            if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
            flushTextBuffer();

            if (toolCalls.length === 0) {
              break;
            }

            // Cap tool calls at 5 per round
            const MAX_TOOL_CALLS = 5;
            const cappedToolCalls = toolCalls.slice(0, MAX_TOOL_CALLS);

            currentMessages.push({
              role: "assistant",
              content: fullContent || null,
              tool_calls: cappedToolCalls.map((tc) => ({
                id: tc.id,
                type: tc.type,
                function: {
                  name: tc.function.name,
                  arguments: tc.function.arguments,
                },
              })),
            });

            for (const tc of cappedToolCalls) {
              state.totalToolCalls++;
              const handler = toolHandlers[tc.function.name];

              if (!handler) {
                currentMessages.push({
                  role: "tool",
                  tool_call_id: tc.id,
                  content: JSON.stringify({
                    error: `Unknown tool: ${tc.function.name}`,
                  }),
                });
                continue;
              }

              let args: Record<string, unknown> = {};
              try {
                args = JSON.parse(tc.function.arguments);
              } catch {
                logAIError("tool_args_parse_failed", new Error("JSON parse failed"), {
                  requestId,
                  toolName: tc.function.name,
                  rawArguments: tc.function.arguments,
                });
                currentMessages.push({
                  role: "tool",
                  tool_call_id: tc.id,
                  content: JSON.stringify({ error: "Failed to parse tool arguments. Please provide valid JSON." }),
                });
                continue;
              }

              const result = await withTimeout(() => handler(args, ctx), 15_000);

              if (result.type === "facilities" && Array.isArray(result.data)) {
                if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
                flushTextBuffer();
                controller.enqueue(
                  sseEvent(
                    "facilities",
                    safeStringify(result.data as Facility[]),
                  ),
                );
              }

              if (result.type === "placement-draft") {
                if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
                flushTextBuffer();
                controller.enqueue(
                  sseEvent(
                    "placement-draft",
                    safeStringify(result.data),
                  ),
                );
              }

              logAIEvent("tool_call", {
                level: "info",
                toolName: tc.function.name,
                requestId,
                duration: Date.now() - startTime,
                round: 5 - maxRounds,
              });

              if (result.type === "error") {
                currentMessages.push({
                  role: "tool",
                  tool_call_id: tc.id,
                  content: safeStringify({ error: result.message }),
                });
              } else {
                currentMessages.push({
                  role: "tool",
                  tool_call_id: tc.id,
                  content: safeStringify(result.data),
                });
              }
            }
          }

          currentAbortController = null;
          clearInterval(keepAliveHandle);
          if (chunkWatchdog) { clearTimeout(chunkWatchdog); chunkWatchdog = null; }
          if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
          flushTextBuffer();

          if (state.totalPromptTokens > 0) {
            logAIEvent("chat.complete", {
              level: "info",
              requestId,
              userId,
              organizationId: currentOrgId,
              duration: Date.now() - startTime,
              promptTokens: state.totalPromptTokens,
              completionTokens: state.totalCompletionTokens,
              totalTokens: state.totalPromptTokens + state.totalCompletionTokens,
              toolCalls: state.totalToolCalls,
            });
          }
          controller.enqueue(
            sseEvent("usage", JSON.stringify({
              promptTokens: state.totalPromptTokens,
              completionTokens: state.totalCompletionTokens,
              totalTokens: state.totalPromptTokens + state.totalCompletionTokens,
              toolCalls: state.totalToolCalls,
            }))
          );
          controller.enqueue(sseEvent("done", ""));
          controller.close();
        } catch (err) {
          currentAbortController = null;
          if (keepAliveHandle) clearInterval(keepAliveHandle);
          if (chunkWatchdog) { clearTimeout(chunkWatchdog); chunkWatchdog = null; }
          if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
          flushTextBuffer();
          logAIError("chat.stream_error", err, {
            requestId,
            userId,
            organizationId: currentOrgId,
            duration: Date.now() - startTime,
          });
          const isTimeout = err instanceof Error && (
            err.name === "TimeoutError" || err.message.includes("timeout") || err.message.includes("abort")
          );
          const isRateLimited = err instanceof Error && err.message.includes("429");
          const isAuthError = err instanceof Error && (err.message.includes("401") || err.message.includes("Incorrect API key"));
          const errorPayload = JSON.stringify({
            code: isTimeout ? "timeout" : isRateLimited ? "rate_limit" : isAuthError ? "auth_error" : "internal_error",
            message: isTimeout
              ? "The request timed out. Please try again with a shorter message."
              : isRateLimited
                ? "We're experiencing high demand. Please wait a moment and try again."
                : isAuthError
                  ? "AI service configuration error. Please contact support."
                  : "An error occurred while processing your request. Please try again.",
          });
          try {
            controller.enqueue(sseEvent("error", errorPayload));
            controller.enqueue(sseEvent("done", ""));
            controller.close();
          } catch {
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        "X-Request-Id": requestId,
      },
    });
  } catch (err) {
    logAIError("chat.error", err, { requestId, userId, organizationId: org?.organizationId ?? undefined });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  } finally {
    if (userId && slotAcquired) releaseStreamSlot(userId);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
