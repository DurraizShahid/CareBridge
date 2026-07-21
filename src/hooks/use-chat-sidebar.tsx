"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

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
  const [newChatHandler, setNewChatHandler] = useState<() => void>(() => {});

  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);

  return (
    <ChatSidebarContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
        showNewChat,
        setShowNewChat,
        newChatHandler,
        setNewChatHandler,
      }}
    >
      {children}
    </ChatSidebarContext.Provider>
  );
}

export function useChatSidebar() {
  const ctx = useContext(ChatSidebarContext);
  if (!ctx) throw new Error("useChatSidebar must be used within ChatSidebarProvider");
  return ctx;
}
