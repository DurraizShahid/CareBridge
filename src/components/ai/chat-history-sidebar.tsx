"use client";

import { useState, useEffect } from "react";
import {
  RiChat1Line,
  RiDeleteBinLine,
  RiChatNewLine,
  RiSearchLine,
  RiMessage2Line,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    messages: number;
  };
}

interface ChatHistorySidebarProps {
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  refreshTrigger?: number;
}

function groupChatsByDate(chats: Chat[]): { label: string; chats: Chat[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const groups: { label: string; chats: Chat[] }[] = [
    { label: "Today", chats: [] },
    { label: "Yesterday", chats: [] },
    { label: "Previous 7 Days", chats: [] },
    { label: "Previous 30 Days", chats: [] },
    { label: "Older", chats: [] },
  ];

  for (const chat of chats) {
    const date = new Date(chat.updatedAt);
    if (date >= today) {
      groups[0].chats.push(chat);
    } else if (date >= yesterday) {
      groups[1].chats.push(chat);
    } else if (date >= sevenDaysAgo) {
      groups[2].chats.push(chat);
    } else if (date >= thirtyDaysAgo) {
      groups[3].chats.push(chat);
    } else {
      groups[4].chats.push(chat);
    }
  }

  return groups.filter((g) => g.chats.length > 0);
}

export function ChatHistorySidebar({
  currentChatId,
  onChatSelect,
  onNewChat,
  refreshTrigger,
}: ChatHistorySidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Chat | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadChats = async () => {
      try {
        const response = await fetch("/api/chats");
        if (response.ok && !cancelled) {
          const data = await response.json();
          setChats(data);
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    loadChats();
    return () => {
      cancelled = true;
    };
  }, [refreshTrigger]);

  const handleDelete = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setChats((prev) => prev.filter((c) => c.id !== chatId));
        if (currentChatId === chatId) {
          onNewChat();
        }
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
    setDeleteTarget(null);
  };

  const filteredChats = searchQuery
    ? chats.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : chats;

  const groupedChats = groupChatsByDate(filteredChats);

  function getChatInitial(title: string) {
    return title.charAt(0).toUpperCase();
  }

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
        <h2 className="text-sm font-semibold text-foreground">Chat History</h2>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onNewChat}
          className="size-7 text-muted-foreground hover:text-foreground"
          aria-label="New chat"
        >
          <RiChatNewLine className="size-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <RiSearchLine className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs rounded-lg bg-accent/30 border-none placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-ring/30"
          />
        </div>
      </div>

      {/* Chat List */}
      <nav className="flex-1 overflow-y-auto px-2 pb-2" aria-label="Chat history">
        {isLoading ? (
          <div className="space-y-1 px-1 pt-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-2.5 rounded-lg px-2 py-2">
                <Skeleton className="size-7 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4 rounded" />
                  <Skeleton className="h-2.5 w-1/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted/50">
              <RiMessage2Line className="size-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground/80">
              {searchQuery ? "No matching conversations" : "No conversations yet"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60 leading-relaxed">
              {searchQuery
                ? "Try a different search term"
                : "Start a new chat to begin"}
            </p>
          </div>
        ) : (
          groupedChats.map((group) => (
            <div key={group.label} className="mb-2">
              <div className="px-2 py-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {group.label}
                </span>
              </div>
              <div className="space-y-px">
                {group.chats.map((chat) => {
                  const isActive = currentChatId === chat.id;
                  return (
                    <div
                      key={chat.id}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-lg px-2 py-2 cursor-pointer transition-all",
                        isActive
                          ? "bg-accent/60 text-accent-foreground ring-1 ring-border/40"
                          : "hover:bg-accent/30 text-muted-foreground hover:text-foreground",
                      )}
                      onClick={() => onChatSelect(chat.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onChatSelect(chat.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Chat: ${chat.title}`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                      )}

                      <Avatar className="size-7 shrink-0">
                        <AvatarFallback
                          className={cn(
                            "text-[11px] font-medium",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "bg-muted/70 text-muted-foreground",
                          )}
                        >
                          {getChatInitial(chat.title)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-sm leading-tight",
                            isActive
                              ? "font-medium text-foreground"
                              : "font-normal",
                          )}
                        >
                          {chat.title}
                        </span>
                        {chat._count.messages > 0 && (
                          <span className="text-[11px] text-muted-foreground/60">
                            {chat._count.messages}{" "}
                            {chat._count.messages === 1 ? "message" : "messages"}
                          </span>
                        )}
                      </div>

                      {chat._count.messages > 0 && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "shrink-0 px-1.5 py-0 text-[10px] font-medium leading-none",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "bg-muted/50 text-muted-foreground/70",
                          )}
                        >
                          {chat._count.messages}
                        </Badge>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(chat);
                        }}
                        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 flex items-center justify-center size-6 shrink-0 rounded-md text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 transition-all duration-150"
                        aria-label={`Delete ${chat.title}`}
                      >
                        <RiDeleteBinLine className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </nav>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{deleteTarget?.title}&rdquo; and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
