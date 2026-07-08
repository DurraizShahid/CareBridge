"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  Building2,
  ClipboardList,
  Stethoscope,
  Warehouse,
  Shield,
  ShieldCheck,
  Hospital,
} from "lucide-react";
import { UserButton, Show, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import type { Permission } from "@/types/permissions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarSeparator,
} from "@/components/ui/sidebar";

// ── Navigation items with required permissions ──

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermission?: Permission;
}

const mainNavItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    requiredPermission: "dashboard:overview",
  },
];

const dashboardNavItems: NavItem[] = [
  {
    href: "/dashboard/staff",
    label: "Staff Dashboard",
    icon: Stethoscope,
    requiredPermission: "dashboard:staff",
  },
  {
    href: "/dashboard/facility",
    label: "Facility Dashboard",
    icon: Warehouse,
    requiredPermission: "dashboard:facility",
  },
  {
    href: "/dashboard/admin",
    label: "Admin Dashboard",
    icon: Shield,
    requiredPermission: "dashboard:admin",
  },
];

const featureNavItems: NavItem[] = [
  { href: "/patients", label: "Patients", icon: Users, requiredPermission: "patients:read" },
  { href: "/facilities", label: "Facilities", icon: Building2, requiredPermission: "facilities:read" },
  { href: "/placements", label: "Placements", icon: ClipboardList, requiredPermission: "placements:read" },
];

const adminNavItems: NavItem[] = [
  { href: "/dashboard/users", label: "Users", icon: Users, requiredPermission: "users:read-org" },
  { href: "/dashboard/hospitals", label: "Hospitals", icon: Hospital, requiredPermission: "hospitals:manage" },
  { href: "/admin/permissions", label: "Permissions", icon: ShieldCheck, requiredPermission: "users:manage-roles" },
];

// ── Role badge config ──

type UserRole =
  | "superadmin"
  | "administrator"
  | "social-worker"
  | "discharge-planner"
  | "facility-coordinator"
  | "customer";

const roleBadgeConfig: Record<UserRole, { label: string; className: string }> = {
  superadmin: {
    label: "Super Admin",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  administrator: {
    label: "Admin",
    className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  "social-worker": {
    label: "Social Worker",
    className: "bg-health/10 text-health dark:bg-health/20 dark:text-health",
  },
  "discharge-planner": {
    label: "Discharge Planner",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  "facility-coordinator": {
    label: "Facility Coordinator",
    className: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  },
  customer: {
    label: "Customer",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
};

function formatRole(role: string): { label: string; className: string } {
  const key = role as UserRole;
  return (
    roleBadgeConfig[key] ?? {
      label: role.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    }
  );
}

// ── Nav section sub-component ──

function NavSection({ items, label }: { items: NavItem[]; label?: string }) {
  const pathname = usePathname();
  const { can, isLoaded } = usePermissions();

  if (!isLoaded) {
    return (
      <SidebarGroup>
        {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuSkeleton showIcon />
            <SidebarMenuSkeleton showIcon />
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
                  isActive={isActive}
                  tooltip={item.label}
                  render={<Link href={item.href} />}
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

// ── AppSidebar ──

export function AppSidebar() {
  const { user } = useUser();
  const { role: permissionsRole } = usePermissions();
  const effectiveRole = permissionsRole;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center">
            <Image
              src="/carebridge.svg"
              alt="CareBridge"
              width={32}
              height={32}
              className="h-8 w-8"
            />
          </div>

        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <NavSection items={mainNavItems} />
        <NavSection items={dashboardNavItems} label="Dashboards" />
        <NavSection items={featureNavItems} label="Features" />
        <NavSection items={adminNavItems} label="Administration" />
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <Show when="signed-in">
          <div className="flex items-center gap-3 px-1">
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-8 w-8",
                  userButtonTrigger:
                    "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring outline-none rounded-full",
                },
              }}
            />
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user?.firstName ?? "Signed in"}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <p className="truncate text-xs text-muted-foreground">
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
          </div>
        </Show>
      </SidebarFooter>
    </Sidebar>
  );
}
