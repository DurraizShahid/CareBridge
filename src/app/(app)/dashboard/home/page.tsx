"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import {
  RiSendPlaneFill,
  RiSparkling2Line,
  RiBuilding2Line,
  RiUserHeartLine,
  RiStethoscopeLine,
  RiMapPinLine,
  RiSparklingFill,
  RiCloseLine,
  RiHealthBookLine,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Message, MessageContent } from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { FacilityResultCard } from "@/components/ai/facility-result-card";
import { PlacementConfirmationCard } from "@/components/ai/placement-confirmation-card";
import { cn } from "@/lib/utils";
import type { Facility } from "@/types";
import type { PlacementDraft } from "@/lib/ai/tool-handlers";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  facilities?: Facility[];
  placementDraft?: PlacementDraft;
  suggestions?: string[];
  isStreaming?: boolean;
}

const suggestions = [
  {
    icon: RiBuilding2Line,
    label: "Find facilities with cardiac care beds",
  },
  {
    icon: RiUserHeartLine,
    label: "Show pending discharge approvals",
  },
  {
    icon: RiStethoscopeLine,
    label: "Compare skilled nursing options",
  },
  {
    icon: RiMapPinLine,
    label: "Nearest rehab centers to patient",
  },
  {
    icon: RiHealthBookLine,
    label: "Initiate a placement for a patient",
  },
];

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="list-disc pl-5 mb-2 space-y-0.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-2 rounded-lg border border-border">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-muted/50">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border-b border-border px-3 py-1.5 text-left font-medium text-muted-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-border/50 px-3 py-1.5">{children}</td>
  ),
  code: ({ children }) => (
    <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
      {children}
    </code>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-health underline underline-offset-2 hover:text-health/80"
    >
      {children}
    </a>
  ),
  h1: ({ children }) => (
    <h1 className="text-base font-bold mb-1 mt-2 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-sm font-bold mb-1 mt-2 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold mb-1">{children}</h3>
  ),
  hr: () => <hr className="my-3 border-border/50" />,
};

function parseSuggestions(
  content: string,
): { cleanContent: string; suggestions: string[] } {
  const match = content.match(
    /<!--suggestions-->(.*?)<!--\/suggestions-->/,
  );
  if (!match) return { cleanContent: content, suggestions: [] };

  try {
    const parsed = JSON.parse(match[1]);
    const cleanContent = content.replace(match[0], "");
    return {
      cleanContent,
      suggestions: Array.isArray(parsed) ? parsed : [],
    };
  } catch {
    return { cleanContent: content.replace(match[0], ""), suggestions: [] };
  }
}

function processAIBuffer(
  buffer: string,
  callbacks: {
    onText: (token: string) => void;
    onFacilities: (facilities: Facility[]) => void;
    onPlacementDraft: (draft: PlacementDraft) => void;
    onDone: () => void;
    onError: (error: string) => void;
  },
) {
  const events = buffer.split("\n\n");
  const remainder = events.pop() || "";

  for (const event of events) {
    if (!event.trim()) continue;
    const lines = event.split("\n");
    let eventType = "";
    let data = "";

    for (const line of lines) {
      if (line.startsWith("event: ")) eventType = line.slice(7);
      if (line.startsWith("data: ")) data = line.slice(6);
    }

    if (eventType === "text") {
      try {
        callbacks.onText(JSON.parse(data));
      } catch {
        // ignore parse errors for text tokens
      }
    } else if (eventType === "facilities") {
      try {
        callbacks.onFacilities(JSON.parse(data));
      } catch {
        // ignore parse errors for facilities
      }
    } else if (eventType === "placement-draft") {
      try {
        callbacks.onPlacementDraft(JSON.parse(data));
      } catch {
        // ignore parse errors for placement draft
      }
    } else if (eventType === "done") {
      callbacks.onDone();
    } else if (eventType === "error") {
      try {
        callbacks.onError(JSON.parse(data));
      } catch {
        callbacks.onError("An error occurred");
      }
    }
  }

  return remainder;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-1">
      <RiSparklingFill className="size-3.5 text-health" />
      <div className="flex gap-1">
        <span className="size-1.5 rounded-full bg-health/60 animate-bounce [animation-delay:0ms]" />
        <span className="size-1.5 rounded-full bg-health/60 animate-bounce [animation-delay:150ms]" />
        <span className="size-1.5 rounded-full bg-health/60 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const handleNewChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setHasStarted(false);
    setIsStreaming(false);
  };

  const handleSuggestionClick = (label: string) => {
    setQuery(label);
    handleSubmit(new Event("submit") as any, label);
  };

  const handleFollowUpClick = (question: string) => {
    setQuery(question);
    handleSubmit(new Event("submit") as any, question);
  };

  const handleDismissPlacement = (msgIndex: number) => {
    setMessages((prev) => {
      const msg = prev[msgIndex];
      if (msg?.role !== "assistant") return prev;
      const { placementDraft: _, ...rest } = msg;
      return [...prev.slice(0, msgIndex), rest, ...prev.slice(msgIndex + 1)];
    });
  };

  const handlePlacementConfirmed = () => {
    // no extra action needed beyond card state change
  };

  const handleSubmit = async (
    e: React.FormEvent,
    overrideQuery?: string,
  ) => {
    e.preventDefault();
    const text = (overrideQuery ?? query).trim();
    if (!text || isStreaming) return;

    setQuery("");
    setHasStarted(true);

    const userMessage: ChatMessage = { role: "user", content: text };
    const aiMessage: ChatMessage = {
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      history.push({ role: "user", content: text });

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        buffer = processAIBuffer(buffer, {
          onText: (token) => {
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant" && last.isStreaming) {
                return [
                  ...prev.slice(0, -1),
                  { ...last, content: last.content + token },
                ];
              }
              return prev;
            });
          },
          onFacilities: (facilities) => {
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant" && last.isStreaming) {
                return [
                  ...prev.slice(0, -1),
                  {
                    ...last,
                    facilities: [...(last.facilities ?? []), ...facilities],
                  },
                ];
              }
              return prev;
            });
          },
          onPlacementDraft: (draft) => {
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant" && last.isStreaming) {
                return [
                  ...prev.slice(0, -1),
                  { ...last, placementDraft: draft },
                ];
              }
              return prev;
            });
          },
          onDone: () => {},
          onError: (err) => {
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant" && last.isStreaming) {
                return [
                  ...prev.slice(0, -1),
                  { ...last, content: last.content || err, isStreaming: false },
                ];
              }
              return prev;
            });
          },
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.isStreaming) {
            return [
              ...prev.slice(0, -1),
              {
                ...last,
                content: "Sorry, something went wrong. Please try again.",
                isStreaming: false,
              },
            ];
          }
          return prev;
        });
      }
    } finally {
      setIsStreaming(false);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role !== "assistant") return prev;

        const rawContent = last.isStreaming ? last.content : last.content;
        const { cleanContent, suggestions } = parseSuggestions(rawContent);

        return [
          ...prev.slice(0, -1),
          {
            ...last,
            content: cleanContent,
            suggestions,
            isStreaming: false,
          },
        ];
      });
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden relative">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2">
          <RiSparkling2Line className="size-5 text-health" />
          <h2 className="font-semibold text-sm">CareBridge AI</h2>
        </div>
        {hasStarted && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewChat}
            className="text-xs gap-1.5 h-8"
          >
            <RiCloseLine className="size-3.5" />
            New Chat
          </Button>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {!hasStarted ? (
          /* Welcome State */
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="relative mb-3">
              <div className="gradient-blob" aria-hidden="true" />
            </div>
            <div className="flex flex-col items-center gap-1 mb-6">
              <h1 className="text-[2rem] font-bold tracking-tight text-foreground leading-tight text-center">
                {getGreeting()}, {user?.firstName ?? "there"}
              </h1>
              <p className="text-[2rem] font-bold tracking-tight leading-tight text-center">
                What can I help you{" "}
                <span className="bg-gradient-to-r from-health to-warmth bg-clip-text text-transparent">
                  find today?
                </span>
              </p>
            </div>

            <div className="w-full max-w-[680px] mt-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3 text-center">
                Get started with an example below
              </p>
              <div className="grid grid-cols-4 gap-3">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.label}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion.label)}
                    className="group flex flex-col justify-between items-start p-4 h-24 rounded-xl border border-border/50 bg-card/30 text-left transition-all duration-200 hover:bg-card hover:border-border hover:shadow-sm hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <span className="text-sm text-muted-foreground leading-snug group-hover:text-foreground transition-colors">
                      {suggestion.label}
                    </span>
                    <suggestion.icon className="size-4 text-muted-foreground/50 group-hover:text-foreground/60 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Conversation */
          <div className="max-w-[680px] mx-auto px-4 py-6 space-y-4">
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === "user" ? (
                  <Message align="end">
                    <MessageContent>
                      <Bubble variant="default" align="end">
                        <BubbleContent>{msg.content}</BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                ) : (
                  <Message align="start">
                    <MessageContent>
                      <Bubble variant="outline" align="start">
                        <BubbleContent>
                          {msg.content ? (
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={markdownComponents}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          ) : msg.isStreaming ? null : (
                            <span className="text-muted-foreground italic">
                              Thinking...
                            </span>
                          )}
                        </BubbleContent>
                      </Bubble>
                      {msg.facilities && msg.facilities.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 px-0.5">
                          {msg.facilities.map((facility) => (
                            <FacilityResultCard
                              key={facility.id}
                              facility={facility}
                            />
                          ))}
                        </div>
                      )}
                      {msg.placementDraft && !msg.isStreaming && (
                        <PlacementConfirmationCard
                          draft={msg.placementDraft}
                          onConfirmed={handlePlacementConfirmed}
                          onDismiss={() => handleDismissPlacement(i)}
                        />
                      )}
                      {msg.isStreaming && <TypingIndicator />}
                      {!msg.isStreaming &&
                        msg.suggestions &&
                        msg.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 px-0.5">
                            {msg.suggestions.map((suggestion, si) => (
                              <button
                                key={si}
                                type="button"
                                onClick={() =>
                                  handleFollowUpClick(suggestion)
                                }
                                className="text-xs px-2.5 py-1.5 rounded-full border border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border transition-colors"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                    </MessageContent>
                  </Message>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0 px-4 pb-4 pt-2 border-t border-border/20 bg-gradient-to-t from-background via-background to-transparent">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[680px] mx-auto"
        >
          <div
            className={cn(
              "relative rounded-2xl border transition-all duration-300",
              isFocused
                ? "border-health/30 shadow-[0_4px_24px_oklch(0.55_0.15_215/0.08)] bg-background/95 backdrop-blur-xl"
                : "border-border/60 bg-muted/10",
            )}
          >
            <div className="flex items-start p-4 pb-0">
              <RiSparkling2Line className="size-5 text-health mt-0.5 shrink-0" />
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Ask AI a question or make a request."
                rows={3}
                className="flex-1 bg-transparent border-0 outline-none resize-none text-base text-foreground placeholder:text-muted-foreground/50 pl-3 pt-0.5"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            </div>

            <div className="flex items-center justify-between p-3 pt-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <RiSparkling2Line className="size-4" />
                  AI Search
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  size="icon"
                  disabled={!query.trim() || isStreaming}
                  className={cn(
                    "size-9 rounded-full transition-all duration-200",
                    query.trim() && !isStreaming
                      ? "bg-foreground text-background hover:bg-foreground/90"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <RiSendPlaneFill className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
