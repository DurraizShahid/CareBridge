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
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
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

const bottomNavItems: NavItem[] = [
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
        "group relative flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors duration-200",
        isActive
          ? "bg-[#EEF4FC] text-[#255DCE] shadow-none hover:bg-[#DCEBFF] hover:text-[#255DCE] dark:bg-[#1C3050]"
          : "bg-transparent text-sidebar-foreground/75 hover:bg-[#EEF4FC] hover:text-[#255DCE] dark:hover:bg-[#1C3050]",
        "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2.5",
        "group-data-[collapsible=icon]:size-10!"
      )}
    >


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
      className="group/sidebar border-0 bg-white dark:bg-[#151A24]"
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
              <BrandMark tone="blue" className="size-10 shrink-0" />
              <BrandLogo tone="navy" className="w-[152px] group-data-[collapsible=icon]:hidden dark:hidden" />
              <BrandLogo tone="white" className="hidden w-[152px] group-data-[collapsible=icon]:hidden dark:block" />
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

      <SidebarRail />
    </Sidebar>
  );
}
