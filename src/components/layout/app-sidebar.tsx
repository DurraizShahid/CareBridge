"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  RiDashboardLine,
  RiGroupLine,
  RiBuildingLine,
  RiClipboardLine,
  RiShieldCheckLine,
  RiHospitalLine,
  RiMapPinLine,
} from "@remixicon/react";
import { useEffect, useState } from "react";
import { UserButton, Show, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import type { Permission } from "@/types/permissions";
import type { UserRole } from "@/types";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermission?: Permission;
}

const mainNavItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: RiDashboardLine,
    requiredPermission: "dashboard:overview",
  },
];



const featureNavItems: NavItem[] = [
  { href: "/patients", label: "Patients", icon: RiGroupLine, requiredPermission: "patients:read" },
  { href: "/dashboard/facility-network", label: "Facility Network", icon: RiMapPinLine, requiredPermission: "placements:read" },
  { href: "/facilities", label: "Facilities", icon: RiBuildingLine, requiredPermission: "facilities:read" },
  { href: "/placements", label: "Placements", icon: RiClipboardLine, requiredPermission: "placements:read" },
];

const adminNavItems: NavItem[] = [
  { href: "/dashboard/users", label: "Users", icon: RiGroupLine, requiredPermission: "users:read-org" },
  { href: "/dashboard/hospitals", label: "Hospitals", icon: RiHospitalLine, requiredPermission: "hospitals:manage" },
  { href: "/admin/permissions", label: "Permissions", icon: RiShieldCheckLine, requiredPermission: "users:manage-roles" },
];

const allNavItems: NavItem[] = [
  ...mainNavItems,
  ...featureNavItems,
  ...adminNavItems,
];

const roleBadgeConfig: Record<UserRole, { label: string; className: string }> = {
  superadmin: {
    label: "Super Admin",
    className: "bg-destructive/8 text-destructive ring-1 ring-destructive/10",
  },
  administrator: {
    label: "Admin",
    className: "bg-warmth/10 text-warmth ring-1 ring-warmth/10",
  },
  "social-worker": {
    label: "Social Worker",
    className: "bg-health/10 text-health ring-1 ring-health/10",
  },
  "discharge-planner": {
    label: "Discharge Planner",
    className: "bg-health/10 text-health ring-1 ring-health/10",
  },
  "facility-coordinator": {
    label: "Facility Coordinator",
    className: "bg-warmth/10 text-warmth ring-1 ring-warmth/10",
  },
  customer: {
    label: "Customer",
    className: "bg-sidebar-accent text-sidebar-foreground/60 ring-1 ring-sidebar-border",
  },
};

function formatRole(role: string): { label: string; className: string } {
  const key = role as UserRole;
  return (
    roleBadgeConfig[key] ?? {
      label: role.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      className: "bg-muted text-muted-foreground",
    }
  );
}

function UserInfo({ user, effectiveRole }: { user: ReturnType<typeof useUser>["user"]; effectiveRole: string | null }) {
  return (
    <div className="min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
      <p className="truncate text-[13px] font-semibold text-sidebar-foreground leading-tight">
        {user?.firstName ?? "Signed in"}
      </p>
      <div className="mt-1 flex items-center gap-1.5">
        <p className="truncate text-[11px] text-sidebar-foreground/50 leading-tight">
          {user?.emailAddresses?.[0]?.emailAddress ?? ""}
        </p>
        {effectiveRole &&
          (() => {
            const badge = formatRole(effectiveRole);
            return (
              <span
                className={cn(
                  "inline-flex shrink-0 items-center rounded-md px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wider leading-none",
                  badge.className,
                )}
              >
                {badge.label}
              </span>
            );
          })()}
      </div>
    </div>
  );
}

function NavSection({ items, label, allItems }: { items: NavItem[]; label?: string; allItems: NavItem[] }) {
  const pathname = usePathname();
  const { can, isLoaded } = usePermissions();

  if (!isLoaded) {
    return (
      <SidebarGroup>
        {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
        <SidebarGroupContent>
          <SidebarMenu>
            {[1, 2].map((i) => (
              <SidebarMenuItem key={i}>
                <SidebarMenuButton disabled />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const visible = items.filter(
    (item) => !item.requiredPermission || can(item.requiredPermission),
  );
  const allVisible = allItems.filter(
    (item) => !item.requiredPermission || can(item.requiredPermission),
  );

  if (visible.length === 0) return null;

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {visible.map((item) => {
            const isActive =
              pathname === item.href ||
              (pathname.startsWith(item.href + "/") &&
                !allVisible.some(
                  (other) =>
                    other.href !== item.href &&
                    pathname.startsWith(other.href),
                ));
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  render={<Link href={item.href} />}
                  isActive={isActive}
                  tooltip={item.label}
                  className={cn(
                    "relative",
                    isActive && "before:absolute before:inset-y-1.5 before:-left-0 before:w-[3px] before:rounded-full before:bg-health before:sidebar-indicator-enter group-data-[collapsible=icon]:before:inset-y-2 group-data-[collapsible=icon]:before:-left-0 group-data-[collapsible=icon]:before:w-[2.5px]",
                  )}
                >
                  <item.icon className={cn("transition-colors duration-200", isActive && "text-health")} />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar({ locked }: { locked: boolean }) {
  const { user } = useUser();
  const { role: permissionsRole } = usePermissions();
  const { setOpen } = useSidebar();
  const [serverRole, setServerRole] = useState<UserRole | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data?.role) setServerRole(data.role); })
      .catch(() => {});
  }, []);

  const effectiveRole = serverRole ?? permissionsRole;

  return (
    <Sidebar
      collapsible="icon"
      className="sidebar-transparent"
      onMouseEnter={() => { if (!locked) setOpen(true); }}
      onMouseLeave={() => { if (!locked) setOpen(false); }}
    >
      <SidebarHeader>
        <Link href="/dashboard" className="group/logo flex items-center gap-3 px-3 h-14 shrink-0 transition-all duration-300 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-health/10 transition-all duration-300 group-data-[collapsible=icon]:size-6 group-data-[collapsible=icon]:rounded-md group-hover/logo:bg-health/20 group-hover/logo:shadow-[0_0_12px_rgba(0,180,180,0.15)]">
            <Image
              src="/carebridge.svg"
              alt="CareBridge"
              width={32}
              height={32}
              className="size-5 transition-transform duration-300 group-hover/logo:scale-110 group-data-[collapsible=icon]:size-3.5"
            />
          </div>
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-sidebar-foreground transition-all duration-300 group-data-[collapsible=icon]:hidden">
            CareBridge
          </span>
        </Link>
        <div className="mx-3 h-px bg-gradient-to-r from-health/20 via-sidebar-border to-transparent group-data-[collapsible=icon]:mx-2 group-data-[collapsible=icon]:h-px group-data-[collapsible=icon]:from-health/20" />
      </SidebarHeader>
      <SidebarContent>
        <NavSection items={mainNavItems} allItems={allNavItems} />
        <NavSection
          items={featureNavItems.filter(
            (item) =>
              !(item.href === "/dashboard/facility-network" && effectiveRole === "facility-coordinator"),
          )}
          label="Features"
          allItems={allNavItems}
        />
        <NavSection items={adminNavItems} label="Management" allItems={allNavItems} />
      </SidebarContent>
      <SidebarFooter>
        <Show when="signed-in">
          <div className="mx-3 mb-1 h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent group-data-[collapsible=icon]:mx-2" />
          <div className="group/user flex items-center gap-3 px-3 py-2.5 mx-1 rounded-lg transition-all duration-200 hover:bg-sidebar-accent/60 cursor-pointer group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <div className="flex items-center justify-center transition-transform duration-200 group-hover/user:scale-105">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "size-8 group-data-[collapsible=icon]:size-5 transition-all duration-200 group-hover/user:shadow-[0_0_0_2px_rgba(0,180,180,0.2)]",
                    userButtonTrigger:
                      "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring outline-none rounded-full",
                  },
                }}
              />
            </div>
            <UserInfo user={user} effectiveRole={effectiveRole} />
          </div>
        </Show>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
