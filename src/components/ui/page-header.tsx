"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  userName?: string;
  breadcrumbs?: BreadcrumbItem[];
  children?: React.ReactNode;
  welcomePrefix?: string;
  welcomeName?: string;
}

export function PageHeader({ title, description, userName, breadcrumbs, children, welcomePrefix, welcomeName }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Breadcrumb */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-light text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home Page
          </Link>
          {breadcrumbs.map((item, index) => (
            <span key={index} className="flex items-center gap-1.5">
              <ChevronRight className="size-3.5" />
              {item.href ? (
                <Link href={item.href} className="hover:text-foreground transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Welcome & Title */}
      <div className="flex flex-col gap-1">
        {(userName || welcomePrefix) && (
          <h1 className="text-2xl sm:text-[40px] font-semibold tracking-tight text-foreground leading-none">
            <span className="font-thin">{welcomePrefix ?? "Welcome,"}</span> <span className="font-normal">{welcomeName ?? userName}.</span>
          </h1>
        )}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                {title}
              </h2>
            </div>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {children && <div className="flex shrink-0 items-center gap-3">{children}</div>}
        </div>
      </div>
    </div>
  );
}
