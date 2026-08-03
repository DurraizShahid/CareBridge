"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import {
  RiSparklingFill,
  RiArrowGoBackLine,
  RiFileCopyLine,
  RiCheckLine,
} from "@remixicon/react";
import { History, Plus, Globe2, Mic, ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FacilityResultCard } from "@/components/ai/facility-result-card";
import { PlacementConfirmationCard } from "@/components/ai/placement-confirmation-card";
import { ChatHistorySidebar } from "@/components/ai/chat-history-sidebar";
import { AIHomePageSkeleton } from "@/components/dashboard-skeletons";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
} from "@/components/ui/sheet";
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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

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
  const [historyOpen, setHistoryOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const streamingRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  const wasAbortedRef = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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

  const handleNewChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setHasStarted(false);
    setIsStreaming(false);
    setCurrentChatId(null);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleChatSelect = async (chatId: string) => {
    abortRef.current?.abort();
    setCurrentChatId(chatId);
    setIsStreaming(false);
    setHistoryOpen(false);

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
    setHasStarted(true);

    // eslint-disable-next-line react-hooks/purity
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

      const responsePromise = fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });

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
                const existing = new Set((last.facilities ?? []).map((f) => f.id));
                return [
                  ...prev.slice(0, -1),
                  {
                    ...last,
                    facilities: [
                      ...(last.facilities ?? []),
                      ...facilities.filter((f) => !existing.has(f.id)),
                    ],
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

  const composer = (
    <div className="w-full max-w-[640px]" style={{ height: "108px" }}>
      <div
        className="flex flex-col h-full rounded-[24px]"
        style={{
          background: "rgba(255,255,255,0.98)",
          border: "1px solid rgba(224,235,244,0.65)",
          boxShadow:
            "0 15px 34px rgba(97,158,205,0.13), 0 4px 12px rgba(97,158,205,0.06)",
        }}
      >
        <div className="flex-1 px-[20px] pt-[18px]">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (query.trim()) sendMessage(query);
              }
            }}
            placeholder="Ask CareBridge anything..."
            rows={1}
            className="w-full resize-none bg-transparent outline-none text-[15px] leading-[1.4]"
            style={{ color: "#26313f" }}
            aria-label="Message input"
          />
        </div>

        <div className="flex items-center justify-between px-[18px] pb-[13px]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-full"
              style={{ background: "#eff6fb", color: "#526273" }}
              aria-label="Attach file"
            >
              <Plus className="size-4" />
            </button>
            <div className="flex items-center gap-1">
              <Globe2 className="size-4" style={{ color: "#a1a8b2" }} />
              <span className="text-[13px]" style={{ color: "#a1a8b2" }}>
                Search
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-full hover:bg-black/5 transition-colors"
              style={{ color: "#405365" }}
              aria-label="Voice input"
            >
              <Mic className="size-4" />
            </button>
            {isStreaming ? (
              <button
                type="button"
                onClick={handleStopStreaming}
                className="flex size-[34px] items-center justify-center rounded-full"
                style={{ background: "#182537", color: "#ffffff" }}
                aria-label="Stop generating"
              >
                <div className="size-3.5 rounded-sm bg-white" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { if (query.trim()) sendMessage(query); }}
                disabled={!query.trim()}
                className="flex size-[34px] items-center justify-center rounded-full transition-opacity disabled:opacity-40"
                style={{ background: "#182537", color: "#ffffff" }}
                aria-label="Send message"
              >
                <ArrowUp className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (!isLoaded) {
    return <AIHomePageSkeleton />;
  }

  return (
    <div
      className="min-h-dvh w-full overflow-x-hidden flex flex-col"
      style={{ background: "#f9fafc" }}
    >
      <style>{`@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }`}</style>
      {/* Chat History Drawer */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetTrigger
          render={
            <button
              className="absolute top-[22px] left-[22px] z-40 flex size-9 items-center justify-center rounded-xl text-[#5a6a7a] hover:bg-black/5 transition-colors"
              aria-label="Open chat history"
            >
              <History className="size-[18px]" />
            </button>
          }
        />
        <SheetContent side="left" className="w-[300px] p-0" showCloseButton={false}>
          <ChatHistorySidebar
            currentChatId={currentChatId}
            onChatSelect={handleChatSelect}
            onNewChat={handleNewChat}
            refreshTrigger={refreshTrigger}
          />
        </SheetContent>
      </Sheet>

      {!hasStarted ? (
        /* ── Empty State ── */
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
          <div
            className="relative"
            style={{ width: "140px", height: "140px", animation: "float 3s ease-in-out infinite" }}
          >
            {/* Outer glow */}
            <div
              className="absolute rounded-full"
              style={{
                width: "140px",
                height: "140px",
                background: "radial-gradient(circle at 50% 50%, rgba(88,170,224,0.15) 0%, transparent 70%)",
                filter: "blur(20px)",
              }}
            />
            {/* Body */}
            <div
              className="absolute rounded-full"
              style={{
                width: "100px",
                height: "100px",
                top: "20px",
                left: "20px",
                filter: "blur(6px)",
                background: `
                  radial-gradient(circle at 35% 30%, rgba(120,200,255,0.95) 0%, rgba(58,150,210,0.5) 40%, transparent 65%),
                  radial-gradient(circle at 70% 60%, rgba(100,150,230,0.75) 0%, rgba(58,139,191,0.25) 45%, transparent 65%)
                `,
              }}
            />
            {/* Core */}
            <div
              className="absolute rounded-full"
              style={{
                width: "48px",
                height: "48px",
                top: "46px",
                left: "46px",
                background: "radial-gradient(circle, rgba(180,230,255,0.85) 0%, rgba(120,200,240,0.3) 50%, transparent 70%)",
                filter: "blur(2px)",
              }}
            />
            {/* Specular highlight */}
            <div
              className="absolute rounded-full"
              style={{
                width: "18px",
                height: "18px",
                top: "38px",
                left: "42px",
                background: "radial-gradient(circle, rgba(255,255,255,0.55) 0%, transparent 70%)",
                filter: "blur(1px)",
              }}
            />
          </div>

          <p
            className="text-center"
            style={{
              fontSize: "24px",
              lineHeight: "1.4",
              fontWeight: 450,
              letterSpacing: "-0.02em",
              color: "#202936",
            }}
          >
            {getGreeting()}{user?.firstName ? `, ${user.firstName}` : ""}
          </p>

          <p
            className="text-center text-sm max-w-[460px]"
            style={{ color: "#526273" }}
          >
            Ask CareBridge to find facilities, review placements, compare care options, and surface the information you need.
          </p>

          {composer}
        </div>
      ) : (
        /* ── Active Conversation ── */
        <div className="flex-1 overflow-y-auto min-h-0">
          <div ref={messageContainerRef} className="max-w-[640px] mx-auto px-5 pt-5 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className="group/message">
                {msg.role === "user" ? (
                  <div className="flex justify-end">
                    <div
                      className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed max-w-[85%]"
                      style={{
                        background: "#f0f4f8",
                        color: "#202936",
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5">
                    <div
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: "#eef3f8" }}
                    >
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: "#5a7b9b" }}
                      >
                        AI
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm leading-relaxed" style={{ color: "#202936" }}>
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
                          <span className="italic" style={{ color: "#9ca5b2" }}>
                            Thinking...
                          </span>
                        )}
                      </div>

                      {msg.facilities && msg.facilities.length > 0 && (
                        <ErrorBoundary>
                          <div className="grid gap-2 mt-2 sm:grid-cols-2">
                            {msg.facilities.map((facility) => (
                              <FacilityResultCard key={facility.id} facility={facility} />
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
                        <div className="mt-1">
                          <TypingIndicator />
                        </div>
                      )}

                      {!msg.isStreaming && msg.isError && (
                        <div className="flex items-center gap-2 mt-2">
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
                            className="gap-1.5 text-xs"
                            aria-label="Retry sending message"
                          >
                            <RiArrowGoBackLine className="size-3.5" />
                            Retry
                          </Button>
                        </div>
                      )}

                      {!msg.isStreaming && !msg.isError && msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {msg.suggestions.map((suggestion, si) => (
                            <button
                              key={si}
                              type="button"
                              onClick={() => handleFollowUpClick(suggestion)}
                              className="text-xs px-3 rounded-full border border-[#e0ebf4] bg-white text-[#5a6a7a] hover:bg-[#f0f6fb] hover:text-[#202936] transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}

                      {!msg.isStreaming && msg.content && (
                        <div className="flex items-center gap-2 mt-1 opacity-0 group-hover/message:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => copyMessage(msg.content, i)}
                            className="flex items-center gap-1 text-[11px] text-[#9ca5b2] hover:text-[#202936] transition-colors"
                            aria-label={copiedMessageIndex === i ? "Copied" : "Copy message"}
                          >
                            {copiedMessageIndex === i ? (
                              <RiCheckLine className="size-3" />
                            ) : (
                              <RiFileCopyLine className="size-3" />
                            )}
                          </button>
                          {msg.timestamp && (
                            <span className="text-[11px]" style={{ color: "#9ca5b2" }}>
                              {formatTime(msg.timestamp)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {hasStarted && (
        <div className="flex justify-center px-4 pb-6 pt-4">
          {composer}
        </div>
      )}
    </div>
  );
}
