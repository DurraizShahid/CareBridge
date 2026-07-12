"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { RiSettingsLine, RiNotificationLine, RiSunLine, RiMoonLine, RiUserLine } from "@remixicon/react";
import { useTheme } from "@/hooks/use-theme";
import { useUser, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navTabs = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/patients", label: "People" },
  { href: "/facilities", label: "Facilities" },
  { href: "/placements", label: "Placements" },
  { href: "/dashboard/facility-network", label: "Network" },
  { href: "/dashboard/users", label: "Users" },
  { href: "/dashboard/hospitals", label: "Hospitals" },
];

export function DashboardHeader() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between bg-transparent px-6">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
        <div className="flex size-8 items-center justify-center rounded-lg bg-health/10">
          <Image src="/carebridge.svg" alt="CareBridge" width={20} height={20} className="size-5" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground hidden sm:block">CareBridge</span>
      </Link>

      {/* Right cluster: Tabs + Actions */}
      <div className="flex items-center gap-1">
        <nav className="flex items-center gap-1 mr-2">
          {navTabs.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "px-4 py-1.5 text-[13px] font-medium rounded-full transition-all duration-200 whitespace-nowrap",
                  isActive
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          {theme === "dark" ? <RiSunLine className="size-4" /> : <RiMoonLine className="size-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          <RiNotificationLine className="size-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-background" />
        </Button>
        <div className="ml-0.5">
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "size-7",
                userButtonTrigger: "focus-visible:ring-2 focus-visible:ring-ring/50 rounded-full",
              },
            }}
          />
        </div>
        </div>
      </div>
    </header>
  );
}
