"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  RiDashboardLine,
  RiMailLine,
  RiCalendarLine,
  RiTruckLine,
  RiBarChartLine,
  RiNotificationLine,
  RiSettingsLine,
  RiInformationLine,
  RiArrowRightSLine,
  RiArrowLeftSLine,
} from "@remixicon/react";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { usePermissions } from "@/hooks/use-permissions";
import type { Permission } from "@/types/permissions";
import type { UserRole } from "@/types";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
  hasDot?: boolean;
}

const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: RiDashboardLine },
  { href: "/patients", label: "Products", icon: RiMailLine },
  { href: "/facilities", label: "Calendar", icon: RiCalendarLine, hasDot: true },
  { href: "/placements", label: "Suppliers", icon: RiTruckLine },
  { href: "/dashboard/facility-network", label: "Reports", icon: RiBarChartLine },
];

const bottomNavItems: NavItem[] = [
  { href: "/notifications", label: "Notifications", icon: RiNotificationLine, hasDot: true },
  { href: "/settings", label: "Settings", icon: RiSettingsLine },
  { href: "/support", label: "Support", icon: RiInformationLine },
];

export function AppSidebar({ locked }: { locked: boolean }) {
  const pathname = usePathname();
  const { user } = useUser();
  const { setOpen, open } = useSidebar();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "border-r",
        isDark ? "bg-[#1E1E1E] border-[#2D2D2D]" : "bg-white border-gray-100"
      )}
      onMouseEnter={() => { if (!locked) setOpen(true); }}
      onMouseLeave={() => { if (!locked) setOpen(false); }}
    >
      <SidebarHeader className="pb-2 relative">
        {/* Logo and Company Name */}
        <div className="flex items-center justify-start px-4 py-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className={cn(
              "hidden group-data-[collapsible=icon]:flex size-11 shrink-0 items-center justify-center rounded-full shadow-sm",
              isDark ? "bg-[#2D2D2D]" : "bg-white"
            )}>
              <Image
                src="/Images/Careblogo.png"
                alt="CareBridge Logo"
                width={36}
                height={36}
                className="size-9 object-contain"
              />
            </div>
            <Image
              src={isDark ? "/Images/Carebridgelogo.png" : "/Images/Logo.png"}
              alt="CareBridge Logo"
              width={250}
              height={63}
              className="h-15 w-auto shrink-0 object-contain block group-data-[collapsible=icon]:hidden"
            />
          </Link>
        </div>
        {/* Collapse button - positioned on the right edge */}
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-50 flex size-8 items-center justify-center rounded-full border shadow-md transition-all hover:shadow-lg group-data-[collapsible=icon]:hidden",
            isDark 
              ? "border-[#3D3D3D] bg-[#2D2D2D] text-[#A3A7AC] hover:bg-[#3D3D3D] hover:text-white" 
              : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          )}
        >
          {open ? (
            <RiArrowLeftSLine className="size-4" />
          ) : (
            <RiArrowRightSLine className="size-4" />
          )}
        </button>
      </SidebarHeader>

      <SidebarContent className="px-3 py-2">
        {/* Main Navigation */}
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  render={<Link href={item.href} />}
                  isActive={isActive}
                  tooltip={item.label}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
                    isDark 
                      ? "text-[#A3A7AC] hover:bg-[#2D2D2D] hover:text-white" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-800",
                    isActive && (isDark 
                      ? "bg-[#2D2D2D] text-white font-medium" 
                      : "bg-[#EEF0FF] text-[#5B5FC7] font-medium"),
                    "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2.5"
                  )}
                >
                  <div className="relative">
                    <item.icon className={cn(
                      "size-5 transition-colors",
                      isActive ? (isDark ? "text-white" : "text-[#5B5FC7]") : (isDark ? "text-[#A3A7AC]" : "text-gray-500")
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
        </div>

        {/* Separator */}
        <div className={cn("my-4 h-px", isDark ? "bg-[#2D2D2D]" : "bg-gray-100")} />

        {/* Bottom Navigation */}
        <div className="space-y-1">
          {bottomNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                render={<Link href={item.href} />}
                tooltip={item.label}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2.5",
                  isDark 
                    ? "text-[#A3A7AC] hover:bg-[#2D2D2D] hover:text-white" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                )}
              >
                <div className="relative">
                  <item.icon className={cn("size-5", isDark ? "text-[#A3A7AC]" : "text-gray-500")} />
                  {item.hasDot && (
                    <span className="absolute -right-1 -top-1 size-2 rounded-full bg-orange-500" />
                  )}
                </div>
                <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </div>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
