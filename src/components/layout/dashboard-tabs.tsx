"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePermissions } from "@/hooks/use-permissions";
import { useTheme } from "@/hooks/use-theme";
import type { Permission } from "@/types/permissions";
import {
  RiDashboardLine,
  RiGroupLine,
  RiBuildingLine,
  RiClipboardLine,
  RiShieldCheckLine,
  RiHospitalLine,
  RiMapPinLine,
  RiMegaphoneLine,
  RiPhoneLine,
  RiSunLine,
  RiMoonLine,
  RiSettingsLine,
  RiNotificationLine,
} from "@remixicon/react";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TabItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermission?: Permission;
  superadminOnly?: boolean;
}

const tabItems: TabItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: RiDashboardLine, requiredPermission: "dashboard:overview" },
  { href: "/patients", label: "Patients", icon: RiGroupLine, requiredPermission: "patients:read" },
  { href: "/dashboard/facility-network", label: "Facility Network", icon: RiMapPinLine, requiredPermission: "placements:read" },
  { href: "/facilities", label: "Facilities", icon: RiBuildingLine, requiredPermission: "facilities:read" },
  { href: "/placements", label: "Placements", icon: RiClipboardLine, requiredPermission: "placements:read" },
  { href: "/dashboard/users", label: "Users", icon: RiGroupLine, requiredPermission: "users:read-org" },
  { href: "/dashboard/hospitals", label: "Hospitals", icon: RiHospitalLine, requiredPermission: "hospitals:manage" },
  { href: "/dashboard/marketing", label: "Marketing", icon: RiMegaphoneLine, superadminOnly: true },
  { href: "/dashboard/ai-dialing", label: "AI Dialing", icon: RiPhoneLine, requiredPermission: "dialing:read" },
  { href: "/admin/permissions", label: "Permissions", icon: RiShieldCheckLine, requiredPermission: "users:manage-roles" },
];

export function DashboardTabs({ effectiveRole, scrolled }: { effectiveRole?: string | null; scrolled?: boolean }) {
  const pathname = usePathname();
  const { can, role, isLoaded } = usePermissions();
  const { theme, toggleTheme } = useTheme();

  if (!isLoaded) return null;

  const visible = tabItems.filter((item) => {
    if (item.superadminOnly) return role === "superadmin";
    if (item.href === "/dashboard/facility-network" && (effectiveRole === "facility-coordinator" || effectiveRole === "administrator")) return false;
    return !item.requiredPermission || can(item.requiredPermission);
  });

  if (visible.length === 0) return null;

  const isActive = (item: TabItem) => {
    if (pathname === item.href) return true;
    if (pathname.startsWith(item.href + "/")) {
      const exactMatch = visible.find(
        (other) => other.href !== item.href && pathname.startsWith(other.href),
      );
      return !exactMatch;
    }
    return false;
  };

  return (
    <div className={cn(
      "sticky top-0 z-10 transition-all duration-300",
      scrolled
        ? "bg-background/50 dark:bg-background/60 backdrop-blur-2xl border-b border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
        : "bg-transparent"
    )}>
      <nav className="flex items-center justify-between gap-2 px-6 min-h-20 py-3 overflow-x-auto scrollbar-none">
        {/* Logo */}
        <div className="flex items-center shrink-0 pl-[5px]">
          <img
            src={theme === "dark" ? "/logos/Dark.png" : "/logos/Light.png"}
            alt="CareBridge"
            className="h-[54px] w-auto"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
        {/* Nav tabs */}
        <div className="flex items-center gap-1 shrink-0">
          {visible.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 relative overflow-hidden",
                  active
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
                style={active ? {
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.06'/%3E%3C/svg%3E")`,
                  backgroundBlendMode: "overlay",
                } : undefined}
              >
                {active && <Icon className="size-4" />}
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60"
          >
            {theme === "dark" ? (
              <RiSunLine data-icon className="size-[18px]" />
            ) : (
              <RiMoonLine data-icon className="size-[18px]" />
            )}
          </Button>
          <Button
            variant="ghost"
            aria-label="Settings"
            className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60"
          >
            <RiSettingsLine data-icon className="size-[18px] transition-transform duration-500 hover:rotate-180" />
          </Button>
          <Button
            variant="ghost"
            aria-label="Notifications"
            className="relative rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60"
          >
            <RiNotificationLine data-icon className="size-[18px]" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
          </Button>
        </div>
        <div className="ml-1">
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "size-8",
                userButtonTrigger: "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring outline-none rounded-full",
              },
            }}
          />
        </div>
        </div>
      </nav>
    </div>
  );
}
