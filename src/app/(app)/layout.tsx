'use client';

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { HospitalShell } from "@/components/layout/hospital-shell";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeProvider } from "@/hooks/use-theme";
import { OrganizationProvider } from "@/hooks/use-organization";
import { useEffect, useState, useCallback } from 'react';
import { CareBridgeLoader } from "@/components/carebridge-loader";
import { installGlobal401Handler, handle401, apiFetch } from "@/lib/api-client";

const HOSPITAL_ROLES = ["social-worker", "discharge-planner", "administrator"];

function redirect(to: string) {
  window.location.href = to;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasOrg, setHasOrg] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loaderComplete, setLoaderComplete] = useState(false);

  useEffect(() => {
    installGlobal401Handler();
    const checkUser = async () => {
      try {
        const res = await apiFetch('/api/me');
        if (!res.ok) {
          if (res.status === 401) {
            handle401();
            return;
          }
          console.error('GET /api/me failed:', res.status, await res.text());
          redirect('/onboarding');
          return;
        }
        const data = await res.json();
        if (data && data.organizationId) {
          setHasOrg(true);
          setUserRole(data.role ?? null);
        } else {
          redirect('/onboarding');
        }
      } catch (err) {
        console.error('Failed to check user:', err);
        redirect('/onboarding');
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  const handleLoaderComplete = useCallback(() => {
    setLoaderComplete(true);
  }, []);

  const isHospitalRole = userRole && HOSPITAL_ROLES.includes(userRole);

  if (isLoading || !loaderComplete) {
    return <CareBridgeLoader onComplete={handleLoaderComplete} />;
  }

  if (!hasOrg) {
    return null;
  }

  return (
    <ThemeProvider>
      <OrganizationProvider>
        <TooltipProvider delay={0}>
          <SidebarProvider className="h-dvh min-h-0 overflow-hidden" style={{ "--sidebar-width": "15rem" } as React.CSSProperties}>
            <AppSidebar />
            <SidebarInset className={`min-w-0 overflow-hidden ${userRole === 'superadmin' ? 'tracking-wider' : 'dashboard-gradient'}`}>
              {isHospitalRole ? (
                <HospitalShell>{children}</HospitalShell>
              ) : (
                <>
                  <DashboardHeader />
                  <ScrollArea className="flex-1 min-h-0">
                    <div className="dashboard-canvas px-3 py-3 md:px-6 md:py-5" style={{ animation: "content-fade-in 0.5s cubic-bezier(0.16,1,0.3,1) forwards" }}>
                      {children}
                    </div>
                  </ScrollArea>
                </>
              )}
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </OrganizationProvider>
    </ThemeProvider>
  );
}
