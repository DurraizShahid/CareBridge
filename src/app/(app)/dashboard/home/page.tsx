"use client";

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { useUser } from "@clerk/nextjs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import {
  RiSendPlaneFill,
  RiSparkling2Line,
  RiBuilding2Line,
  RiUserHeartLine,
  RiStethoscopeLine,
  RiSparklingFill,
  RiStopCircleLine,
  RiArrowGoBackLine,
  RiFileCopyLine,
  RiCheckLine,
  RiTimeLine,
} from "@remixicon/react";
import { SidebarToggleIcon } from "@/components/ui/sidebar-toggle-icon";
import { Button } from "@/components/ui/button";
import { Message, MessageContent, MessageFooter } from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { FacilityResultCard } from "@/components/ai/facility-result-card";
import { PlacementConfirmationCard } from "@/components/ai/placement-confirmation-card";
import { ChatHistorySidebar } from "@/components/ai/chat-history-sidebar";
import { AIHomePageSkeleton } from "@/components/dashboard-skeletons";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { cn } from "@/lib/utils";
import { useChatSidebar } from "@/hooks/use-chat-sidebar";

import type { Facility } from "@/types";
import type { PlacementDraft } from "@/lib/ai/tool-handlers";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  facilities?: Facility[];
  placementDraft?: PlacementDraft;
  suggestions?: string[];
  isStreaming?: boolean;
  isError?: boolean;
  timestamp?: number;
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

function sanitizeStreamingMarkdown(content: string): string {
  const parts = content.split("```");
  if (parts.length % 2 === 0) {
    return parts.slice(0, -1).join("```") + "\n*Generating code...*";
  }
  return content.replace(/<!--[\s\S]*?(?:-->|$)/g, (match) => {
    return match.endsWith("-->") ? match : "";
  });
}

function isValidFacility(data: unknown): data is Facility {
  if (!data || typeof data !== "object") return false;
  const f = data as Record<string, unknown>;
  return typeof f.id === "string" && typeof f.name === "string" &&
    typeof f.rating === "number" && Array.isArray(f.careLevelsOffered);
}

function isValidPlacementDraft(data: unknown): data is PlacementDraft {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return typeof d.patientName === "string" && typeof d.patientId === "string" &&
    typeof d.facilityName === "string" && typeof d.facilityId === "string" &&
    typeof d.careLevel === "string" && typeof d.insuranceMatch === "boolean";
}

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-3 my-2 text-xs font-mono leading-relaxed">
      {children}
    </pre>
  ),
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
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-muted-foreground/20 pl-4 my-2 italic text-muted-foreground">
      {children}
    </blockquote>
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
  code: ({ className, children }) => {
    const isBlock = className?.startsWith("language-");
    return isBlock ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
        {children}
      </code>
    );
  },
  a: ({ href, children }) => {
    const safe = href && /^https?:\/\//i.test(href) ? href : undefined;
    return safe ? (
      <a
        href={safe}
        target="_blank"
        rel="noopener noreferrer"
        className="text-health underline underline-offset-2 hover:text-health/80"
      >
        {children}
      </a>
    ) : (
      <span className="text-foreground">{children}</span>
    );
  },
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
    /<!--suggestions-->([\s\S]*?)<!--\/suggestions-->/,
  );
  if (!match) {
    return { cleanContent: content.replace(/<!--suggestions-->[\s\S]*$/, ""), suggestions: [] };
  }

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
        console.warn("Failed to parse SSE text event");
      }
    } else if (eventType === "facilities") {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(isValidFacility);
          if (valid.length > 0) callbacks.onFacilities(valid);
        }
      } catch {
        console.warn("Failed to parse SSE facilities event");
      }
    } else if (eventType === "placement-draft") {
      try {
        const parsed = JSON.parse(data);
        if (isValidPlacementDraft(parsed)) callbacks.onPlacementDraft(parsed);
      } catch {
        console.warn("Failed to parse SSE placement-draft event");
      }
    } else if (eventType === "done") {
      callbacks.onDone();
    } else if (eventType === "error") {
      try {
        const parsed = JSON.parse(data);
        callbacks.onError(typeof parsed === "string" ? parsed : parsed.message || "An error occurred");
      } catch {
        callbacks.onError("An error occurred");
      }
    }
  }

  return remainder;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-1" role="status" aria-label="AI is typing">
      <div className="flex size-5 items-center justify-center rounded-full bg-health/15">
        <RiSparklingFill className="size-3 text-health" />
      </div>
      <div className="flex gap-1">
        <span className="size-1.5 rounded-full bg-health/60 motion-safe:animate-typing-dot motion-safe:[animation-delay:0ms]" />
        <span className="size-1.5 rounded-full bg-health/60 motion-safe:animate-typing-dot motion-safe:[animation-delay:150ms]" />
        <span className="size-1.5 rounded-full bg-health/60 motion-safe:animate-typing-dot motion-safe:[animation-delay:300ms]" />
      </div>
      <span className="sr-only">CareBridge AI is generating a response</span>
    </div>
  );
}


export default function HomePage() {
  const { user, isLoaded } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const { sidebarOpen, setSidebarOpen, setShowNewChat, setNewChatHandler } = useChatSidebar();
  useEffect(() => {
    setSidebarOpen(window.innerWidth >= 768);
    const onResize = () => setSidebarOpen(window.innerWidth >= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [setSidebarOpen]);
  useEffect(() => {
    setShowNewChat(hasStarted);
    setNewChatHandler(handleNewChat);
  }, [hasStarted, setShowNewChat, setNewChatHandler]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [characterCount, setCharacterCount] = useState(0);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamingRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  const wasAbortedRef = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Abort active stream on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [query]);

  // Close sidebar on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  const copyMessage = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageIndex(index);
      setTimeout(() => setCopiedMessageIndex(null), 2000);
    } catch {
    }
  };

  const formatTime = (ts: number) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(ts);
  };

  if (!isLoaded) {
    return <AIHomePageSkeleton />;
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
    setSidebarOpen(false);

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
        messageContainerRef.current?.focus();
      }
    } catch (error) {
      console.error("Error loading chat:", error);
    }
  };

  const handleSuggestionClick = async (label: string) => {
    await sendMessage(label);
  };

  const handleFollowUpClick = async (question: string) => {
    await sendMessage(question);
  };

  const handleDismissPlacement = (msgIndex: number) => {
    setMessages((prev) => {
      const msg = prev[msgIndex];
      if (msg?.role !== "assistant") return prev;
      const updated = { ...msg };
      delete updated.placementDraft;
      return [...prev.slice(0, msgIndex), updated as ChatMessage, ...prev.slice(msgIndex + 1)];
    });
  };

  const handlePlacementConfirmed = () => {
  };

  const handleRetry = async (text: string) => {
    await sendMessage(text);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(query);
  };

  const handleStopStreaming = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    streamingRef.current = false;
    wasAbortedRef.current = true;
    setIsStreaming(false);
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant" && last.isStreaming) {
        const content = last.content || "";
        const displayContent = sanitizeStreamingMarkdown(content);
        const { cleanContent, suggestions } = parseSuggestions(displayContent);
        return [
          ...prev.slice(0, -1),
          {
            ...last,
            content: cleanContent,
            suggestions,
            isStreaming: false,
          },
        ];
      }
      return prev;
    });
  };

  const sendMessage = async (overrideText: string) => {
    const text = overrideText.trim();
    if (!text || streamingRef.current) return;

    streamingRef.current = true;
    wasAbortedRef.current = false;
    setQuery("");
    setCharacterCount(0);
    setHasStarted(true);

    const ts = Date.now();
    const userMsg: ChatMessage = { role: "user", content: text, timestamp: ts };
    const aiMsg: ChatMessage = {
      role: "assistant",
      content: "",
      isStreaming: true,
      timestamp: ts,
    };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setIsStreaming(true);

    // Create a new chat if needed (parallel with AI fetch)
    let chatId = currentChatId;
    const chatPromise = !chatId
      ? fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: text.slice(0, 60) }),
        }).then((r) => r.ok ? r.json() : null)
        .catch(() => null)
      : Promise.resolve(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const history = messagesRef.current.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      history.push({ role: "user", content: text });

      // Start AI fetch immediately, don't wait for chat creation
      const responsePromise = fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });

      // Resolve chat ID in parallel (won't throw — caught above)
      const chatResult = await chatPromise;
      if (chatResult) {
        chatId = chatResult.id;
        setCurrentChatId(chatId);
        setRefreshTrigger((prev) => prev + 1);
      }

      const response = await responsePromise;

      if (!response.ok) {
        let errorMsg: string;
        try {
          const body = await response.json();
          errorMsg = body?.error || `Request failed (${response.status})`;
        } catch {
          errorMsg = `Request failed (${response.status})`;
        }
        throw new Error(errorMsg);
      }

      // Save user message to database (fire-and-forget)
      if (chatId) {
        saveMessage(chatId, "user", text);
      }

      const requestId = response.headers.get("X-Request-Id") || crypto.randomUUID();
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullResponse = "";
      let ttft: number | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        buffer = processAIBuffer(buffer, {
          onText: (token) => {
            if (ttft === null) {
              ttft = Date.now() - ts;
              console.debug(`[${requestId}] TTFT: ${ttft}ms`);
            }
            fullResponse += token;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant" && last.isStreaming) {
                const newContent = last.content + token;
                return [
                  ...prev.slice(0, -1),
                  { ...last, content: newContent },
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
                  { ...last, content: last.content || err, isStreaming: false, isError: true },
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
        saveMessage(chatId, "assistant", cleanContent);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("sendMessage error:", err.name, err.message);
        const userMessage = err.message.includes("429") || err.message.includes("too many")
          ? err.message
          : "Sorry, something went wrong. Please try again.";
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.isStreaming) {
            return [
              ...prev.slice(0, -1),
              {
                ...last,
                content: userMessage,
                isStreaming: false,
                isError: true,
              },
            ];
          }
          return prev;
        });
      }
    } finally {
      streamingRef.current = false;
      abortRef.current = null;
      setIsStreaming(false);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role !== "assistant" || !last.isStreaming) return prev;

        const rawContent = last.content || "";
        const displayContent = sanitizeStreamingMarkdown(rawContent);
        const { cleanContent, suggestions } = parseSuggestions(displayContent);

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
    <div
      className="flex overflow-hidden relative"
      style={{ height: 'calc(100dvh - 4rem)' }}
    >
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[15] bg-black/15 backdrop-blur-[2px] motion-safe:transition-opacity motion-safe:duration-200 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Chat History Sidebar */}
      <div
        className={cn(
          "border-r border-border/30 overflow-hidden transition-[width] motion-safe:duration-300 motion-safe:ease-in-out fixed top-0 left-0 z-20",
          sidebarOpen ? "w-64" : "w-0"
        )}
        style={{ height: 'calc(100dvh - 4rem)' }}
        aria-hidden={!sidebarOpen}
      >
        <div className="w-64 h-full">
          <ChatHistorySidebar
            currentChatId={currentChatId}
            onChatSelect={handleChatSelect}
            onNewChat={handleNewChat}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className={cn("relative flex flex-1 flex-col min-w-0", sidebarOpen ? "pl-64" : "pl-0")}>
        <div className={cn("fixed top-0 z-30", sidebarOpen ? "left-64" : "left-0")}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="size-8 min-h-[44px] text-muted-foreground hover:text-foreground"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <SidebarToggleIcon className="size-4" sidebarOpen={sidebarOpen} />
          </Button>
        </div>

        {/* Content */}
        <div
          ref={messageContainerRef}
          className="flex-1 overflow-y-auto min-h-0"
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
          tabIndex={-1}
        >
          {!hasStarted ? (
            // ── Welcome State ──
            <div className="flex min-h-full flex-col items-center justify-center px-6 py-24">
              <div className="text-center max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-700 fill-mode-both">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-[1.05] text-balance">
                  {getGreeting()}, {user?.firstName ?? "there"}
                </h1>
                <p className="text-base sm:text-lg font-medium text-muted-foreground mt-3 leading-snug">
                  What can I help you find today?
                </p>
              </div>
            </div>
          ) : (
            // ── Conversation ──
            <div className="mx-auto w-full max-w-[720px] space-y-5 px-4 py-8">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "group/message motion-safe:transition-all motion-safe:duration-500",
                    i >= messages.length - 2 ? `card-enter card-enter-${messages.length - i}` : "opacity-100",
                  )}
                >
                  {msg.role === "user" ? (
                    <Message align="end">
                      <MessageContent>
                        <Bubble variant="default" align="end">
                          <BubbleContent className="bg-health text-white">
                            <div className="flex items-start gap-2">
                              <span className="flex-1">{msg.content}</span>
                            </div>
                          </BubbleContent>
                        </Bubble>
                        {msg.timestamp && (
                          <MessageFooter>
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <RiTimeLine className="size-2.5" />
                              {formatTime(msg.timestamp)}
                            </span>
                          </MessageFooter>
                        )}
                      </MessageContent>
                    </Message>
                  ) : (
                    <Message align="start">
                      <div className="flex items-start gap-3">
                        <div
                          className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-health"
                          aria-hidden="true"
                        >
                          <RiSparkling2Line className="size-4 text-white" />
                        </div>
                        <MessageContent>
                          <div className="flex items-center gap-2 mb-1 px-1">
                            <span className="text-xs font-semibold text-foreground">CareBridge AI</span>
                          </div>
                          <Bubble
                            variant={msg.isError ? "destructive" : "outline"}
                            align="start"
                          >
                            <BubbleContent>
                              {msg.content ? (
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  rehypePlugins={[
                                    [rehypeSanitize, {
                                      ...defaultSchema,
                                      attributes: {
                                        ...defaultSchema.attributes,
                                        "*:all": ["className"],
                                        code: ["className"],
                                        span: ["className", "style"],
                                      },
                                    }],
                                    rehypeHighlight,
                                  ]}
                                  components={markdownComponents}
                                >
                                  {msg.isStreaming ? sanitizeStreamingMarkdown(msg.content) : msg.content}
                                </ReactMarkdown>
                              ) : msg.isStreaming ? null : (
                                <span className="text-muted-foreground italic">
                                  Thinking...
                                </span>
                              )}
                            </BubbleContent>
                          </Bubble>
                          {msg.facilities && msg.facilities.length > 0 && (
                            <ErrorBoundary>
                              <div className="grid gap-2 px-0.5 mt-2 sm:grid-cols-2">
                                {msg.facilities.map((facility) => (
                                  <FacilityResultCard
                                    key={facility.id}
                                    facility={facility}
                                  />
                                ))}
                              </div>
                            </ErrorBoundary>
                          )}
                          {msg.placementDraft && !msg.isStreaming && (
                            <ErrorBoundary>
                              <PlacementConfirmationCard
                                draft={msg.placementDraft}
                                onConfirmed={handlePlacementConfirmed}
                                onDismiss={() => handleDismissPlacement(i)}
                              />
                            </ErrorBoundary>
                          )}
                          {msg.isStreaming && (
                            <div className="mt-1.5">
                              <TypingIndicator />
                            </div>
                          )}
                          {!msg.isStreaming && msg.isError && (
                            <div className="flex items-center gap-2 mt-2 px-0.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const prevUserMsg = messages
                                    .slice(0, i)
                                    .reverse()
                                    .find((m) => m.role === "user");
                                  if (prevUserMsg) handleRetry(prevUserMsg.content);
                                }}
                                  className="gap-1.5 text-xs min-h-[44px]"
                                  aria-label="Retry sending message"
                              >
                                <RiArrowGoBackLine className="size-3.5" />
                                Retry
                              </Button>
                            </div>
                          )}
                          {!msg.isStreaming &&
                            !msg.isError &&
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
                                    className="text-xs px-3 min-h-[44px] rounded-full border border-border/50 bg-muted/30 text-muted-foreground hover:bg-health/10 hover:text-foreground hover:border-health/30 active:scale-[0.98] motion-safe:transition-all motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            )}
                          {/* Message actions row */}
                          {!msg.isStreaming && msg.content && (
                            <div className="flex items-center gap-1 mt-1.5 px-0.5">
                              <div className="opacity-0 group-hover/message:opacity-100 motion-safe:transition-opacity motion-safe:duration-200">
                                <button
                                  type="button"
                                  onClick={() => copyMessage(msg.content, i)}
                                  className="flex items-center gap-1 rounded-md px-1.5 min-h-[44px] text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/50 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  aria-label={copiedMessageIndex === i ? "Copied" : "Copy message"}
                                >
                                  {copiedMessageIndex === i ? (
                                    <>
                                      <RiCheckLine className="size-3" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <RiFileCopyLine className="size-3" />
                                      Copy
                                    </>
                                  )}
                                </button>
                              </div>
                              {msg.timestamp && (
                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <RiTimeLine className="size-2.5" />
                                  {formatTime(msg.timestamp)}
                                </span>
                              )}
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
        <div className="relative shrink-0 border-t border-border/20 bg-background px-4 pb-4 pt-3.5 min-h-[7.5rem]">

          <form
            onSubmit={handleSubmit}
            className="mx-auto w-full max-w-[720px]"
          >
            <div
              className="group relative rounded-2xl border border-border/40 bg-card shadow-sm motion-safe:transition-all motion-safe:duration-300 hover:border-border/70 hover:shadow-md focus-within:border-primary/40 focus-within:shadow-md"
            >
              <div className="flex items-start p-4 pb-0">
                <textarea
                  ref={textareaRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setCharacterCount(e.target.value.length);
                  }}
                  placeholder="Ask AI a question or make a request..."
                  rows={1}
                  aria-label="Message input"
                  className="flex-1 bg-transparent border-0 outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground pt-0.5 leading-relaxed max-h-40 focus-visible:ring-0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
                <div className="flex items-center gap-1.5">
                  {isStreaming ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleStopStreaming}
                      className="gap-1.5 text-xs min-h-[44px] text-destructive border-destructive/30 hover:bg-destructive/10 active:scale-95"
                      aria-label="Stop generating response"
                    >
                      <RiStopCircleLine className="size-4" />
                      Stop
                    </Button>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  {!query && !isStreaming && (
                    <span className="text-[10px] text-muted-foreground/30 hidden sm:inline" aria-hidden="true">
                      Enter to send · Shift+Enter for new line
                    </span>
                  )}
                  {characterCount > 0 && !isStreaming && (
                    <span
                      className={cn(
                        "text-[10px] tabular-nums",
                        characterCount > 4000
                          ? "text-destructive"
                          : "text-muted-foreground/40"
                      )}
                      aria-label={`${characterCount} characters`}
                    >
                      {characterCount}
                    </span>
                  )}
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!query.trim() || isStreaming}
                    aria-label={query.trim() ? "Send message" : "Type a message to send"}
                    className={cn(
                      "size-9 min-h-[44px] min-w-[44px] rounded-full motion-safe:transition-all motion-safe:duration-300",
                      query.trim() && !isStreaming
                        ? "bg-health text-white hover:bg-health/90 active:scale-95"
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
            <div className="mx-auto w-full max-w-[720px] mt-4 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => {
                const Icon = suggestion.icon;
                return (
                  <button
                    key={suggestion.label}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion.label)}
                    className="flex flex-1 items-center gap-3 rounded-xl border border-border/40 bg-card px-4 py-3 text-left text-sm text-muted-foreground hover:bg-accent hover:border-border/60 hover:text-foreground active:scale-[0.98] motion-safe:transition-all motion-safe:duration-200 min-w-[200px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
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
