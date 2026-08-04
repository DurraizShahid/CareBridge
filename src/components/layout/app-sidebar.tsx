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
  Megaphone,
  PhoneCall,
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
  adminOnly?: boolean;
  superadminOnly?: boolean;
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
  { href: "/dashboard/marketing", label: "Marketing", icon: Megaphone, superadminOnly: true },
  { href: "/dashboard/ai-dialing", label: "AI Dialing", icon: PhoneCall, superadminOnly: true },
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
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200",
        isActive
          ? "bg-primary/10 text-primary shadow-none hover:bg-primary/15 hover:text-primary"
          : "bg-transparent text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2.5",
        "group-data-[collapsible=icon]:size-10!"
      )}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
      )}

      <div className="relative flex items-center justify-center">
        <item.icon
          className={cn(
            "size-5 transition-colors duration-200",
            isActive
              ? "text-primary"
              : "text-sidebar-foreground/55 group-hover:text-sidebar-accent-foreground"
          )}
        />
      </div>

      <span
        className={cn(
          "flex-1 truncate transition-colors duration-200 group-data-[collapsible=icon]:hidden",
          isActive ? "font-medium text-primary" : "font-normal"
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

export function AppSidebar({ locked }: { locked: boolean }) {
  const pathname = usePathname();
  const { setOpen } = useSidebar();
  const { role } = usePermissions();

  const isFacilityAccount = role === "facility-coordinator";
  const isSuperadmin = role === "superadmin";

  const filteredManagementNav = managementNavItems.filter((item) => {
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
      variant="floating"
      collapsible="icon"
      className="group/sidebar"
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
              className="p-2 hover:bg-transparent data-[state=open]:bg-transparent"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm">
                <Image
                  src="/carebridge.svg"
                  alt="CareBridge"
                  width={20}
                  height={20}
                  className="shrink-0 brightness-0 invert"
                  priority
                />
              </div>
              <span className="flex-1 truncate text-left text-sm font-semibold tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                CareBridge
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-1 py-1">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-sidebar-foreground/45 group-data-[collapsible=icon]:hidden">
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
            <div className="mx-3 my-2 h-px bg-sidebar-border" />
            <SidebarGroup>
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

      <SidebarFooter className="px-1 pb-3">
        <div className="mx-3 mb-2 h-px bg-sidebar-border" />
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
