"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/use-permissions";
import type { Permission } from "@/types/permissions";

const DASHBOARD_PERMISSION_MAP: Record<string, Permission | Permission[]> = {
  "/dashboard": "dashboard:overview",
  "/dashboard/staff": "dashboard:staff",
  "/dashboard/facility": "dashboard:facility",
  "/dashboard/admin": "dashboard:admin",
  "/dashboard/hospitals": "hospitals:manage",
  "/dashboard/users": ["users:manage-roles", "users:read-org"],
};

export function DashboardGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { can, canAny, isLoaded } = usePermissions();
  const required = DASHBOARD_PERMISSION_MAP[pathname];
  const hasAccess = !required
    || (Array.isArray(required) ? canAny(required) : can(required));

  useEffect(() => {
    if (isLoaded && !hasAccess) {
      router.replace("/dashboard");
    }
  }, [hasAccess, isLoaded, router]);

  if (!isLoaded || !hasAccess) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-health" />
      </div>
    );
  }

  return <>{children}</>;
}
