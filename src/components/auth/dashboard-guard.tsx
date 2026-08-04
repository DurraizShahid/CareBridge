"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/use-permissions";
import { GooeyLoader } from "@/components/ui/loader-10";
import type { Permission } from "@/types/permissions";

const DASHBOARD_PERMISSION_MAP: Record<string, Permission | Permission[]> = {
  "/dashboard": "dashboard:overview",
  "/dashboard/hospitals": "hospitals:manage",
  "/dashboard/users": ["users:manage-roles", "users:read-org"],
  "/dashboard/ai-dialing": "dialing:read",
};

const SUPERADMIN_ONLY_ROUTES = new Set(["/dashboard/marketing"]);

export function DashboardGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { can, canAny, role, isLoaded } = usePermissions();
  const required = DASHBOARD_PERMISSION_MAP[pathname];
  const hasAccess = SUPERADMIN_ONLY_ROUTES.has(pathname)
    ? role === "superadmin"
    : !required
      || (Array.isArray(required) ? canAny(required) : can(required));

  useEffect(() => {
    if (isLoaded && !hasAccess) {
      router.replace("/dashboard");
    }
  }, [hasAccess, isLoaded, router]);

  if (!isLoaded || !hasAccess) {
    return (
      <div className="flex items-center justify-center py-24">
        <GooeyLoader primaryColor="var(--health)" secondaryColor="color-mix(in oklch, var(--health), white 35%)" borderColor="color-mix(in oklch, var(--health), #202022 60%)" />
      </div>
    );
  }

  return <>{children}</>;
}
