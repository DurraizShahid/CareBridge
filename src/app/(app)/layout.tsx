"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeProvider } from "@/hooks/use-theme";
import { OrganizationProvider } from "@/hooks/use-organization";

function AppLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-1">
      <TooltipProvider delay={0}>
        <SidebarProvider defaultOpen={true}>
          <AppSidebar />
          <main className="flex flex-1 flex-col bg-muted/30 dark:bg-background">
            <DashboardHeader />
            <ScrollArea className="flex-1 min-h-0">
              <div className="mx-auto w-full max-w-7xl pl-4 pr-6 py-8">
                {children}
              </div>
            </ScrollArea>
          </main>
        </SidebarProvider>
      </TooltipProvider>
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <OrganizationProvider>
        <AppLayoutInner>{children}</AppLayoutInner>
      </OrganizationProvider>
    </ThemeProvider>
  );
}
