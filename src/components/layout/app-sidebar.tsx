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
import { UserButton, Show, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
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

  return (
    <Sidebar
      collapsible="icon"
      className="bg-white border-r border-gray-100"
      onMouseEnter={() => { if (!locked) setOpen(true); }}
      onMouseLeave={() => { if (!locked) setOpen(false); }}
    >
      <SidebarHeader className="pb-2">
        {/* Logo and Company Name */}
        <div className="flex items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image
              src="/Images/Careblogo.png"
              alt="CareBridge Logo"
              width={40}
              height={40}
              className="size-10 shrink-0 rounded-xl object-contain hidden group-data-[collapsible=icon]:block"
            />
            <Image
              src="/Images/Carebridgelogo.png"
              alt="CareBridge Logo"
              width={40}
              height={40}
              className="size-10 shrink-0 rounded-xl object-contain block group-data-[collapsible=icon]:hidden"
            />
            <span className="text-lg font-bold text-gray-800 group-data-[collapsible=icon]:hidden">
              ABC Solutions
            </span>
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="flex size-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-700 group-data-[collapsible=icon]:hidden"
          >
            {open ? (
              <RiArrowLeftSLine className="size-4" />
            ) : (
              <RiArrowRightSLine className="size-4" />
            )}
          </button>
        </div>
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
                    "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-800",
                    isActive && "bg-[#EEF0FF] text-[#5B5FC7] font-medium",
                    "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2.5"
                  )}
                >
                  <div className="relative">
                    <item.icon className={cn(
                      "size-5 transition-colors",
                      isActive ? "text-[#5B5FC7]" : "text-gray-500"
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
        <div className="my-4 h-px bg-gray-100" />

        {/* Bottom Navigation */}
        <div className="space-y-1">
          {bottomNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                render={<Link href={item.href} />}
                tooltip={item.label}
                className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-800 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2.5"
              >
                <div className="relative">
                  <item.icon className="size-5 text-gray-500" />
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

      <SidebarFooter className="border-t border-gray-100 p-3">
        <Show when="signed-in">
          <div className="flex items-center justify-center rounded-xl px-3 py-2.5 transition-all hover:bg-gray-50 cursor-pointer">
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: "size-10 ring-2 ring-orange-200",
                  userButtonTrigger: "focus-visible:ring-2 focus-visible:ring-[#5B5FC7] outline-none rounded-full",
                },
              }}
            />
          </div>
        </Show>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
