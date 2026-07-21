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
import { useTheme } from "@/hooks/use-theme";
import {
  Sidebar,
  SidebarContent,
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
  hasDot?: boolean;
}

const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: SquaresFour },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/facilities", label: "Facilities", icon: BuildingOffice },
  { href: "/placements", label: "Placements", icon: HouseSimple },
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
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Sidebar
      collapsible="icon"
      className="bg-transparent"
      style={{ "--sidebar": "transparent" } as React.CSSProperties}
      onMouseEnter={() => { if (!locked) setOpen(true); }}
      onMouseLeave={() => { if (!locked) setOpen(false); }}
    >
      <SidebarContent className="flex flex-col px-2 py-3">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2 mb-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Image
            src="/carebridge.svg"
            alt="CareBridge"
            width={32}
            height={32}
            className="shrink-0"
            priority
          />
          <span className="text-base font-semibold tracking-tight text-foreground group-data-[collapsible=icon]:hidden">
            CareBridge
          </span>
        </Link>

        {/* Centered main nav zone */}
        <div className="flex flex-1 flex-col justify-center">
          <SidebarMenu className="gap-3">
            {mainNavItems.map((item) => {
              const isActive = item.href === "/dashboard"
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={isActive}
                    tooltip={item.label}
                    className={cn(
                      "relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
                      isActive
                        ? "!bg-[#202022] dark:!bg-white/10 !text-white font-medium"
                        : "!bg-[#EAE9EF] dark:!bg-white/5 !text-[#202022] dark:!text-white/70 hover:!bg-[#EAE9EF]/80 dark:hover:!bg-white/10",
                      "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2.5",
                      "group-data-[collapsible=icon]:size-10!"
                    )}
                  >
                    <div className="relative">
                      <item.icon className={cn(
                        "size-5 transition-colors",
                        isActive ? "text-white" : "text-foreground/60"
                      )} />
                      {item.hasDot && (
                        <span className="absolute -right-1 -top-1 size-2 rounded-full bg-orange-500" />
                      )}
                    </div>
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>

          {/* Separator */}
          <div className={cn("my-3 h-px", isDark ? "bg-[#1E293B]" : "bg-gray-200/50")} />
        </div>

        {/* Bottom-pinned nav zone */}
        <SidebarMenu className="mt-auto gap-3">
          {bottomNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                render={<Link href={item.href} />}
                tooltip={item.label}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2.5",
                  "!bg-[#EAE9EF] dark:!bg-white/5 !text-[#202022] dark:!text-white/70 hover:!bg-[#EAE9EF]/80 dark:hover:!bg-white/10",
                  "group-data-[collapsible=icon]:size-10!"
                )}
              >
                <div className="relative">
                  <item.icon className="size-5 text-foreground/60" />
                  {item.hasDot && (
                    <span className="absolute -right-1 -top-1 size-2 rounded-full bg-orange-500" />
                  )}
                </div>
                <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
