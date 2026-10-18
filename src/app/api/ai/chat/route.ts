import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerOrganization } from "@/lib/server-organization";
import { prisma } from "@/lib/prisma";
import type { Facility } from "@/types";
import { logAIEvent, logAIError } from "@/lib/ai/logger";
import {
  parsePatientInput,
  rankFacilities,
  generateResponse,
  buildConversationState,
  isDischargeInquiry,
  type RankedFacility,
} from "@/lib/ai/dumb-ai";

const encoder = new TextEncoder();

// Chat cards and the client only need to know a tour exists, not its geometry.
function slimFacility({ media: _media, tourConfig, ...facility }: Facility & { hasTour?: boolean }) {
  return { ...facility, hasTour: true };
}

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

    const { messages: rawMessages, chatId: rawChatId } = await req.json();
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

    // The server, not the client, persists the reply, so stored assistant turns cannot be forged.
    const chatId = typeof rawChatId === "string" && rawChatId
      ? (await prisma.chat.findFirst({
          where: { id: rawChatId, userId, organizationId: currentOrgId },
          select: { id: true },
        }))?.id ?? null
      : null;

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
      model: "rule-based-recommendation-engine", messageCount: trimmedMessages.length,
    });

    const stream = new ReadableStream({
      async start(controller) {
        let keepAliveHandle: ReturnType<typeof setInterval> | undefined;

        try {
          keepAliveHandle = startKeepAlive(controller);

          // Build conversation state and parse current user input
          const lastUserMessage = trimmedMessages.filter((m) => m.role === "user").pop();
          const lastText = lastUserMessage?.content ?? "";
          const parsed = parsePatientInput(lastText);
          const conversationState = buildConversationState(trimmedMessages);

          const activeCareLevel = parsed.careLevel ?? conversationState.careLevel;
          const activeLocation = parsed.location ?? conversationState.location;
          const activeInsurance = parsed.insurance ?? conversationState.insurance;
          const activeAge = parsed.age ?? conversationState.age;
          const activeConditions = parsed.conditions?.length
            ? parsed.conditions
            : conversationState.conditions;

          let rankedFacilities: RankedFacility[] = [];
          if (activeCareLevel && !parsed.isDischargeInquiry && !isDischargeInquiry(lastText)) {
            rankedFacilities = await rankFacilities({
              careLevel: activeCareLevel,
              location: activeLocation,
              insurance: activeInsurance,
              age: activeAge,
              conditions: activeConditions,
              raw: lastText,
            });
          }

          const replyText = generateResponse(parsed, rankedFacilities, conversationState);

          // If enough info exists and facilities were matched, emit structured facilities event
          if (activeCareLevel && activeLocation && rankedFacilities.length > 0) {
            const topFacilities = rankedFacilities.slice(0, 3);
            // Commit access before the cards reach the client and can be opened.
            if (org?.organizationType === "hospital") {
              await prisma.chatFacilityRecommendation.createMany({
                data: topFacilities.map(({ id }) => ({ organizationId: currentOrgId, facilityId: id, chatId })),
              });
            }
            controller.enqueue(sseEvent("facilities", safeStringify(topFacilities.map(slimFacility))));
          }

          // Stream the natural response text with a smooth cadence
          const words = replyText.split(" ");
          const chunks: string[] = [];
          for (let i = 0; i < words.length; i += 3) {
            const slice = words.slice(i, i + 3).join(" ");
            chunks.push(i === 0 ? slice : " " + slice);
          }

          const streamDelay = process.env.NODE_ENV === "test" ? 0 : 20;
          for (const chunk of chunks) {
            if (req.signal.aborted) break;
            controller.enqueue(sseEvent("text", JSON.stringify(chunk)));
            if (streamDelay > 0) {
              await new Promise((resolve) => setTimeout(resolve, streamDelay));
            }
          }

          if (keepAliveHandle) clearInterval(keepAliveHandle);

          logAIEvent("chat.complete", {
            level: "info", requestId, userId, organizationId: currentOrgId,
            duration: Date.now() - startTime,
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            toolCalls: rankedFacilities.length > 0 ? 1 : 0,
          });

          const reply = replyText.replace(/<!--suggestions-->[\s\S]*$/, "").trim().slice(0, 10000);
          if (chatId && reply) {
            await prisma.chatMessage.create({ data: { chatId, role: "assistant", content: reply } })
              .catch((e) => logAIError("chat.persist_error", e, { requestId, userId }));
          }

          controller.enqueue(sseEvent("usage", JSON.stringify({
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            toolCalls: rankedFacilities.length > 0 ? 1 : 0,
          })));
          controller.enqueue(sseEvent("done", ""));
          controller.close();
        } catch (err) {
          if (keepAliveHandle) clearInterval(keepAliveHandle);
          logAIError("chat.stream_error", err, {
            requestId, userId, organizationId: currentOrgId, duration: Date.now() - startTime,
          });
          const errorPayload = JSON.stringify({
            code: "internal_error",
            message: "An error occurred while matching facilities. Please try again.",
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
