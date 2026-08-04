"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiHomeLine,
  RiGroupLine,
  RiClipboardLine,
  RiShieldCheckLine,
  RiHospitalLine,
  RiUserLine,
  RiMegaphoneLine,
  RiPhoneLine,
} from "@remixicon/react";
import { usePermissions } from "@/hooks/use-permissions";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface DockItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  superadminOnly?: boolean;
}

const dockItems: DockItem[] = [
  { href: "/dashboard/home", label: "Home", icon: RiHomeLine },
  { href: "/patients", label: "Patients", icon: RiGroupLine },
  { href: "/placements", label: "Placements", icon: RiClipboardLine },
  { href: "/admin/permissions", label: "Management", icon: RiShieldCheckLine, permission: "users:manage-roles" },
  { href: "/dashboard/users", label: "Users", icon: RiUserLine, permission: "users:read-org" },
  { href: "/dashboard/hospitals", label: "Hospitals", icon: RiHospitalLine, permission: "hospitals:manage" },
  { href: "/dashboard/marketing", label: "Marketing", icon: RiMegaphoneLine, superadminOnly: true },
  { href: "/dashboard/ai-dialing", label: "AI Dialing", icon: RiPhoneLine, permission: "dialing:read" },
];

export function HospitalDock() {
  const pathname = usePathname();
  const { can, role } = usePermissions();

  const visibleItems = dockItems.filter((item) => {
    if (item.superadminOnly) return role === "superadmin";
    return !item.permission || can(item.permission as any);
  });

  return (
    <nav
      className="fixed right-4 top-1/2 z-50 -translate-y-1/2"
      aria-label="Main navigation"
    >
      <div
        className="flex flex-col items-center gap-2 p-2 bg-white dark:bg-[#2a201b]"
        style={{
          borderRadius: "20px",
          border: "1.5px solid var(--border, #e4e4e6)",
          boxShadow:
            "0 14px 30px rgba(0,0,0,0.06), 0 4px 10px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
      >
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (pathname.startsWith(item.href + "/") && pathname !== "/dashboard") ||
            (item.href === "/dashboard" && pathname === "/dashboard");

          return (
            <Tooltip key={item.href}>
              <TooltipTrigger
                render={
                  <Link
                    href={item.href}
                    className="relative flex items-center justify-center transition-all duration-200 hover:-translate-x-px"
                    aria-label={item.label}
                  >
                    {isActive ? (
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "14px",
                          background: "var(--health, #3a8bbf)",
                          border: "2px solid rgba(255,255,255,0.15)",
                          boxShadow:
                            "0 8px 18px rgba(58,139,191,0.3), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -2px 4px rgba(20,60,100,0.2)",
                        }}
                      >
                        <item.icon className="size-[20px] text-white" />
                      </div>
                    ) : (
                      <div
                        className="flex items-center justify-center rounded-xl transition-colors duration-200 hover:bg-black/5 dark:hover:bg-white/5"
                        style={{
                          width: "40px",
                          height: "40px",
                          color: "var(--muted-foreground, #6b7280)",
                        }}
                      >
                        <item.icon className="size-[20px] transition-colors duration-200" />
                      </div>
                    )}
                  </Link>
                }
              />
              <TooltipContent side="left" sideOffset={10}>
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </nav>
  );
}
