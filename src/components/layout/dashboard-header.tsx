"use client";

import { usePathname } from "next/navigation";
import {
  RiSunLine,
  RiMoonLine,
  RiChatNewLine,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
} from "@remixicon/react";
import { useTheme } from "@/hooks/use-theme";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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

const PAGE_TITLES: { match: string; title: string }[] = [
  { match: "/dashboard/facility-network", title: "Facility Network" },
  { match: "/dashboard/documents", title: "Documentation" },
  { match: "/dashboard/users", title: "Users" },
  { match: "/dashboard/hospitals", title: "Hospitals" },
  { match: "/dashboard/home", title: "AI Assistant" },
  { match: "/admin/permissions", title: "Permissions" },
  { match: "/patients", title: "Patients" },
  { match: "/facilities", title: "Facilities" },
  { match: "/placements", title: "Placements" },
  { match: "/referrals", title: "Referrals" },
  { match: "/contracts", title: "Placement Agreement" },
  { match: "/users", title: "Users" },
  { match: "/dashboard", title: "Dashboard" },
];

function getPageTitle(pathname: string): string {
  const hit = PAGE_TITLES.find(
    (item) => pathname === item.match || pathname.startsWith(item.match + "/")
  );
  return hit?.title ?? "CareBridge";
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
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-10 flex h-[76px] shrink-0 items-center gap-3 bg-[#F7F7F5]/95 px-4 backdrop-blur-xl dark:bg-[#0E0E10]/95 md:px-8">
      {/* Left: controls + page title */}
      <div className="flex min-w-0 items-center gap-1.5">
        {onToggleChatSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleChatSidebar}
            className="size-8 shrink-0 text-foreground/70 hover:bg-muted hover:text-foreground"
            aria-label={chatSidebarOpen ? "Close chat history" : "Open chat history"}
          >
            {chatSidebarOpen ? (
              <RiMenuFoldLine className="size-4" />
            ) : (
              <RiMenuUnfoldLine className="size-4" />
            )}
          </Button>
        )}

        {!hideSidebarControls && (
          <SidebarTrigger className="size-8 shrink-0 text-foreground/70 hover:bg-muted hover:text-foreground md:hidden" />
        )}
        {!hideSidebarControls && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebarLock}
            aria-label={sidebarLocked ? "Auto-collapse sidebar" : "Keep sidebar expanded"}
            className="hidden size-8 shrink-0 text-foreground/70 hover:bg-muted hover:text-foreground md:inline-flex"
          >
            {sidebarLocked ? (
              <RiMenuFoldLine className="size-4" />
            ) : (
              <RiMenuUnfoldLine className="size-4" />
            )}
          </Button>
        )}

        <Separator orientation="vertical" className="mx-1 hidden h-5 sm:block" />

        <div className="min-w-0">
          <p className="truncate text-lg font-semibold tracking-tight text-brand-navy dark:text-white">
            {pageTitle}
          </p>
        </div>
      </div>

      <p className="mx-auto hidden text-xs font-medium tracking-wide text-[#8093A8] lg:block">Care coordination workspace</p>
      {/* Right: actions */}
      <div className="ml-auto flex items-center gap-0.5">
        {showNewChat && onNewChat && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onNewChat}
            className="mr-1 h-8 gap-1.5 rounded-full px-3 text-xs"
            aria-label="Start a new chat"
          >
            <RiChatNewLine className="size-3.5" />
            New Chat
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="size-10 rounded-full bg-white text-[#255DCE] shadow-sm hover:bg-[#EEF4FC] dark:bg-[#1A1C22] dark:text-[#DCEBFF]"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <RiSunLine className="size-4" />
          ) : (
            <RiMoonLine className="size-4" />
          )}
        </Button>

        <Separator orientation="vertical" className="mx-1.5 hidden h-5 sm:block" />

        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: "size-8",
              userButtonTrigger: cn(
                "outline-none rounded-full ring-offset-card",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              ),
            },
          }}
        />
      </div>
    </header>
  );
}
