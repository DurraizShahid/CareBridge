"use client";

import { HospitalDock } from "./hospital-dock";
import { DashboardHeader } from "./dashboard-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeProvider } from "@/hooks/use-theme";
import { OrganizationProvider } from "@/hooks/use-organization";

export function HospitalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <OrganizationProvider>
        <div className="flex h-screen flex-col bg-surface dark:bg-background">
          <DashboardHeader />
          <ScrollArea className="flex-1 min-h-0">
            <div className="mx-auto w-full max-w-7xl px-6 py-8 pb-24">
              {children}
            </div>
          </ScrollArea>
          <HospitalDock />
        </div>
      </OrganizationProvider>
    </ThemeProvider>
  );
}
