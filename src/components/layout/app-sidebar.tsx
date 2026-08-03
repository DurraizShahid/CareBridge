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
  hasDot?: boolean;
}

const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: SquaresFour },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/facilities", label: "Facilities", icon: BuildingOffice },
  { href: "/placements", label: "Placements", icon: HouseSimple },
];

const managementNavItems: NavItem[] = [
  { href: "/dashboard/documents", label: "Documentation Vault", icon: FileText },
  { href: "/users", label: "Users", icon: Users },
  { href: "/dashboard/facility-network", label: "Facility Network", icon: ChartBar },
];

const bottomNavItems: NavItem[] = [
  { href: "/support", label: "Support", icon: Info },
];

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
      className="bg-transparent"
      style={{ "--sidebar": "transparent" } as React.CSSProperties}
      onMouseEnter={() => { if (!locked) setOpen(true); }}
      onMouseLeave={() => { if (!locked) setOpen(false); }}
    >
      <SidebarHeader className="px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/dashboard" />}
              size="lg"
              className="data-[state=open]:bg-sidebar-accent"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Image
                  src="/carebridge.svg"
                  alt="CareBridge"
                  width={32}
                  height={32}
                  className="shrink-0"
                  priority
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">CareBridge</span>
                <span className="truncate text-xs text-muted-foreground">
                  {isSuperadmin ? "Platform Admin" : "Workspace"}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="py-1">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground/70 group-data-[collapsible=icon]:hidden">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                    className={cn(
                      "relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
                      isActive(item.href)
                        ? "!bg-[#202022] dark:!bg-white/10 !text-white font-medium"
                        : "!bg-[#EAE9EF] dark:!bg-white/5 !text-[#202022] dark:!text-white/70 hover:!bg-[#EAE9EF]/80 dark:hover:!bg-white/10",
                      "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2.5",
                      "group-data-[collapsible=icon]:size-10!"
                    )}
                  >
                    <div className="relative">
                      <item.icon className={cn(
                        "size-5 transition-colors",
                        isActive(item.href) ? "text-white" : "text-foreground/60"
                      )} />
                      {item.hasDot && (
                        <span className="absolute -right-1 -top-1 size-2 rounded-full bg-orange-500" />
                      )}
                    </div>
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredManagementNav.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground/70 group-data-[collapsible=icon]:hidden">
              Management
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {filteredManagementNav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive(item.href)}
                      tooltip={item.label}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
                        isActive(item.href)
                          ? "!bg-[#202022] dark:!bg-white/10 !text-white font-medium"
                          : "!bg-[#EAE9EF] dark:!bg-white/5 !text-[#202022] dark:!text-white/70 hover:!bg-[#EAE9EF]/80 dark:hover:!bg-white/10",
                        "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2.5",
                        "group-data-[collapsible=icon]:size-10!"
                      )}
                    >
                      <div className="relative">
                        <item.icon className={cn(
                          "size-5 transition-colors",
                          isActive(item.href) ? "text-white" : "text-foreground/60"
                        )} />
                        {item.hasDot && (
                          <span className="absolute -right-1 -top-1 size-2 rounded-full bg-orange-500" />
                        )}
                      </div>
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="py-3">
        <SidebarMenu className="gap-1.5">
          {bottomNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                render={<Link href={item.href} />}
                isActive={isActive(item.href)}
                tooltip={item.label}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2.5",
                  isActive(item.href)
                    ? "!bg-[#202022] dark:!bg-white/10 !text-white font-medium"
                    : "!bg-[#EAE9EF] dark:!bg-white/5 !text-[#202022] dark:!text-white/70 hover:!bg-[#EAE9EF]/80 dark:hover:!bg-white/10",
                  "group-data-[collapsible=icon]:size-10!"
                )}
              >
                <div className="relative">
                  <item.icon className={cn(
                    "size-5 transition-colors",
                    isActive(item.href) ? "text-white" : "text-foreground/60"
                  )} />
                  {item.hasDot && (
                    <span className="absolute -right-1 -top-1 size-2 rounded-full bg-orange-500" />
                  )}
                </div>
                <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
