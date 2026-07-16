"use client";

import { useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import type { Permission } from "@/types/permissions";
import {
  canRoleAccessRoute,
  normalizeRole,
  resolveRole,
  roleHasAllPermissions,
  roleHasAnyPermission,
  roleHasPermission,
} from "@/lib/permissions";
import { currentUser as mockUser } from "@/lib/data";
import type { UserRole } from "@/types";

// ── Resolve the effective role ──

/**
 * Hook that provides permission-checking utilities for the current user.
 *
 * Uses Clerk's authenticated user in production, and falls back to the
 * mock `currentUser` from `@/lib/data` during development.
 */
export function usePermissions() {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();

  return useMemo(() => {
    const role: UserRole | null = !isLoaded
      ? null
      : isSignedIn
        ? resolveRole(clerkUser?.publicMetadata.role)
        : process.env.NODE_ENV === "development"
          ? normalizeRole(mockUser.role)
          : null;

    // Build the permission helpers
    const can = (permission: Permission): boolean => !!role && roleHasPermission(role, permission);
    const canAll = (permissions: Permission[]): boolean => !!role && roleHasAllPermissions(role, permissions);
    const canAny = (permissions: Permission[]): boolean => !!role && roleHasAnyPermission(role, permissions);

    const canAccessRoute = (pathname: string): boolean => {
      if (!role) return false;
      const { allowed } = canRoleAccessRoute(role, pathname);
      return allowed;
    };

    return {
      /** The resolved user role string. */
      role,
      /** Whether Clerk auth has finished loading. */
      isLoaded,
      /** Whether the user is signed in (Clerk). */
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
  }, [clerkUser, isLoaded, isSignedIn]);
}
