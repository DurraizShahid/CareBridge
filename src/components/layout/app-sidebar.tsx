"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  Users,
  BuildingOffice,
  HouseSimple,
  FileText,
  ChartBar,
  Info,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
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
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: SquaresFour },
  { href: "/patients", label: "Patients", icon: Users, badge: "12" },
  { href: "/facilities", label: "Facilities", icon: BuildingOffice },
  { href: "/placements", label: "Placements", icon: HouseSimple, badge: "3" },
];

const managementNavItems: NavItem[] = [
  { href: "/dashboard/documents", label: "Documentation", icon: FileText },
  { href: "/users", label: "Users", icon: Users },
  { href: "/dashboard/facility-network", label: "Network", icon: ChartBar },
];

const bottomNavItems: NavItem[] = [
  { href: "/support", label: "Help & Support", icon: Info },
];

function NavButton({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  return (
    <SidebarMenuButton
      render={<Link href={item.href} />}
      isActive={isActive}
      tooltip={item.label}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
        isActive
          ? "bg-[#1a1a2e] text-white shadow-[0_2px_8px_rgba(26,26,46,0.3)] dark:bg-white/10 dark:shadow-[0_2px_8px_rgba(255,255,255,0.1)]"
          : "bg-transparent text-[#4a4a5a] hover:bg-[#eae8f0] hover:text-[#1a1a2e] dark:text-white/60 dark:hover:bg-white/[0.08] dark:hover:text-white",
        "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2.5",
        "group-data-[collapsible=icon]:size-10!"
      )}
    >
      {/* Active indicator bar */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-white dark:bg-white/80" />
      )}

      <div className="relative flex items-center justify-center">
        <item.icon
          className={cn(
            "size-5 transition-all duration-200",
            isActive
              ? "text-white scale-110"
              : "text-[#8a8a9a] group-hover:text-[#1a1a2e] dark:text-white/50 dark:group-hover:text-white"
          )}
        />
      </div>

      <span
        className={cn(
          "flex-1 truncate transition-all duration-200 group-data-[collapsible=icon]:hidden",
          isActive ? "font-medium" : "font-normal"
        )}
      >
        {item.label}
      </span>

      {/* Badge */}
      {item.badge && (
        <span
          className={cn(
            "flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-all duration-200 group-data-[collapsible=icon]:hidden",
            isActive
              ? "bg-white/20 text-white"
              : "bg-[#ddd9ea] text-[#5a586a] group-hover:bg-[#d5d1e3] group-hover:text-[#3a3848] dark:bg-white/10 dark:text-white/50 dark:group-hover:bg-white/15 dark:group-hover:text-white/80"
          )}
        >
          {item.badge}
        </span>
      )}
    </SidebarMenuButton>
  );
}

export function AppSidebar({ locked }: { locked: boolean }) {
  const pathname = usePathname();
  const { setOpen } = useSidebar();
  const { role } = usePermissions();

  const isFacilityAccount = role === "facility-coordinator";
  const isSuperadmin = role === "superadmin";

  const filteredManagementNav = managementNavItems.filter((item) => {
    if (item.href === "/dashboard/facility-network" && !isSuperadmin) return false;
    if (item.href === "/users" && isFacilityAccount) return false;
    return true;
  });

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <Sidebar
      variant="floating"
      collapsible="icon"
      className="bg-transparent group/sidebar"
      style={{ "--sidebar": "transparent" } as React.CSSProperties}
      onMouseEnter={() => {
        if (!locked) setOpen(true);
      }}
      onMouseLeave={() => {
        if (!locked) setOpen(false);
      }}
    >
      <SidebarHeader className="px-2 pt-4 pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/dashboard" />}
              size="lg"
              className="data-[state=open]:bg-transparent hover:bg-transparent p-2"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#2d2d44] shadow-[0_2px_8px_rgba(26,26,46,0.25)]">
                <Image
                  src="/carebridge.svg"
                  alt="CareBridge"
                  width={20}
                  height={20}
                  className="shrink-0"
                  priority
                />
              </div>
              <span className="flex-1 truncate text-left text-sm font-semibold tracking-tight text-[#1a1a2e] dark:text-white group-data-[collapsible=icon]:hidden">
                CareBridge
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="py-1 px-1">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#b0aec0] dark:text-white/30 group-data-[collapsible=icon]:hidden px-2 mb-1">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <NavButton item={item} isActive={isActive(item.href)} />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredManagementNav.length > 0 && (
          <>
            <div className="mx-3 my-2 h-px bg-gradient-to-r from-transparent via-[#e0dde8] to-transparent dark:via-white/10" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#b0aec0] dark:text-white/30 group-data-[collapsible=icon]:hidden px-2 mb-1">
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

      <SidebarFooter className="px-1 pb-3">
        <div className="mx-3 mb-2 h-px bg-gradient-to-r from-transparent via-[#e0dde8] to-transparent dark:via-white/10" />
        <SidebarMenu className="gap-0.5">
          {bottomNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <NavButton item={item} isActive={isActive(item.href)} />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
