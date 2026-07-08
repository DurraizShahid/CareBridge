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
  { href: "/facilities", label: "Facilities", icon: RiBuildingLine, requiredPermission: "facilities:read" },
  { href: "/placements", label: "Placements", icon: RiClipboardLine, requiredPermission: "placements:read" },
];

const adminNavItems: NavItem[] = [
  { href: "/dashboard/users", label: "Users", icon: RiGroupLine, requiredPermission: "users:read-org" },
  { href: "/dashboard/hospitals", label: "Hospitals", icon: RiHospitalLine, requiredPermission: "hospitals:manage" },
  { href: "/admin/permissions", label: "Permissions", icon: RiShieldCheckLine, requiredPermission: "users:manage-roles" },
];

const roleBadgeConfig: Record<UserRole, { label: string; className: string }> = {
  superadmin: {
    label: "Super Admin",
    className: "bg-destructive/10 text-destructive",
  },
  administrator: {
    label: "Admin",
    className: "bg-warmth/10 text-warmth",
  },
  "social-worker": {
    label: "Social Worker",
    className: "bg-health/10 text-health",
  },
  "discharge-planner": {
    label: "Discharge Planner",
    className: "bg-health/10 text-health",
  },
  "facility-coordinator": {
    label: "Facility Coordinator",
    className: "bg-warmth/10 text-warmth",
  },
  customer: {
    label: "Customer",
    className: "bg-muted text-muted-foreground",
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
      <p className="truncate text-sm font-medium text-sidebar-foreground">
        {user?.firstName ?? "Signed in"}
      </p>
      <div className="mt-0.5 flex items-center gap-1.5">
        <p className="truncate text-xs text-sidebar-foreground/70">
          {user?.emailAddresses?.[0]?.emailAddress ?? ""}
        </p>
        {effectiveRole &&
          (() => {
            const badge = formatRole(effectiveRole);
            return (
              <span
                className={cn(
                  "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none",
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

function NavSection({ items, label }: { items: NavItem[]; label?: string }) {
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

  if (visible.length === 0) return null;

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {visible.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  render={<Link href={item.href} />}
                  isActive={isActive}
                  tooltip={item.label}
                >
                  <item.icon />
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

export function AppSidebar() {
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
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <SidebarHeader>
        <Link href="/dashboard" className="group/logo flex items-center gap-3 px-1 h-14 shrink-0 transition-all duration-200 hover:opacity-80 group-data-[collapsible=icon]:justify-center">
          <div className="flex size-8 shrink-0 items-center justify-center group-data-[collapsible=icon]:p-2 transition-transform duration-200 group-hover/logo:scale-110 group-hover/logo:drop-shadow-[0_0_8px_rgba(0,200,200,0.3)]">
            <Image
              src="/carebridge.svg"
              alt="CareBridge"
              width={32}
              height={32}
              className="size-8 group-data-[collapsible=icon]:size-4"
            />
          </div>
          <span className="text-sm font-semibold text-sidebar-foreground transition-all duration-200 group-data-[collapsible=icon]:hidden group-hover/logo:tracking-wide">
            CareBridge
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavSection items={mainNavItems} />
        <NavSection items={featureNavItems} label="Features" />
        <NavSection items={adminNavItems} label="Management" />
      </SidebarContent>
      <SidebarFooter>
        <Show when="signed-in">
          <div className="group/user flex items-center gap-3 px-1 py-2 border-t border-sidebar-border pt-4 transition-colors duration-200 hover:bg-sidebar-accent/50 rounded-xl cursor-pointer group-data-[collapsible=icon]:justify-center">
            <div className="flex items-center justify-center group-data-[collapsible=icon]:p-2 transition-transform duration-200 group-hover/user:scale-110">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "size-8 group-data-[collapsible=icon]:size-4 transition-shadow duration-200 group-hover/user:shadow-[0_0_0_2px_rgba(0,200,200,0.3)]",
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
