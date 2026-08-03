'use client';

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { HospitalShell } from "@/components/layout/hospital-shell";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeProvider } from "@/hooks/use-theme";
import { OrganizationProvider } from "@/hooks/use-organization";
import { useEffect, useState } from 'react';
import { GooeyLoader } from "@/components/ui/loader-10";

const HOSPITAL_ROLES = ["social-worker", "discharge-planner", "administrator"];

function redirect(to: string) {
  window.location.href = to;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasOrg, setHasOrg] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarLocked, setSidebarLocked] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch('/api/me');
        if (!res.ok) {
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

  const isHospitalRole = userRole && HOSPITAL_ROLES.includes(userRole);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <GooeyLoader primaryColor="var(--health)" secondaryColor="color-mix(in oklch, var(--health), white 35%)" borderColor="color-mix(in oklch, var(--health), #202022 60%)" />
          <p className="text-sm text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!hasOrg) {
    return null;
  }

  if (isHospitalRole) {
    return (
      <HospitalShell
        sidebarLocked={sidebarLocked}
        onToggle={() => setSidebarLocked((l) => !l)}
      >
        {children}
      </HospitalShell>
    );
  }

  return (
    <ThemeProvider>
      <OrganizationProvider>
        <TooltipProvider delay={0}>
          <SidebarProvider open={sidebarLocked || sidebarOpen} onOpenChange={setSidebarOpen}>
            <AppSidebar locked={sidebarLocked} />
            <SidebarInset className={`flex flex-1 flex-col ${userRole === 'superadmin' ? 'tracking-wider' : 'dashboard-gradient'}`}>
              <DashboardHeader sidebarLocked={sidebarLocked} onToggleSidebarLock={() => setSidebarLocked((l) => !l)} />
              <ScrollArea className="flex-1 min-h-0">
                <div className="dashboard-canvas">
                  {children}
                </div>
              </ScrollArea>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </OrganizationProvider>
    </ThemeProvider>
  );
}
