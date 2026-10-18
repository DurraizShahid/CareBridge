"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { ArrowUp, Copy, Check, History, LayoutDashboard, PenSquare, RotateCcw, Square } from "lucide-react";

import { FacilityResultCard, type ChatFacility } from "@/components/ai/facility-result-card";
import { PlacementConfirmationCard } from "@/components/ai/placement-confirmation-card";
import { ChatHistorySidebar } from "@/components/ai/chat-history-sidebar";
import { ChatPlacementFlow } from "@/components/ai/chat-placement-flow";
import { BrandMark } from "@/components/brand-logo";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { PlacementDraft } from "@/lib/ai/tool-handlers";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  facilities?: ChatFacility[];
  placementDraft?: PlacementDraft;
  suggestions?: string[];
  isStreaming?: boolean;
  isError?: boolean;
  timestamp?: number;
}

const STARTERS = [
  "78-year-old, hip fracture after ORIF, Medicare, needs skilled nursing near Austin",
  "Post-stroke rehab for a 64-year-old with left-side weakness, Aetna, Dallas",
  "Memory care for moderate Alzheimer's, Medicaid, family prefers Houston",
];

function sanitizeStreamingMarkdown(content: string): string {
  const parts = content.split("```");
  if (parts.length % 2 === 0) return parts.slice(0, -1).join("```");
  return content.replace(/<!--[\s\S]*?(?:-->|$)/g, (m) => (m.endsWith("-->") ? m : ""));
}

function isValidFacility(data: unknown): data is ChatFacility {
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

function parseSuggestions(content: string): { cleanContent: string; suggestions: string[] } {
  const match = content.match(/<!--suggestions-->([\s\S]*?)<!--\/suggestions-->/);
  if (!match) return { cleanContent: content.replace(/<!--suggestions-->[\s\S]*$/, ""), suggestions: [] };
  try {
    const parsed = JSON.parse(match[1]);
    return {
      cleanContent: content.replace(match[0], ""),
      suggestions: Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string").slice(0, 3) : [],
    };
  } catch {
    return { cleanContent: content.replace(match[0], ""), suggestions: [] };
  }
}

function processAIBuffer(
  buffer: string,
  cb: {
    onText: (token: string) => void;
    onFacilities: (facilities: ChatFacility[]) => void;
    onPlacementDraft: (draft: PlacementDraft) => void;
    onError: (error: string) => void;
  },
) {
  const events = buffer.split("\n\n");
  const remainder = events.pop() || "";
  for (const event of events) {
    if (!event.trim()) continue;
    let type = "";
    let data = "";
    for (const line of event.split("\n")) {
      if (line.startsWith("event: ")) type = line.slice(7);
      if (line.startsWith("data: ")) data = line.slice(6);
    }
    try {
      if (type === "text") cb.onText(JSON.parse(data));
      else if (type === "facilities") {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(isValidFacility);
          if (valid.length > 0) cb.onFacilities(valid);
        }
      } else if (type === "placement-draft") {
        const parsed = JSON.parse(data);
        if (isValidPlacementDraft(parsed)) cb.onPlacementDraft(parsed);
      } else if (type === "error") {
        const parsed = JSON.parse(data);
        cb.onError(typeof parsed === "string" ? parsed : parsed.message || "The assistant could not answer. Try again.");
      }
    } catch {
      if (type === "error") cb.onError("The assistant could not answer. Try again.");
    }
  }
  return remainder;
}

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 marker:text-[var(--chat-dim)]">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 marker:text-[var(--chat-dim)]">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  h1: ({ children }) => <h2 className="mb-2 mt-5 text-lg font-semibold first:mt-0">{children}</h2>,
  h2: ({ children }) => <h3 className="mb-2 mt-5 text-base font-semibold first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-1.5 mt-4 font-semibold first:mt-0">{children}</h4>,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-2xl bg-[var(--chat-raised)]">
      <table className="w-full border-collapse text-[13px] tabular-nums">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="bg-[var(--chat-quiet)] px-3 py-2 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-t border-[var(--chat-quiet)] px-3 py-2">{children}</td>,
  code: ({ children }) => <code className="rounded-md bg-[var(--chat-quiet)] px-1.5 py-0.5 font-mono text-[13px]">{children}</code>,
  pre: ({ children }) => <pre className="my-3 overflow-x-auto rounded-2xl bg-[var(--chat-quiet)] p-4 text-[13px]">{children}</pre>,
  a: ({ href, children }) => {
    const safe = href && (/^https?:\/\//i.test(href) || href.startsWith("/")) ? href : undefined;
    return safe ? (
      <a href={safe} {...(safe.startsWith("/") ? {} : { target: "_blank", rel: "noopener noreferrer" })} className="font-medium text-[var(--chat-accent)] underline underline-offset-4">
        {children}
      </a>
    ) : <span>{children}</span>;
  },
};

const sanitizeSchema = {
  ...defaultSchema,
  attributes: { ...defaultSchema.attributes, code: ["className"] },
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const iconButton =
  "flex size-10 cursor-pointer items-center justify-center rounded-full text-[var(--chat-dim)] transition-colors hover:bg-[var(--chat-quiet)] hover:text-[var(--chat-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chat-accent)]";

export function ChatWorkspace() {
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selected, setSelected] = useState<{ msgIndex: number; facility: ChatFacility } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const streamingRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);

  const hasStarted = messages.length > 0;

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages]);
  useEffect(() => {
    if (!historyOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setHistoryOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [historyOpen]);

  // Grow the composer with its content, up to a cap.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 220) + "px";
  }, [query]);

  const updateLast = (fn: (last: ChatMessage) => ChatMessage) =>
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role !== "assistant" || !last.isStreaming) return prev;
      return [...prev.slice(0, -1), fn(last)];
    });

  const finalizeLast = () =>
    updateLast((last) => {
      const { cleanContent, suggestions } = parseSuggestions(sanitizeStreamingMarkdown(last.content || ""));
      return { ...last, content: cleanContent, suggestions, isStreaming: false };
    });

  const saveMessage = (chatId: string, role: string, content: string) =>
    fetch(`/api/chats/${chatId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, content }),
    }).catch((e) => console.error("Error saving message:", e));

  const handleNewChat = useCallback(() => {
    abortRef.current?.abort();
    streamingRef.current = false;
    setMessages([]);
    setSelected(null);
    setIsStreaming(false);
    setCurrentChatId(null);
    setRefreshTrigger((n) => n + 1);
    inputRef.current?.focus();
  }, []);

  const handleChatSelect = async (chatId: string) => {
    abortRef.current?.abort();
    setHistoryOpen(false);
    setCurrentChatId(chatId);
    setIsStreaming(false);
    setSelected(null);
    try {
      const res = await fetch(`/api/chats/${chatId}`);
      if (!res.ok) return;
      const chat = await res.json();
      setMessages(chat.messages.map((m: { role: string; content: string }) => ({ role: m.role as ChatMessage["role"], content: m.content })));
    } catch (e) {
      console.error("Error loading chat:", e);
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    streamingRef.current = false;
    setIsStreaming(false);
    finalizeLast();
  };

  const sendMessage = async (raw: string) => {
    const text = raw.trim();
    if (!text || streamingRef.current) return;
    streamingRef.current = true;
    setQuery("");

    const ts = Date.now();
    setMessages((prev) => [...prev, { role: "user", content: text, timestamp: ts }, { role: "assistant", content: "", isStreaming: true, timestamp: ts }]);
    setIsStreaming(true);

    let chatId = currentChatId;
    const chatPromise = !chatId
      ? fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: text.slice(0, 60) }),
        }).then((r) => (r.ok ? r.json() : null)).catch(() => null)
      : Promise.resolve(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const history = [...messagesRef.current.map((m) => ({ role: m.role, content: m.content })), { role: "user", content: text }];
      const responsePromise = fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });

      const created = await chatPromise;
      if (created) {
        chatId = created.id;
        setCurrentChatId(chatId);
        setRefreshTrigger((n) => n + 1);
      }

      const response = await responsePromise;
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || `Request failed (${response.status})`);
      }
      if (chatId) saveMessage(chatId, "user", text);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        buffer = processAIBuffer(buffer, {
          onText: (token) => {
            full += token;
            updateLast((last) => ({ ...last, content: last.content + token }));
          },
          onFacilities: (facilities) =>
            updateLast((last) => {
              const seen = new Set((last.facilities ?? []).map((f) => f.id));
              return { ...last, facilities: [...(last.facilities ?? []), ...facilities.filter((f) => !seen.has(f.id))] };
            }),
          onPlacementDraft: (draft) => updateLast((last) => ({ ...last, placementDraft: draft })),
          onError: (err) => updateLast((last) => ({ ...last, content: last.content || err, isStreaming: false, isError: true })),
        });
      }

      if (chatId && full) saveMessage(chatId, "assistant", parseSuggestions(full).cleanContent);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        const msg = /429|too many/i.test(err.message) ? err.message : "The assistant could not answer. Check your connection and try again.";
        updateLast((last) => ({ ...last, content: msg, isStreaming: false, isError: true }));
      }
    } finally {
      streamingRef.current = false;
      abortRef.current = null;
      setIsStreaming(false);
      finalizeLast();
    }
  };

  const copy = async (text: string, i: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(i);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {}
  };

  const composer = (
    <form
      onSubmit={(e) => { e.preventDefault(); void sendMessage(query); }}
      className="w-full rounded-[28px] bg-[var(--chat-raised)] p-2 shadow-[0_18px_40px_-18px_rgba(16,43,78,0.28)] transition-shadow focus-within:shadow-[0_22px_48px_-18px_rgba(37,93,206,0.35)] dark:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.7)]"
    >
      <label htmlFor="chat-input" className="sr-only">Describe the patient or ask CareBridge</label>
      <textarea
        id="chat-input"
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            void sendMessage(query);
          }
        }}
        rows={hasStarted ? 1 : 3}
        maxLength={10000}
        placeholder={hasStarted ? "Reply, or describe another patient" : "Age, diagnosis, care needs, insurance and preferred location"}
        className="block max-h-[220px] w-full resize-none bg-transparent px-4 pt-3 text-base leading-relaxed text-[var(--chat-ink)] outline-none placeholder:text-[var(--chat-dim)]"
      />
      <div className="flex items-center justify-between gap-3 px-2 pb-1 pt-2">
        <p className="pl-2 text-[13px] text-[var(--chat-dim)]">
          <span className="hidden sm:inline">Enter to send, Shift + Enter for a new line</span>
        </p>
        {isStreaming ? (
          <button type="button" onClick={stop} className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-[var(--chat-ink)] text-[var(--chat-raised)] transition-transform active:scale-95" aria-label="Stop generating">
            <Square className="size-3.5 fill-current" aria-hidden="true" />
          </button>
        ) : (
          <button type="submit" disabled={!query.trim()} className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-[var(--chat-accent)] text-white transition-[transform,opacity] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chat-accent)] focus-visible:ring-offset-2 dark:text-[#0E1A2E]" aria-label="Send message">
            <ArrowUp className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </form>
  );

  return (
    <div className="cb-chat relative flex h-dvh flex-col bg-background text-[var(--chat-ink)]">
      <a href="#chat-input" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-[var(--chat-raised)] focus:px-4 focus:py-2">
        Skip to message box
      </a>

      <header className="flex h-16 shrink-0 items-center gap-2 px-3 sm:px-5">
        <SidebarTrigger className="size-10 shrink-0" aria-label="Toggle navigation" />
        <button type="button" onClick={() => setHistoryOpen(true)} className={iconButton} aria-label="Open chat history" aria-expanded={historyOpen} aria-controls="chat-history">
          <History className="size-[18px]" aria-hidden="true" />
        </button>
        <Link href="/chat" aria-label="CareBridge Assistant" onClick={handleNewChat} className="flex items-center gap-2 rounded-full pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chat-accent)]">
          <span aria-hidden="true"><BrandMark tone="blue" className="size-7" /></span>
          <span className="hidden font-heading text-[17px] font-medium tracking-[-0.01em] min-[360px]:inline">CareBridge</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1" aria-label="Workspace">
          {hasStarted && (
            <button type="button" onClick={handleNewChat} className={cn(iconButton, "w-auto gap-2 px-3 text-sm font-medium")}>
              <PenSquare className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">New chat</span>
              <span className="sr-only sm:hidden">New chat</span>
            </button>
          )}
          <Link href="/dashboard" className={cn(iconButton, "w-auto gap-2 px-3 text-sm font-medium")}>
            <LayoutDashboard className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sr-only sm:hidden">Dashboard</span>
          </Link>
          <div className="ml-1 flex items-center">
            <UserButton appearance={{ elements: { userButtonAvatarBox: "size-9" } }}>
              <UserButton.MenuItems>
                <UserButton.Link label="Dashboard" href="/dashboard" labelIcon={<LayoutDashboard className="size-4" />} />
              </UserButton.MenuItems>
            </UserButton>
          </div>
        </nav>
      </header>

      {/* History drawer */}
      <div
        className={cn("fixed inset-0 z-[55] bg-[#102B4E]/25 transition-opacity duration-300 dark:bg-black/50", historyOpen ? "opacity-100" : "pointer-events-none opacity-0")}
        onClick={() => setHistoryOpen(false)}
        aria-hidden="true"
      />
      <aside
        id="chat-history"
        aria-label="Chat history"
        inert={!historyOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-[56] w-[min(320px,86vw)] shadow-[0_24px_60px_-20px_rgba(16,43,78,0.35)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
          historyOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <ChatHistorySidebar
          currentChatId={currentChatId}
          onChatSelect={handleChatSelect}
          onNewChat={() => { handleNewChat(); setHistoryOpen(false); }}
          refreshTrigger={refreshTrigger}
        />
      </aside>

      <div className="flex min-h-0 flex-1 flex-col">
        {!hasStarted ? (
          <div className="flex flex-1 flex-col justify-center overflow-y-auto px-4 pb-10 sm:px-6">
            <div className="cb-rise mx-auto w-full max-w-[720px]">
              <h1 className="font-heading text-[clamp(2rem,5vw,3.25rem)] font-medium leading-[1.02] tracking-[-0.03em] [text-wrap:balance]">
                {greeting()}{user?.firstName ? `, ${user.firstName}` : ""}.
              </h1>
              <p className="mt-3 max-w-[56ch] text-[17px] leading-relaxed text-[var(--chat-dim)]">
                Describe a patient and I&apos;ll rank facilities with open beds. Tour them, pay the deposit and discharge, all from here.
              </p>
              <div className="mt-8">{composer}</div>
              <div className="mt-8">
                <h2 className="text-sm font-medium text-[var(--chat-dim)]">Try a patient like</h2>
                <ul className="mt-2 grid gap-1">
                  {STARTERS.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => void sendMessage(s)}
                        className="w-full cursor-pointer rounded-2xl px-4 py-3 text-left text-[15px] leading-snug text-[var(--chat-ink)] transition-colors hover:bg-[var(--chat-quiet)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chat-accent)]"
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-6" role="log" aria-label="Conversation" aria-busy={isStreaming}>
              <div className="mx-auto w-full max-w-[760px] space-y-8 pb-6 pt-4">
                {messages.map((msg, i) => (
                  <div key={i} className="group/message">
                    {msg.role === "user" ? (
                      <div className="flex justify-end">
                        <p className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-lg bg-[var(--chat-user)] px-5 py-3 text-[15px] leading-relaxed [overflow-wrap:anywhere]">
                          {msg.content}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <span aria-hidden="true" className="mt-0.5 shrink-0"><BrandMark tone="blue" className="size-7" /></span>
                        <div className="min-w-0 flex-1">
                          <h2 className="sr-only">CareBridge reply</h2>
                          {msg.content ? (
                            <div className={cn("text-[15px] leading-[1.65] [overflow-wrap:anywhere]", msg.isError && "text-[#B42318] dark:text-[#FDA29B]")}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeSanitize, sanitizeSchema]]} components={markdownComponents}>
                                {msg.isStreaming ? sanitizeStreamingMarkdown(msg.content) : msg.content}
                              </ReactMarkdown>
                            </div>
                          ) : null}

                          {msg.isStreaming && (
                            <p className="cb-typing mt-1 flex h-6 items-center gap-1" role="status">
                              <span className="size-1.5 rounded-full bg-[var(--chat-accent)]" />
                              <span className="size-1.5 rounded-full bg-[var(--chat-accent)]" />
                              <span className="size-1.5 rounded-full bg-[var(--chat-accent)]" />
                              <span className="sr-only">CareBridge is matching facilities</span>
                            </p>
                          )}

                          {msg.facilities && msg.facilities.length > 0 && (
                            <ErrorBoundary>
                              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                {msg.facilities.map((f, fi) => (
                                  <FacilityResultCard
                                    key={f.id}
                                    facility={f}
                                    bestMatch={fi === 0}
                                    selected={selected?.msgIndex === i && selected.facility.id === f.id}
                                    onSelect={msg.isStreaming ? undefined : (facility) => setSelected({ msgIndex: i, facility })}
                                  />
                                ))}
                              </div>
                            </ErrorBoundary>
                          )}

                          {selected?.msgIndex === i && (
                            <ErrorBoundary>
                              <ChatPlacementFlow key={selected.facility.id} facility={selected.facility} onClose={() => setSelected(null)} />
                            </ErrorBoundary>
                          )}

                          {msg.placementDraft && !msg.isStreaming && (
                            <ErrorBoundary>
                              <div className="mt-4">
                                <PlacementConfirmationCard
                                  draft={msg.placementDraft}
                                  onConfirmed={() => {}}
                                  onDismiss={() => setMessages((prev) => prev.map((m, mi) => (mi === i ? { ...m, placementDraft: undefined } : m)))}
                                />
                              </div>
                            </ErrorBoundary>
                          )}

                          {!msg.isStreaming && msg.isError && (
                            <button
                              type="button"
                              onClick={() => {
                                const prevUser = messages.slice(0, i).reverse().find((m) => m.role === "user");
                                if (prevUser) void sendMessage(prevUser.content);
                              }}
                              className="mt-3 inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--chat-quiet)] px-4 text-[13px] font-medium"
                            >
                              <RotateCcw className="size-3.5" aria-hidden="true" />
                              Try again
                            </button>
                          )}

                          {!msg.isStreaming && !msg.isError && msg.suggestions && msg.suggestions.length > 0 && i === messages.length - 1 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {msg.suggestions.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => void sendMessage(s)}
                                  className="min-h-9 cursor-pointer rounded-full bg-[var(--chat-raised)] px-4 py-1.5 text-left text-[13px] leading-snug transition-colors hover:bg-[var(--chat-quiet)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chat-accent)]"
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}

                          {!msg.isStreaming && msg.content && (
                            <div className="mt-2 flex items-center gap-2 opacity-0 transition-opacity focus-within:opacity-100 group-hover/message:opacity-100">
                              <button
                                type="button"
                                onClick={() => copy(msg.content, i)}
                                className="flex size-8 cursor-pointer items-center justify-center rounded-full text-[var(--chat-dim)] hover:bg-[var(--chat-quiet)] hover:text-[var(--chat-ink)]"
                                aria-label={copiedIndex === i ? "Copied" : "Copy reply"}
                              >
                                {copiedIndex === i ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
                              </button>
                              {msg.timestamp && (
                                <span className="text-[13px] text-[var(--chat-dim)] tabular-nums">
                                  {new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(msg.timestamp)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={endRef} />
              </div>
            </div>
            <div className="shrink-0 px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
              <div className="mx-auto w-full max-w-[760px]">
                {composer}
                <p className="mt-2 text-center text-[13px] text-[var(--chat-dim)]">
                  Recommendations come from live network availability. Confirm clinical fit before referring.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
