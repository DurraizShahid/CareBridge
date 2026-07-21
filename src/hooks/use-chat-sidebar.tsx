"use client";

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";

interface ChatSidebarContextValue {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  showNewChat: boolean;
  setShowNewChat: (show: boolean) => void;
  newChatHandler: () => void;
  setNewChatHandler: (handler: () => void) => void;
}

const ChatSidebarContext = createContext<ChatSidebarContextValue | null>(null);

export function ChatSidebarProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatHandler, setRawNewChatHandler] = useState<() => void>(() => () => {});

  const setNewChatHandler = useCallback((handler: () => void) => {
    setRawNewChatHandler(() => handler);
  }, []);

  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);

  const value = useMemo(() => ({
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    showNewChat,
    setShowNewChat,
    newChatHandler,
    setNewChatHandler,
  }), [sidebarOpen, showNewChat, newChatHandler, toggleSidebar, setShowNewChat, setNewChatHandler]);

  return (
    <ChatSidebarContext.Provider value={value}>
      {children}
    </ChatSidebarContext.Provider>
  );
}

export function useChatSidebar() {
  const ctx = useContext(ChatSidebarContext);
  if (!ctx) throw new Error("useChatSidebar must be used within ChatSidebarProvider");
  return ctx;
}
