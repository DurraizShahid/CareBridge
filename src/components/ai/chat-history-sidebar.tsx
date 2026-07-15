"use client";

import { useState, useEffect } from "react";
import {
  RiAddLine,
  RiChat1Line,
  RiDeleteBinLine,
  RiMoreLine,
  RiChatNewLine,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
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
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

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
    setActiveMenuId(null);
  };

  const groupedChats = groupChatsByDate(chats);

  return (
    <div className="flex h-full flex-col bg-background/40 backdrop-blur-xl">
      {/* New Chat Button */}
      <div className="p-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onNewChat}
          className="w-full justify-start gap-2 h-9 text-sm font-normal"
        >
          <RiChatNewLine className="size-4" />
          New Chat
        </Button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 rounded-lg bg-muted/50 animate-pulse"
              />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <RiChat1Line className="size-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground/60">
              No chat history yet
            </p>
            <p className="text-xs text-muted-foreground/40 mt-1">
              Start a new conversation
            </p>
          </div>
        ) : (
          groupedChats.map((group) => (
            <div key={group.label} className="mb-4">
              <div className="px-2 py-1.5">
                <span className="text-xs font-medium text-muted-foreground/60">
                  {group.label}
                </span>
              </div>
              <div className="space-y-0.5">
                {group.chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={cn(
                      "group relative flex items-center gap-2 rounded-lg px-2 py-2 cursor-pointer transition-colors",
                      currentChatId === chat.id
                        ? "bg-accent/50 text-accent-foreground"
                        : "hover:bg-accent/30 text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => onChatSelect(chat.id)}
                    onMouseEnter={() => setHoveredChatId(chat.id)}
                    onMouseLeave={() => {
                      setHoveredChatId(null);
                      if (activeMenuId === chat.id) {
                        setActiveMenuId(null);
                      }
                    }}
                  >
                    <RiChat1Line className="size-4 shrink-0 opacity-60" />
                    <span className="flex-1 truncate text-sm">
                      {chat.title}
                    </span>
                    {(hoveredChatId === chat.id || activeMenuId === chat.id) && (
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(
                              activeMenuId === chat.id ? null : chat.id
                            );
                          }}
                          className="p-1 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <RiMoreLine className="size-3.5" />
                        </button>
                        {activeMenuId === chat.id && (
                          <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border bg-popover p-1 shadow-md">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(chat.id);
                              }}
                              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <RiDeleteBinLine className="size-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
