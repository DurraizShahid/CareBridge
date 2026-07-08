"use client";

import { Fragment } from "react";
import { Bell, Search, Settings, Sun, Moon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/hooks/use-theme";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function breadcrumbFromPath(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let href = "";
  for (const segment of segments) {
    href += `/${segment}`;
    const label = segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    crumbs.push({ label, href });
  }
  return crumbs;
}

export function DashboardHeader() {
  const pathname = usePathname();
  const crumbs = breadcrumbFromPath(pathname);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-2" />
        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((crumb, i) => (
              <Fragment key={crumb.href}>
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {i === crumbs.length - 1 ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label="Notifications"
          className="relative"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
        </Button>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
