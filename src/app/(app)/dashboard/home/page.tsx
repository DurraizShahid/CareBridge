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
  RiSparklingFill,
  RiCloseLine,
  RiMenuLine,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Message, MessageContent } from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { FacilityResultCard } from "@/components/ai/facility-result-card";
import { PlacementConfirmationCard } from "@/components/ai/placement-confirmation-card";
import { ChatHistorySidebar } from "@/components/ai/chat-history-sidebar";
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
      }
    } else if (eventType === "facilities") {
      try {
        callbacks.onFacilities(JSON.parse(data));
      } catch {
      }
    } else if (eventType === "placement-draft") {
      try {
        callbacks.onPlacementDraft(JSON.parse(data));
      } catch {
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
      <div className="flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-health/20 to-warmth/20">
        <RiSparklingFill className="size-3 text-health" />
      </div>
      <div className="flex gap-1">
        <span className="size-1.5 rounded-full bg-gradient-to-b from-health to-warmth animate-bounce [animation-delay:0ms]" />
        <span className="size-1.5 rounded-full bg-gradient-to-b from-health to-warmth animate-bounce [animation-delay:150ms]" />
        <span className="size-1.5 rounded-full bg-gradient-to-b from-health to-warmth animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}


export default function HomePage() {
  const { user, isLoaded } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  if (!isLoaded) {
    return null;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const saveMessage = async (chatId: string, role: string, content: string) => {
    try {
      await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, content }),
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const handleNewChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setHasStarted(false);
    setIsStreaming(false);
    setCurrentChatId(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleChatSelect = async (chatId: string) => {
    abortRef.current?.abort();
    setCurrentChatId(chatId);
    setIsStreaming(false);

    try {
      const response = await fetch(`/api/chats/${chatId}`);
      if (response.ok) {
        const chat = await response.json();
        const loadedMessages: ChatMessage[] = chat.messages.map(
          (msg: { role: string; content: string }) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })
        );
        setMessages(loadedMessages);
        setHasStarted(loadedMessages.length > 0);
      }
    } catch (error) {
      console.error("Error loading chat:", error);
    }
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

    // Create a new chat if needed
    let chatId = currentChatId;
    if (!chatId) {
      try {
        const response = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "New Chat" }),
        });
        if (response.ok) {
          const chat = await response.json();
          chatId = chat.id;
          setCurrentChatId(chatId);
          setRefreshTrigger((prev) => prev + 1);
        }
      } catch (error) {
        console.error("Error creating chat:", error);
      }
    }

    // Save user message to database
    if (chatId) {
      await saveMessage(chatId, "user", text);
    }

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
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        buffer = processAIBuffer(buffer, {
          onText: (token) => {
            fullResponse += token;
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

      // Save assistant message to database
      if (chatId && fullResponse) {
        const { cleanContent } = parseSuggestions(fullResponse);
        await saveMessage(chatId, "assistant", cleanContent);
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
    <div className="flex h-full overflow-hidden relative">
      {/* Chat History Sidebar */}
      <div
        className={cn(
          "shrink-0 border-r border-border/30 transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-0"
        )}
      >
        {sidebarOpen && (
          <ChatHistorySidebar
            currentChatId={currentChatId}
            onChatSelect={handleChatSelect}
            onNewChat={handleNewChat}
            refreshTrigger={refreshTrigger}
          />
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="relative flex shrink-0 items-center justify-between border-b border-border/30 bg-background/40 backdrop-blur-2xl px-6 py-3.5">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="size-8"
            >
              <RiMenuLine className="size-4" />
            </Button>
            <h2 className="text-sm font-semibold text-foreground leading-tight">CareBridge AI</h2>
          </div>
          {hasStarted && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleNewChat}
              className="gap-1.5 rounded-full h-8 text-xs shadow-sm bg-background/70 backdrop-blur-xl border-border/50"
            >
              <RiCloseLine className="size-3.5" />
              New Chat
            </Button>
          )}
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {!hasStarted ? (
            // ── Welcome State ──
            <div className="flex min-h-full flex-col items-center justify-center px-4 py-16">
              {/* Hero text */}
              <div className="mb-8 text-center">
                <h1 className="text-[2.75rem] sm:text-[3.25rem] font-bold tracking-tight text-foreground leading-[1.05]">
                  {getGreeting()}, {user?.firstName ?? "there"}
                </h1>
                <p className="text-[1.75rem] sm:text-[2rem] font-bold tracking-tight leading-[1.1] mt-1">
                  What can I help you{" "}
                  <span className="bg-gradient-to-r from-health via-warmth to-health bg-clip-text text-transparent bg-[length:200%_200%] animate-gradient">
                    find today?
                  </span>
                </p>
              </div>
            </div>
          ) : (
            // ── Conversation ──
            <div className="mx-auto w-full max-w-[680px] space-y-5 px-4 py-8">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "transition-all duration-500",
                    i >= messages.length - 2 ? "card-enter card-enter-1" : "opacity-100",
                  )}
                >
                  {msg.role === "user" ? (
                    <Message align="end">
                      <MessageContent>
                        <Bubble variant="default" align="end">
                          <BubbleContent className="bg-gradient-to-br from-health to-warmth text-white shadow-lg shadow-health/15">
                            <div className="flex items-start gap-2">
                              <span className="flex-1">{msg.content}</span>
                            </div>
                          </BubbleContent>
                        </Bubble>
                      </MessageContent>
                    </Message>
                  ) : (
                    <Message align="start">
                      <div className="flex items-start gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-health to-warmth shadow-md shadow-health/15">
                          <RiSparkling2Line className="size-4 text-white" />
                        </div>
                        <MessageContent>
                          <div className="flex items-center gap-2 mb-1.5 px-1">
                            <span className="text-xs font-semibold text-foreground">CareBridge AI</span>
                            <span className="text-[9px] text-muted-foreground/50">Assistant</span>
                          </div>
                          <Bubble variant="outline" align="start">
                            <BubbleContent className="shadow-sm bg-card/80 backdrop-blur-xl border-border/60 rounded-3xl">
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
                            <div className="grid grid-cols-2 gap-2 px-0.5 mt-2">
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
                          {msg.isStreaming && <div className="mt-1.5"><TypingIndicator /></div>}
                          {!msg.isStreaming &&
                            msg.suggestions &&
                            msg.suggestions.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 px-0.5 mt-2">
                                {msg.suggestions.map((suggestion, si) => (
                                  <button
                                    key={si}
                                    type="button"
                                    onClick={() =>
                                      handleFollowUpClick(suggestion)
                                    }
                                    className="text-xs px-3 py-1.5 rounded-full border border-border/50 bg-muted/30 text-muted-foreground hover:bg-gradient-to-r hover:from-health/10 hover:to-warmth/10 hover:text-foreground hover:border-health/30 transition-all duration-200"
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            )}
                        </MessageContent>
                      </div>
                    </Message>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="relative shrink-0 border-t border-border/20 bg-gradient-to-t from-background/80 via-background/60 to-transparent backdrop-blur-sm px-4 pb-4 pt-3.5">
          {/* Focus glow behind input */}
          <div
            className={cn(
              "pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 size-48 rounded-full transition-all duration-700 ease-out blur-[80px]",
              isFocused ? "opacity-100 scale-100" : "opacity-0 scale-75",
            )}
            style={{ background: "oklch(0.55 0.15 215 / 0.1)" }}
            aria-hidden="true"
          />

          <form
            onSubmit={handleSubmit}
            className="mx-auto w-full max-w-[680px]"
          >
            <div
              className={cn(
                "group relative rounded-2xl border bg-card/60 backdrop-blur-2xl shadow-sm transition-all duration-300",
                isFocused
                  ? "border-health/40 shadow-[0_4px_32px_oklch(0.55_0.15_215/0.12)] bg-card/80"
                  : "border-border/40 hover:border-border/70 hover:shadow-md",
              )}
            >
              <div className="flex items-start p-4 pb-0">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Ask AI a question or make a request..."
                  rows={2}
                  className="flex-1 bg-transparent border-0 outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/40 pt-0.5 leading-relaxed"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
                <div className="flex items-center gap-1">
                  <span className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    <RiSparkling2Line className="size-2.5" />
                    AI Assistant
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!query.trim() || isStreaming}
                    className={cn(
                      "size-9 rounded-full transition-all duration-300 shadow-sm",
                      query.trim() && !isStreaming
                        ? "bg-gradient-to-br from-health to-warmth text-white hover:opacity-90 hover:shadow-lg hover:shadow-health/25 hover:scale-105 active:scale-95"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <RiSendPlaneFill className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </form>

          {/* Suggestion Items */}
          {!hasStarted && (
            <div className="mx-auto w-full max-w-[680px] mt-4 flex flex-col gap-2">
              {suggestions.map((suggestion) => {
                const Icon = suggestion.icon;
                return (
                  <button
                    key={suggestion.label}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion.label)}
                    className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm px-4 py-3 text-left text-sm text-muted-foreground hover:bg-card/60 hover:border-border/60 hover:text-foreground transition-all duration-200"
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground/60" />
                    <span>{suggestion.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
