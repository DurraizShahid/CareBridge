"use client";

import { useEffect, useMemo, useState } from "react";
import type { Permission } from "@/types/permissions";
import {
  canRoleAccessRoute,
  normalizeRole,
  roleHasAllPermissions,
  roleHasAnyPermission,
  roleHasPermission,
} from "@/lib/permissions";
import type { UserRole } from "@/types";

export function usePermissions() {
  const [state, setState] = useState<{
    role: UserRole | null;
    isLoaded: boolean;
    isSignedIn: boolean;
  }>({ role: null, isLoaded: false, isSignedIn: false });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) {
          if (!cancelled) setState({ role: null, isLoaded: true, isSignedIn: false });
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          const role = normalizeRole(data?.role);
          setState({ role, isLoaded: true, isSignedIn: true });
        }
      } catch {
        if (!cancelled) setState({ role: null, isLoaded: true, isSignedIn: false });
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  return useMemo(() => {
    const { role, isLoaded, isSignedIn } = state;

    const can = (permission: Permission): boolean => !!role && roleHasPermission(role, permission);
    const canAll = (permissions: Permission[]): boolean => !!role && roleHasAllPermissions(role, permissions);
    const canAny = (permissions: Permission[]): boolean => !!role && roleHasAnyPermission(role, permissions);

    const canAccessRoute = (pathname: string): boolean => {
      if (!role) return false;
      const { allowed } = canRoleAccessRoute(role, pathname);
      return allowed;
    };

    return {
      role,
      isLoaded,
      isSignedIn,
      /** Check a single permission. */
      can,
      /** Check all required permissions. */
      canAll,
      /** Check any of the given permissions. */
      canAny,
      /** Check whether the role can access a route. */
      canAccessRoute,
    } as const;
  }, [state]);
}
