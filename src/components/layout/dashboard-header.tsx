"use client";

import { RiNotificationLine, RiSearchLine, RiSunLine, RiMoonLine, RiSidebarFoldLine, RiSidebarUnfoldLine } from "@remixicon/react";
import { useTheme } from "@/hooks/use-theme";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";

export function DashboardHeader({ sidebarLocked, onToggleSidebarLock, hideSidebarControls }: { sidebarLocked: boolean; onToggleSidebarLock: () => void; hideSidebarControls?: boolean }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between bg-transparent px-6 shadow-none">
      <div className="flex items-center gap-2">
        {!hideSidebarControls && <SidebarTrigger className="-ml-2 md:hidden" />}
        {!hideSidebarControls && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebarLock}
            aria-label={sidebarLocked ? "Auto-collapse sidebar" : "Keep sidebar expanded"}
            className="hidden md:inline-flex text-muted-foreground hover:text-foreground"
          >
            {sidebarLocked ? <RiSidebarFoldLine data-icon className="size-4" /> : <RiSidebarUnfoldLine data-icon className="size-4" />}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <RiSunLine data-icon /> : <RiMoonLine data-icon />}
        </Button>
        <Button variant="ghost" size="icon-lg" aria-label="Search">
          <RiSearchLine data-icon />
        </Button>
        <Button variant="ghost" size="icon-lg" aria-label="Notifications" className="relative">
          <RiNotificationLine data-icon />
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-background" />
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
