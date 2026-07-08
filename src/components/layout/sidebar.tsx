"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  ClipboardList,
  Heart,
  ChevronLeft,
  Stethoscope,
  Warehouse,
  Shield,
} from "lucide-react";
import { UserButton, Show } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
] as const;

const dashboardNavItems = [
  { href: "/dashboard/staff", label: "Staff Dashboard", icon: Stethoscope },
  { href: "/dashboard/facility", label: "Facility Dashboard", icon: Warehouse },
  { href: "/dashboard/admin", label: "Admin Dashboard", icon: Shield },
] as const;

const featureNavItems = [
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/facilities", label: "Facilities", icon: Building2 },
  { href: "/placements", label: "Placements", icon: ClipboardList },
] as const;

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-sidebar transition-all duration-200",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Heart className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-heading text-lg font-bold text-primary">
            CareBridge
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {/* Main */}
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-health/10 text-health"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* Dashboards Section */}
        {!collapsed && (
          <div className="pt-3 pb-1">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Dashboards
            </p>
          </div>
        )}
        {dashboardNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-health/10 text-health"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* Features Section */}
        {!collapsed && (
          <div className="pt-3 pb-1">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Features
            </p>
          </div>
        )}
        {featureNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-health/10 text-health"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* Toggle */}
        <div className="pt-4">
          <button
            type="button"
            onClick={onToggle}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/50"
          >
            <ChevronLeft
              className={cn(
                "h-5 w-5 shrink-0 transition-transform",
                collapsed && "rotate-180",
              )}
            />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </nav>

      {/* User info */}
      <Show when="signed-in">
        <div className="border-t border-border px-4 py-4">
          <div className="flex items-center gap-3">
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-8 w-8",
                  userButtonTrigger:
                    "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring outline-none rounded-full",
                },
              }}
            />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  Signed in
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  CareBridge Health
                </p>
              </div>
            )}
          </div>
        </div>
      </Show>
    </aside>
  );
}
