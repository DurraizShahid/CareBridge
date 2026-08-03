import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerOrganization } from "@/lib/server-organization";
import { getOpenCodeClient, getOpenCodeModel } from "@/lib/ai/opencode";
import { AI_TOOLS } from "@/lib/ai/tools";
import { toolHandlers, type ToolHandlerContext } from "@/lib/ai/tool-handlers";
import { SYSTEM_PROMPT } from "@/lib/ai/prompt";
import type { Facility } from "@/types";
import { logAIEvent, logAIError } from "@/lib/ai/logger";
import type { ChatCompletionMessageParam } from "openai/resources/index";

const encoder = new TextEncoder();

function safeStringify(value: unknown): string {
  try {
    const s = JSON.stringify(value);
    return s ?? "null";
  } catch {
    return JSON.stringify({ error: "Failed to serialize result" });
  }
}

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
    let i = 0;
    while (i < timestamps.length && timestamps[i] < cutoff) i++;
    if (i > 0) timestamps.splice(0, i);
  }
  if (timestamps.length >= RATE_LIMIT_MAX) return false;
  timestamps.push(now);
  return true;
}

setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW;
  for (const [key, timestamps] of rateLimitMap) {
    const recent = timestamps.filter((t) => t >= cutoff);
    if (recent.length === 0) rateLimitMap.delete(key);
    else rateLimitMap.set(key, recent);
  }
}, 60_000).unref();

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

function withTimeout<T>(fn: () => Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Tool handler timed out")), ms);
    fn().then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

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

function startKeepAlive(controller: ReadableStreamDefaultController, intervalMs = 15_000): ReturnType<typeof setInterval> {
  return setInterval(() => {
    try {
      controller.enqueue(encoder.encode(": keepalive\n\n"));
    } catch {}
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

    const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
    if (contentLength > 524288) {
      return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }

    if (!checkRateLimit(userId)) {
      logAIEvent("rate_limit", { level: "warn", requestId, userId, retryAfter: 60 });
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": "60", "X-Request-Id": requestId } },
      );
    }

    if (!acquireStreamSlot(userId)) {
      logAIEvent("concurrency_limit", { level: "warn", requestId, userId });
      return NextResponse.json(
        { error: "Too many concurrent requests. Please wait for existing requests to complete." },
        { status: 429, headers: { "Retry-After": "30", "X-Request-Id": requestId } },
      );
    }
    slotAcquired = true;

    org = await getServerOrganization();
    if (!org?.organizationId) {
      return NextResponse.json({ error: "No organization context" }, { status: 400 });
    }

    const { messages: rawMessages } = await req.json();
    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    if (rawMessages.length > 50) {
      return NextResponse.json({ error: "Too many messages (max 50)" }, { status: 400 });
    }

    const currentOrgId = org.organizationId;

    const MAX_MESSAGE_LENGTH = 10000;
    let totalChars = 0;
    const validMessages: { role: "user" | "assistant"; content: string }[] = [];

    for (const msg of rawMessages) {
      if (!msg || typeof msg !== "object") {
        return NextResponse.json({ error: "Invalid message format" }, { status: 400 });
      }
      if (msg.role !== "user" && msg.role !== "assistant") {
        return NextResponse.json(
          { error: "Invalid message role. Only 'user' and 'assistant' roles are accepted." },
          { status: 400 },
        );
      }
      if (typeof msg.content !== "string") {
        return NextResponse.json({ error: "Message content must be a string" }, { status: 400 });
      }
      if (msg.content.length > MAX_MESSAGE_LENGTH) {
        return NextResponse.json(
          { error: "Message content too long (max 10,000 characters)" },
          { status: 400 },
        );
      }
      totalChars += msg.content.length;
      if (totalChars > 500000) {
        return NextResponse.json({ error: "Total message size too large" }, { status: 400 });
      }

      if (msg.role === "user" && containsJailbreakPattern(msg.content)) {
        logAIEvent("jailbreak_detected", { level: "warn", requestId, userId, organizationId: currentOrgId });
        return NextResponse.json(
          { error: "Message contains prohibited instructions" },
          { status: 400 },
        );
      }

      validMessages.push({ role: msg.role, content: msg.content });
    }

    const ctx: ToolHandlerContext = {
      organizationId: currentOrgId,
      role: org.role,
      userId,
    };

    const MAX_HISTORY = 20;
    const trimmedMessages = validMessages.length > MAX_HISTORY
      ? validMessages.slice(-MAX_HISTORY)
      : validMessages;

    const startTime = Date.now();

    req.signal.addEventListener("abort", () => {
      logAIEvent("chat.client_disconnect", {
        level: "warn", requestId, userId, organizationId: currentOrgId, duration: Date.now() - startTime,
      });
    });

    logAIEvent("chat.request", {
      level: "info", requestId, userId, organizationId: currentOrgId,
      model: getOpenCodeModel(), messageCount: trimmedMessages.length,
    });

    const state = { totalPromptTokens: 0, totalCompletionTokens: 0, totalToolCalls: 0 };

    const stream = new ReadableStream({
      async start(controller) {
        let keepAliveHandle: ReturnType<typeof setInterval> | undefined;
        let flushTimer: ReturnType<typeof setTimeout> | null = null;
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

          const messages: ChatCompletionMessageParam[] = [
            { role: "system", content: SYSTEM_PROMPT },
            ...trimmedMessages.map((msg) => ({ role: msg.role, content: msg.content })),
          ];

          let maxRounds = 5;
          const toolCallsAccumulator = new Map<number, { id: string; name: string; args: string }>();

          while (maxRounds > 0) {
            maxRounds--;
            const round = 5 - maxRounds;

            logAIEvent("chat.round_start", {
              level: "debug", requestId, round, messageCount: messages.length,
            });

            toolCallsAccumulator.clear();
            let fullContent = "";

            const result = await getOpenCodeClient().chat.completions.create({
              model: getOpenCodeModel(),
              messages,
              tools: AI_TOOLS,
              stream: true,
              stream_options: { include_usage: true },
            });

            for await (const chunk of result) {
              const delta = chunk.choices[0]?.delta;

              if (delta?.content) {
                fullContent += delta.content;
                textBuffer += delta.content;
                if (!flushTimer) {
                  flushTimer = setTimeout(flushTextBuffer, FLUSH_INTERVAL);
                }
              }

              if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const idx = tc.index ?? 0;
                  let acc = toolCallsAccumulator.get(idx);
                  if (!acc) {
                    acc = { id: tc.id ?? "", name: "", args: "" };
                    toolCallsAccumulator.set(idx, acc);
                  }
                  if (tc.id) acc.id = tc.id;
                  if (tc.function?.name) acc.name += tc.function.name;
                  if (tc.function?.arguments) acc.args += tc.function.arguments;
                }
              }

              if (chunk.usage) {
                state.totalPromptTokens = chunk.usage.prompt_tokens ?? 0;
                state.totalCompletionTokens = chunk.usage.completion_tokens ?? 0;
              }
            }

            if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
            flushTextBuffer();

            const functionCalls = [...toolCallsAccumulator.values()].filter((fc) => fc.name.length > 0);
            if (functionCalls.length === 0) break;

            messages.push({
              role: "assistant",
              content: fullContent || null,
              tool_calls: functionCalls.map((fc) => ({
                id: fc.id,
                type: "function" as const,
                function: { name: fc.name, arguments: fc.args || "{}" },
              })),
            });

            const cappedCalls = functionCalls.slice(0, 5);

            for (const fc of cappedCalls) {
              state.totalToolCalls++;
              const handler = toolHandlers[fc.name];

              let toolResponse: string;

              if (!handler) {
                logAIError("unknown_tool", new Error(`Unknown tool: ${fc.name}`), { requestId, toolName: fc.name });
                toolResponse = safeStringify({ error: `Unknown tool: ${fc.name}` });
              } else {
                let result;
                try {
                  let parsedArgs: Record<string, unknown> = {};
                  try {
                    parsedArgs = fc.args ? JSON.parse(fc.args) : {};
                  } catch {
                    parsedArgs = {};
                  }
                  result = await withTimeout(() => handler(parsedArgs, ctx), 15_000);
                } catch (e) {
                  result = { type: "error" as const, message: e instanceof Error ? e.message : "Tool handler failed" };
                }

                if (result.type === "facilities" && Array.isArray(result.data)) {
                  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
                  flushTextBuffer();
                  controller.enqueue(sseEvent("facilities", safeStringify(result.data as Facility[])));
                }

                if (result.type === "placement-draft") {
                  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
                  flushTextBuffer();
                  controller.enqueue(sseEvent("placement-draft", safeStringify(result.data)));
                }

                const responseData = result.type === "error"
                  ? { error: result.message }
                  : result.data;

                toolResponse = typeof responseData === "string"
                  ? responseData
                  : safeStringify(responseData);
              }

              logAIEvent("tool_call", {
                level: "info", toolName: fc.name, requestId, duration: Date.now() - startTime, round,
              });

              messages.push({
                role: "tool",
                tool_call_id: fc.id,
                content: toolResponse,
              });
            }
          }

          if (keepAliveHandle) clearInterval(keepAliveHandle);
          if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
          flushTextBuffer();

          logAIEvent("chat.complete", {
            level: "info", requestId, userId, organizationId: currentOrgId,
            duration: Date.now() - startTime,
            promptTokens: state.totalPromptTokens,
            completionTokens: state.totalCompletionTokens,
            totalTokens: state.totalPromptTokens + state.totalCompletionTokens,
            toolCalls: state.totalToolCalls,
          });

          controller.enqueue(sseEvent("usage", JSON.stringify({
            promptTokens: state.totalPromptTokens,
            completionTokens: state.totalCompletionTokens,
            totalTokens: state.totalPromptTokens + state.totalCompletionTokens,
            toolCalls: state.totalToolCalls,
          })));
          controller.enqueue(sseEvent("done", ""));
          controller.close();
        } catch (err) {
          if (keepAliveHandle) clearInterval(keepAliveHandle);
          if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
          flushTextBuffer();
          logAIError("chat.stream_error", err, {
            requestId, userId, organizationId: currentOrgId, duration: Date.now() - startTime,
          });
          const errMsg = err instanceof Error ? err.message : String(err);
          const errStatus = (err as { status?: number })?.status;
          const isTimeout = err instanceof Error && (
            err.name === "TimeoutError" || errMsg.includes("timeout") || errMsg.includes("abort")
          );
          const isRateLimited = errStatus === 429 || errMsg.includes("429");
          const isAuthError = errStatus === 401 || errMsg.includes("401") || errMsg.includes("API key") || errMsg.includes("OPENCODE_API_KEY") || errMsg.includes("invalid_api_key");
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
          } catch {}
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
