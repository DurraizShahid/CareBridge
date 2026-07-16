"use client";

import { HospitalDock } from "./hospital-dock";
import { DashboardHeader } from "./dashboard-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeProvider } from "@/hooks/use-theme";
import { OrganizationProvider } from "@/hooks/use-organization";
import { usePathname } from "next/navigation";

const FULL_WIDTH_ROUTES = ["/dashboard/home"];

export function HospitalShell({
  children,
}: {
  children: React.ReactNode;
  sidebarLocked?: boolean;
  onToggle?: () => void;
}) {
  const pathname = usePathname();
  const isFullWidth = FULL_WIDTH_ROUTES.includes(pathname);

  return (
    <ThemeProvider>
      <OrganizationProvider>
        <div className="flex h-screen flex-col bg-background">
          <DashboardHeader
            sidebarLocked={false}
            onToggleSidebarLock={() => {}}
            hideSidebarControls
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
      </OrganizationProvider>
    </ThemeProvider>
  );
}
