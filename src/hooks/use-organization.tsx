"use client";

import { createContext, useContext, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { usePermissions } from "@/hooks/use-permissions";
import { currentUser as mockUser, organizations } from "@/lib/data";
import type { Organization } from "@/types";

// ── Context type ──

interface OrganizationContextValue {
  /** The current user's organization ID. */
  organizationId: string;
  /** The organization object for the current user. */
  organization: Organization | null;
  /** All known organizations (for superadmin cross-org views). */
  allOrganizations: Organization[];
  /** True if the user is a superadmin (bypasses org scoping). */
  isSuperadmin: boolean;
  /** True if the context has fully resolved. */
  isLoaded: boolean;
}

// ── Context ──

const OrganizationContext = createContext<OrganizationContextValue>({
  organizationId: "",
  organization: null,
  allOrganizations: [],
  isSuperadmin: false,
  isLoaded: false,
});

// ── Provider ──

export function OrganizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();
  const { role, isLoaded: permLoaded } = usePermissions();

  const value = useMemo<OrganizationContextValue>(() => {
    const loaded = clerkLoaded && permLoaded;

    if (!loaded) {
      return {
        organizationId: "",
        organization: null,
        allOrganizations: organizations,
        isSuperadmin: false,
        isLoaded: false,
      };
    }

    // Resolve the organization ID from Clerk metadata
    const organizationId: string = (() => {
      if (isSignedIn && clerkUser?.publicMetadata?.organizationId) {
        return clerkUser.publicMetadata.organizationId as string;
      }
      if (isSignedIn) return "";
      // Fallback to mock data only in development
      if (process.env.NODE_ENV === "development") {
        return mockUser.organizationId ?? "";
      }
      return "";
    })();

    const organization =
      organizations.find((o) => o.id === organizationId) ?? null;

    return {
      organizationId,
      organization,
      allOrganizations: organizations,
      isSuperadmin: role === "superadmin",
      isLoaded: true,
    };
  }, [clerkUser, clerkLoaded, permLoaded, isSignedIn, role]);

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

// ── Hook ──

export function useOrganization(): OrganizationContextValue {
  const ctx = useContext(OrganizationContext);
  if (!ctx) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return ctx;
}
