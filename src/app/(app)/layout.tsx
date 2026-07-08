'use client';

import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeProvider } from "@/hooks/use-theme";
import { OrganizationProvider } from "@/hooks/use-organization";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GooeyLoader } from "@/components/ui/loader-10";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasOrg, setHasOrg] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch('/api/me');
        const data = await res.json();
        if (data && data.organizationId) {
          setHasOrg(true);
        } else {
          router.push('/onboarding');
        }
      } catch (err) {
        console.error('Failed to check user:', err);
        router.push('/onboarding');
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <GooeyLoader primaryColor="var(--health)" secondaryColor="color-mix(in oklch, var(--health), white 35%)" borderColor="color-mix(in oklch, var(--health), black 60%)" />
          <p className="text-sm text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!hasOrg) {
    return null;
  }

  return (
    <ThemeProvider>
      <OrganizationProvider>
        <div className="flex h-screen flex-1">
          <TooltipProvider delay={0}>
            <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <AppSidebar />
              <main className="flex flex-1 flex-col bg-surface dark:bg-background">
                <DashboardHeader />
                <ScrollArea className="flex-1 min-h-0">
                  <div className="mx-auto w-full max-w-7xl px-6 py-8">
                    {children}
                  </div>
                </ScrollArea>
              </main>
            </SidebarProvider>
          </TooltipProvider>
        </div>
      </OrganizationProvider>
    </ThemeProvider>
  );
}
