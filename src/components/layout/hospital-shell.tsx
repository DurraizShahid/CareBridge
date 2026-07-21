"use client";

import { HospitalDock } from "./hospital-dock";
import { DashboardHeader } from "./dashboard-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeProvider } from "@/hooks/use-theme";
import { OrganizationProvider } from "@/hooks/use-organization";
import { ChatSidebarProvider, useChatSidebar } from "@/hooks/use-chat-sidebar";
import { usePathname } from "next/navigation";

const FULL_WIDTH_ROUTES = ["/dashboard/home"];
const CHAT_SIDEBAR_ROUTES = ["/dashboard/home"];

function HospitalShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullWidth = FULL_WIDTH_ROUTES.includes(pathname);
  const isChatRoute = CHAT_SIDEBAR_ROUTES.includes(pathname);

  const { showNewChat, newChatHandler } = useChatSidebar();

  return (
    <div className="flex h-screen flex-col bg-background">
      <DashboardHeader
        sidebarLocked={false}
        onToggleSidebarLock={() => {}}
        hideSidebarControls
        showNewChat={isChatRoute ? showNewChat : false}
        onNewChat={isChatRoute ? newChatHandler : undefined}
      />
      <ScrollArea className="flex-1 min-h-0">
        {isFullWidth ? (
          children
        ) : (
          <div className="mx-auto w-full max-w-7xl px-6 py-8 pb-24">
            {children}
          </div>
        )}
      </ScrollArea>
      <HospitalDock />
    </div>
  );
}

export function HospitalShell({
  children,
}: {
  children: React.ReactNode;
  sidebarLocked?: boolean;
  onToggle?: () => void;
}) {
  return (
    <ThemeProvider>
      <OrganizationProvider>
        <ChatSidebarProvider>
          <HospitalShellInner>
            {children}
          </HospitalShellInner>
        </ChatSidebarProvider>
      </OrganizationProvider>
    </ThemeProvider>
  );
}
