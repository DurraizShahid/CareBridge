"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiHomeLine,
  RiMapPinLine,
  RiDashboardLine,
  RiGroupLine,
  RiMoreLine,
  RiBuildingLine,
  RiClipboardLine,
  RiShieldCheckLine,
  RiHospitalLine,
} from "@remixicon/react";
import { useState } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface DockItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const primaryItems: DockItem[] = [
  { href: "/dashboard/home", label: "Home", icon: RiHomeLine },
  { href: "/dashboard/facility-network", label: "Explore", icon: RiMapPinLine },
  { href: "/patients", label: "Patients", icon: RiGroupLine },
];

interface OverflowItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
}

const overflowItems: OverflowItem[] = [
  { href: "/dashboard/facility-network", label: "Facility Network", icon: RiMapPinLine },
  { href: "/placements", label: "Placements", icon: RiClipboardLine },
  { href: "/admin/permissions", label: "Management", icon: RiShieldCheckLine, permission: "users:manage-roles" },
  { href: "/dashboard/users", label: "Users", icon: RiGroupLine, permission: "users:read-org" },
  { href: "/dashboard/hospitals", label: "Hospitals", icon: RiHospitalLine, permission: "hospitals:manage" },
];

function DockButton({
  item,
  isActive,
}: {
  item: DockItem;
  isActive: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 transition-colors duration-150",
        isActive
          ? "text-health"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <item.icon className={cn("size-5", isActive && "text-health")} />
      <span className="text-[10px] font-medium leading-tight">{item.label}</span>
    </Link>
  );
}

export function HospitalDock() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { can, role } = usePermissions();

  const isAdmin = role === "administrator";

  const visiblePrimary = primaryItems.filter(
    (item) => !(isAdmin && item.href === "/dashboard/facility-network"),
  );

  const visibleOverflow = overflowItems.filter(
    (item) => {
      if (isAdmin && item.href === "/dashboard/facility-network") return false;
      return !item.permission || can(item.permission as any);
    },
  );

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center border-t border-border bg-background/95 px-2 backdrop-blur-md safe-area-bottom">
        <div className="flex w-full items-center max-w-lg mx-auto">
          {visiblePrimary.map((item) => {
            const isActive =
              pathname === item.href ||
              (pathname.startsWith(item.href + "/") && pathname !== "/dashboard") ||
              (item.href === "/dashboard" && pathname === "/dashboard");
            return (
              <DockButton key={item.href} item={item} isActive={isActive} />
            );
          })}

          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 transition-colors duration-150",
              moreOpen
                ? "text-health"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <RiMoreLine className="size-5" />
            <span className="text-[10px] font-medium leading-tight">More</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-safe-bottom">
          <SheetHeader className="mb-2">
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-3 pb-4">
            {visibleOverflow.map((item) => {
              const isActive =
                pathname === item.href ||
                (pathname.startsWith(item.href + "/") &&
                  !pathname.startsWith("/dashboard/home"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors duration-150",
                    isActive
                      ? "bg-health/10 text-health"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="size-5" />
                  <span className="text-[11px] font-medium text-center leading-tight">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
