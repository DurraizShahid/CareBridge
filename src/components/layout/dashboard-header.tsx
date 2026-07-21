"use client";

import { RiNotificationLine, RiSearchLine, RiSunLine, RiMoonLine, RiSidebarFoldLine, RiSidebarUnfoldLine } from "@remixicon/react";
import { useTheme } from "@/hooks/use-theme";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";

export function DashboardHeader({ sidebarLocked, onToggleSidebarLock, hideSidebarControls }: { sidebarLocked: boolean; onToggleSidebarLock: () => void; hideSidebarControls?: boolean }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm transition-colors md:px-6">
      <div className="flex items-center gap-3">
        {!hideSidebarControls && (
          <SidebarTrigger className="md:hidden min-h-11 min-w-11" />
        )}
        {!hideSidebarControls && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebarLock}
            aria-label={sidebarLocked ? "Auto-collapse sidebar" : "Keep sidebar expanded"}
            className="hidden md:inline-flex text-muted-foreground hover:text-foreground"
          >
            {sidebarLocked ? <RiSidebarFoldLine className="size-5" /> : <RiSidebarUnfoldLine className="size-5" />}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="min-h-11 min-w-11"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <RiSunLine className="size-5" /> : <RiMoonLine className="size-5" />}
        </Button>
        <Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="Search">
          <RiSearchLine className="size-5" />
        </Button>
        <Button variant="ghost" size="icon" className="relative min-h-11 min-w-11" aria-label="Notifications">
          <RiNotificationLine className="size-5" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
        </Button>
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: "size-8",
              userButtonTrigger: "outline-none rounded-full shadow-none",
            },
          }}
        />
      </div>
    </header>
  );
}
