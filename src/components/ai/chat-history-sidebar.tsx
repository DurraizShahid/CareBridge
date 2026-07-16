"use client";

import { useState, useEffect } from "react";
import {
  RiChat1Line,
  RiDeleteBinLine,
  RiChatNewLine,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

  const groupedChats = groupChatsByDate(chats);

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* New Chat Button */}
      <div className="px-2 pt-2 pb-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onNewChat}
          className="w-full justify-start gap-2 h-8 text-sm font-normal"
        >
          <RiChatNewLine className="size-4" />
          New Chat
        </Button>
      </div>

      {/* Chat List */}
      <nav className="flex-1 overflow-y-auto px-1 pb-2" aria-label="Chat history">
        {isLoading ? (
          <div className="space-y-1 px-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-2">
                <Skeleton className="size-4 shrink-0" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-3 text-center">
            <RiChat1Line className="size-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-muted-foreground/80">
              No conversations yet
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Start a new chat to begin
            </p>
          </div>
        ) : (
          groupedChats.map((group) => (
            <div key={group.label} className="mb-2">
              <div className="px-2 py-0.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {group.label}
                </span>
              </div>
              <div className="space-y-px">
                {group.chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={cn(
                      "group relative flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-1",
                      currentChatId === chat.id
                        ? "bg-accent/50 text-accent-foreground"
                        : "hover:bg-accent/30 text-muted-foreground hover:text-foreground"
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
                    aria-current={currentChatId === chat.id ? "page" : undefined}
                  >
                    <RiChat1Line className="size-4 shrink-0 opacity-60" />
                    <span className="flex-1 truncate text-sm">
                      {chat.title}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(chat);
                      }}
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 transition-all duration-150"
                      aria-label={`Delete ${chat.title}`}
                    >
                      <RiDeleteBinLine className="size-3.5" />
                    </button>
                  </div>
                ))}
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
