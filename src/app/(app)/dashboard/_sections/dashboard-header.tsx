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
    <div className="flex flex-col gap-4 mb-2">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-light text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home Page
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Dashboard</span>
      </nav>

      <div className="flex flex-col gap-4">
        <h1 className="text-2xl sm:text-[40px] font-semibold tracking-tight text-foreground leading-none">
          <span className="font-thin">Welcome,</span> <span className="font-normal">{userName}.</span>
        </h1>
        <p className="text-[10px] font-light text-muted-foreground max-w-sm -mt-2">
          Here's what's happening with your placements today.
        </p>

        <div className="flex items-center justify-between">
          <PipelineBar
            total={totalPlacements}
            completed={completedPlacements}
            active={activePlacements}
            thisMonth={placementsThisMonth}
          />

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
            variant="secondary"
            size="icon-sm"
            aria-label="Search"
            className="size-12 rounded-full text-foreground"
            style={{ backgroundColor: 'oklch(0.939 0.007 295)' }}
          >
            <Search className="size-3.5" />
          </Button>

          <Button
            variant="secondary"
            size="icon-sm"
            aria-label="Filters"
            className="size-12 rounded-full text-foreground"
            style={{ backgroundColor: 'oklch(0.939 0.007 295)' }}
          >
            <SlidersHorizontal className="size-3.5" />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            aria-label="Date range"
            className="gap-2 px-4 h-12 rounded-full text-foreground"
            style={{ backgroundColor: 'oklch(0.939 0.007 295)' }}
          >
            <CalendarDays className="size-3.5" />
            <span className="text-[10px] font-normal">20-27 Jan, 2025</span>
            <ChevronDown className="size-3 text-muted-foreground" />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="gap-2 px-5 h-12 rounded-full text-foreground"
            style={{ backgroundColor: 'oklch(0.939 0.007 295)' }}
          >
            <Plus className="size-3.5" />
            <span className="text-[10px] font-normal">Add Widget</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="px-5 h-12 rounded-full text-foreground"
            style={{ backgroundColor: 'oklch(0.939 0.007 295)' }}
          >
            <span className="text-[10px] font-normal">Create a Report</span>
          </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
