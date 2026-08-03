"use client";

import { RiNotificationLine, RiSearchLine, RiSunLine, RiMoonLine, RiChatNewLine, RiMenuFoldLine, RiMenuUnfoldLine, RiHospitalLine } from "@remixicon/react";
import { useTheme } from "@/hooks/use-theme";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  sidebarLocked: boolean;
  onToggleSidebarLock: () => void;
  hideSidebarControls?: boolean;
  showNewChat?: boolean;
  onNewChat?: () => void;
  chatSidebarOpen?: boolean;
  onToggleChatSidebar?: () => void;
}

export function DashboardHeader({
  sidebarLocked,
  onToggleSidebarLock,
  hideSidebarControls,
  showNewChat,
  onNewChat,
  chatSidebarOpen,
  onToggleChatSidebar,
}: DashboardHeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-10 flex h-12 items-center justify-between gap-4 border-b border-[#eceaf2]/50 bg-white/40 px-4 backdrop-blur-xl transition-colors md:px-6">
      <div className="flex items-center gap-2">
        {/* Branding */}
        <div className="flex items-center gap-2 mr-3">
          <div className="flex size-7 items-center justify-center rounded-full bg-[#f3f1f8]">
            <RiHospitalLine className="size-4 text-[#7d7a89]" />
          </div>
          <span className="text-sm font-medium tracking-tight text-[#111014] hidden sm:inline">
            CareBridge
          </span>
        </div>

        {/* Chat sidebar toggle */}
        {onToggleChatSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleChatSidebar}
            className="size-8 text-muted-foreground hover:text-foreground"
            aria-label={chatSidebarOpen ? "Close chat history" : "Open chat history"}
          >
            {chatSidebarOpen ? <RiMenuFoldLine className="size-4" /> : <RiMenuUnfoldLine className="size-4" />}
          </Button>
        )}

        {!hideSidebarControls && (
          <SidebarTrigger className="md:hidden min-h-9 min-w-9" />
        )}
        {!hideSidebarControls && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebarLock}
            aria-label={sidebarLocked ? "Auto-collapse sidebar" : "Keep sidebar expanded"}
            className="hidden md:inline-flex text-[#8d8a98] hover:text-[#111014]"
          >
            {sidebarLocked ? <RiMenuFoldLine className="size-4" /> : <RiMenuUnfoldLine className="size-4" />}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-0.5">
        {showNewChat && onNewChat && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onNewChat}
            className={cn("gap-1.5 rounded-full h-8 text-xs mr-1 bg-[#f3f1f8] text-[#6c6a78] border-0 hover:bg-[#e8e6ef]")}
            aria-label="Start a new chat"
          >
            <RiChatNewLine className="size-3.5" />
            New Chat
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-[#8d8a98] hover:text-[#111014] hover:bg-[#f3f1f8]"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <RiSunLine className="size-4" /> : <RiMoonLine className="size-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="size-8 text-[#8d8a98] hover:text-[#111014] hover:bg-[#f3f1f8]" aria-label="Search">
          <RiSearchLine className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="relative size-8 text-[#8d8a98] hover:text-[#111014] hover:bg-[#f3f1f8]" aria-label="Notifications">
          <RiNotificationLine className="size-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
        </Button>
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: "size-7",
              userButtonTrigger: "outline-none rounded-full shadow-none",
            },
          }}
        />
      </div>
    </header>
  );
}
