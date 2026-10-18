"use client";

import Link from "next/link";
import { BrandLogo, BrandMark } from "@/components/brand-logo";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  Users,
  BuildingOffice,
  HouseSimple,
  FileText,
  ChartBar,
  ChatCircle,
  Hospital,
  ShieldCheck,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { HOSPITAL_ROLES } from "@/lib/permissions";
import type { Permission } from "@/types/permissions";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  adminOnly?: boolean;
  superadminOnly?: boolean;
  permission?: Permission;
}

const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: SquaresFour },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/facilities", label: "Facilities", icon: BuildingOffice },
  { href: "/placements", label: "Placements", icon: HouseSimple },
  { href: "/referrals", label: "Referrals", icon: FileText },
];

const managementNavItems: NavItem[] = [
  { href: "/dashboard/documents", label: "Documentation", icon: FileText },
  { href: "/users", label: "Users", icon: Users },
  { href: "/dashboard/facility-network", label: "Network", icon: ChartBar },
];

const hospitalNavItems: NavItem[] = [
  { href: "/chat", label: "Assistant", icon: ChatCircle },
  { href: "/dashboard", label: "Dashboard", icon: SquaresFour },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/placements", label: "Placements", icon: HouseSimple },
  { href: "/referrals", label: "Referrals", icon: FileText },
  { href: "/admin/permissions", label: "Management", icon: ShieldCheck, permission: "users:manage-roles" },
  { href: "/dashboard/users", label: "Users", icon: Users, permission: "users:read-org" },
  { href: "/dashboard/hospitals", label: "Hospitals", icon: Hospital, permission: "hospitals:manage" },
];

function NavButton({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenuButton
      render={<Link href={item.href} />}
      isActive={isActive}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
      onClick={() => setOpenMobile(false)}
      tooltip={item.label}
      className={cn(
        "group relative flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors duration-200",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground data-active:text-sidebar-accent-foreground shadow-none hover:bg-sidebar-accent/80 font-medium"
          : "bg-transparent text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2.5",
        "group-data-[collapsible=icon]:size-10!"
      )}
    >


      <div className="relative flex items-center justify-center">
        <item.icon
          className={cn(
            "size-5 transition-colors duration-200",
            isActive
              ? "text-sidebar-accent-foreground"
              : "text-sidebar-foreground/55 group-hover:text-sidebar-accent-foreground"
          )}
        />
      </div>

      <span
        className={cn(
          "flex-1 truncate transition-colors duration-200 group-data-[collapsible=icon]:hidden",
          isActive ? "font-medium text-sidebar-accent-foreground" : "font-normal"
        )}
      >
        {item.label}
      </span>

      {item.badge && (
        <span
          className={cn(
            "flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-colors duration-200 group-data-[collapsible=icon]:hidden",
            isActive
              ? "bg-primary/15 text-primary"
              : "bg-sidebar-accent text-sidebar-foreground/70 group-hover:bg-sidebar-border group-hover:text-sidebar-accent-foreground"
          )}
        >
          {item.badge}
        </span>
      )}
    </SidebarMenuButton>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { role, can } = usePermissions();

  const isFacilityAccount = role === "facility-coordinator";
  const isSuperadmin = role === "superadmin";
  const isHospitalAccount = !!role && HOSPITAL_ROLES.includes(role);
  const navigationItems = isHospitalAccount
    ? hospitalNavItems.filter((item) => !item.permission || can(item.permission))
    : mainNavItems;

  const filteredManagementNav = managementNavItems.filter((item) => {
    if (isHospitalAccount) return false;
    if (item.href === "/dashboard/facility-network" && !isSuperadmin) return false;
    if (item.href === "/users" && isFacilityAccount) return false;
    if (item.superadminOnly && !isSuperadmin) return false;
    if (item.adminOnly && !isSuperadmin && role !== "administrator") return false;
    return true;
  });

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="border-r border-sidebar-border"
    >
      <SidebarHeader className="px-2 pt-4 pb-2">
        <SidebarTrigger className="self-end md:hidden" aria-label="Close navigation" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/dashboard" />}
              aria-label="CareBridge home"
              onClick={() => setOpenMobile(false)}
              size="lg"
              className="p-2 hover:bg-transparent data-[state=open]:bg-transparent"
            >
              <BrandMark tone="blue" className="hidden size-10 shrink-0 group-data-[collapsible=icon]:block" />
              <BrandLogo tone="navy" className="w-[152px] group-data-[collapsible=icon]:hidden dark:hidden" />
              <BrandLogo tone="white" className="hidden w-[152px] group-data-[collapsible=icon]:hidden dark:block" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent role="navigation" aria-label="Main navigation" className="px-1 py-1">
        <SidebarGroup className="group-data-[collapsible=icon]:px-1">
          <SidebarGroupLabel className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-sidebar-foreground/45 group-data-[collapsible=icon]:hidden">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <NavButton item={item} isActive={isActive(item.href)} />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredManagementNav.length > 0 && (
          <>
            <div className="mx-3 my-2 h-px bg-sidebar-border" />
            <SidebarGroup className="group-data-[collapsible=icon]:px-1">
              <SidebarGroupLabel className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-sidebar-foreground/45 group-data-[collapsible=icon]:hidden">
                Management
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {filteredManagementNav.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <NavButton item={item} isActive={isActive(item.href)} />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
