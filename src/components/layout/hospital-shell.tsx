"use client";

import { DashboardHeader } from "./dashboard-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatSidebarProvider } from "@/hooks/use-chat-sidebar";
import { usePathname } from "next/navigation";

const FULL_WIDTH_ROUTES = ["/dashboard/home"];
const CHAT_SIDEBAR_ROUTES = ["/chat"];

function HospitalShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullWidth = FULL_WIDTH_ROUTES.includes(pathname);
  const isChatRoute = CHAT_SIDEBAR_ROUTES.includes(pathname);

  // AI Chat page gets its own full-screen layout without header/scrollarea
  if (isChatRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <DashboardHeader />
      <ScrollArea className="flex-1 min-h-0">
        {isFullWidth ? (
          children
        ) : (
          <div className="mx-auto w-full max-w-7xl px-4 py-9 sm:px-6 lg:px-10">
            {children}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export function HospitalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatSidebarProvider>
      <HospitalShellInner>{children}</HospitalShellInner>
    </ChatSidebarProvider>
  );
}
