"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { organizations } from "@/lib/data";
import type { Organization } from "@/types";

interface OrganizationContextValue {
  organizationId: string;
  organization: Organization | null;
  allOrganizations: Organization[];
  isSuperadmin: boolean;
  isLoaded: boolean;
}

const OrganizationContext = createContext<OrganizationContextValue>({
  organizationId: "",
  organization: null,
  allOrganizations: [],
  isSuperadmin: false,
  isLoaded: false,
});

export function OrganizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<{
    organizationId: string;
    role: string | null;
    isLoaded: boolean;
  }>({ organizationId: "", role: null, isLoaded: false });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) {
          if (!cancelled) setState({ organizationId: "", role: null, isLoaded: true });
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setState({
            organizationId: data?.organizationId ?? "",
            role: data?.role ?? null,
            isLoaded: true,
          });
        }
      } catch {
        if (!cancelled) setState({ organizationId: "", role: null, isLoaded: true });
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const value = useMemo<OrganizationContextValue>(() => {
    if (!state.isLoaded) {
      return {
        organizationId: "",
        organization: null,
        allOrganizations: organizations,
        isSuperadmin: false,
        isLoaded: false,
      };
    }

    const organization =
      organizations.find((o) => o.id === state.organizationId) ?? null;

    return {
      organizationId: state.organizationId,
      organization,
      allOrganizations: organizations,
      isSuperadmin: state.role === "superadmin",
      isLoaded: true,
    };
  }, [state]);

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization(): OrganizationContextValue {
  const ctx = useContext(OrganizationContext);
  if (!ctx) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return ctx;
}
