"use client";

import Link from "next/link";
import { ChevronRight, Search, SlidersHorizontal, CalendarDays, Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PipelineBar } from "./pipeline-bar";

interface DashboardHeaderProps {
  userName: string;
  totalPlacements: number;
  completedPlacements: number;
  activePlacements: number;
  placementsThisMonth: number;
}

export default function DashboardHeader({
  userName,
  totalPlacements,
  completedPlacements,
  activePlacements,
  placementsThisMonth,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home Page
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium">Dashboard</span>
      </nav>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground leading-none">
            <span className="font-light">Welcome,</span> <span className="font-semibold">{userName}.</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg">
            Here&apos;s what&apos;s happening with your placements today.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-md">
            <PipelineBar
              total={totalPlacements}
              completed={completedPlacements}
              active={activePlacements}
              thisMonth={placementsThisMonth}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="secondary" size="icon" aria-label="Search" className="rounded-xl bg-muted">
              <Search className="size-4" />
            </Button>
            <Button variant="secondary" size="icon" aria-label="Filters" className="rounded-xl bg-muted">
              <SlidersHorizontal className="size-4" />
            </Button>
            <Button variant="secondary" size="sm" aria-label="Date range" className="gap-2 rounded-xl bg-muted">
              <CalendarDays className="size-4" />
              <span className="text-xs font-normal">20-27 Jan, 2025</span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </Button>
            <Button variant="secondary" size="sm" className="gap-2 rounded-xl bg-muted">
              <Plus className="size-4" />
              <span className="text-xs font-normal">Add Widget</span>
            </Button>
            <Button variant="secondary" size="sm" className="rounded-xl bg-muted">
              <span className="text-xs font-normal">Create a Report</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
