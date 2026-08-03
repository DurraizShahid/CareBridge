"use client";

import { Search, SlidersHorizontal, CalendarDays, Plus, ChevronDown, LayoutDashboard, BarChart3, Users, Building2 } from "lucide-react";
import { PipelineBar } from "./pipeline-bar";

interface DashboardHeaderProps {
  userName: string;
  totalPlacements: number;
  completedPlacements: number;
  activePlacements: number;
  placementsThisMonth: number;
}

const navChips = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Analytics", icon: BarChart3, active: false },
  { label: "Patients", icon: Users, active: false },
  { label: "Facilities", icon: Building2, active: false },
];

export default function DashboardHeader({
  userName,
  totalPlacements,
  completedPlacements,
  activePlacements,
  placementsThisMonth,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-8">
      {/* Top nav pills */}
      <div className="flex items-center gap-2">
        {navChips.map((chip) => {
          const Icon = chip.icon;
          return (
            <button
              key={chip.label}
              className={`dash-pill ${chip.active ? "dash-pill-active" : ""}`}
            >
              <Icon className="size-4" />
              {chip.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-8">
        {/* Welcome hero */}
        <div className="flex flex-col gap-3">
          <h1 className="text-[52px] leading-[1.04] font-[500] tracking-[-0.04em] text-[#111014]">
            Welcome, {userName}.
          </h1>
          <p className="text-[15px] text-[#8d8a98] max-w-lg">
            Here&apos;s what&apos;s happening with your placements today.
          </p>
        </div>

        {/* Stats + Controls bar */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-md">
            <PipelineBar
              total={totalPlacements}
              completed={completedPlacements}
              active={activePlacements}
              thisMonth={placementsThisMonth}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="dash-control">
              <Search className="size-4 text-[#8d8a98]" />
            </div>
            <div className="dash-control">
              <SlidersHorizontal className="size-4 text-[#8d8a98]" />
            </div>
            <div className="dash-control gap-2">
              <CalendarDays className="size-4 text-[#8d8a98]" />
              <span className="text-xs">20-27 Jan, 2026</span>
              <ChevronDown className="size-3.5 text-[#8d8a98]" />
            </div>
            <div className="dash-control gap-2">
              <Plus className="size-4 text-[#8d8a98]" />
              <span className="text-xs">Add Widget</span>
            </div>
            <button className="dash-pill dash-pill-active text-xs px-4">
              Create a Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
