import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getServerOrganization } from "@/lib/server-organization";
import { openai } from "@/lib/ai/openai";
import { AI_TOOLS } from "@/lib/ai/tools";
import { toolHandlers, type ToolHandlerContext } from "@/lib/ai/tool-handlers";
import { SYSTEM_PROMPT } from "@/lib/ai/prompt";
import type { Facility } from "@/types";

const encoder = new TextEncoder();

function sseEvent(event: string, data: string): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${data}\n\n`);
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const org = await getServerOrganization();
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

    const ctx: ToolHandlerContext = {
      organizationId: org.organizationId,
      role: org.role,
      userId,
    };

    const systemMessage = {
      role: "system" as const,
      content: SYSTEM_PROMPT,
    };
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      systemMessage,
      ...rawMessages,
    ];

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let currentMessages: any[] = messages;
          let maxRounds = 5;

          while (maxRounds > 0) {
            maxRounds--;

            const completion = await openai.chat.completions.create({
              model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
              messages: currentMessages,
              tools: AI_TOOLS,
              stream: true,
              temperature: 0.7,
              max_tokens: 2048,
            });

            let fullContent = "";
            const toolCallAccumulators: Record<
              number,
              {
                id: string;
                type: "function";
                function: { name: string; arguments: string };
              }
            > = {};

            for await (const chunk of completion) {
              const choice = chunk.choices?.[0];
              if (!choice) continue;

              const delta = choice.delta;

              if (delta?.content) {
                fullContent += delta.content;
                controller.enqueue(
                  sseEvent("text", JSON.stringify(delta.content)),
                );
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
            }

            const toolCalls = Object.values(toolCallAccumulators);

            if (toolCalls.length === 0) {
              break;
            }

            currentMessages.push({
              role: "assistant",
              content: fullContent || null,
              tool_calls: toolCalls.map((tc) => ({
                id: tc.id,
                type: tc.type,
                function: {
                  name: tc.function.name,
                  arguments: tc.function.arguments,
                },
              })),
            });

            for (const tc of toolCalls) {
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
                args = {};
              }

              const result = await handler(args, ctx);

              if (result.type === "facilities" && Array.isArray(result.data)) {
                controller.enqueue(
                  sseEvent(
                    "facilities",
                    JSON.stringify(result.data as Facility[]),
                  ),
                );
              }

              if (result.type === "placement-draft") {
                controller.enqueue(
                  sseEvent(
                    "placement-draft",
                    JSON.stringify(result.data),
                  ),
                );
              }

              if (result.type === "error") {
                currentMessages.push({
                  role: "tool",
                  tool_call_id: tc.id,
                  content: JSON.stringify({ error: result.message }),
                });
              } else {
                currentMessages.push({
                  role: "tool",
                  tool_call_id: tc.id,
                  content: JSON.stringify(result.data),
                });
              }
            }
          }

          controller.enqueue(sseEvent("done", ""));
          controller.close();
        } catch (err) {
          console.error("AI chat stream error:", err);
          try {
            controller.enqueue(
              sseEvent(
                "error",
                JSON.stringify("An error occurred while processing your request."),
              ),
            );
            controller.enqueue(sseEvent("done", ""));
          } catch {
            // ignore close errors
          }
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("AI chat error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
