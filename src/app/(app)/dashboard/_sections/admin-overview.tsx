"use client";

import type { DashboardWidgetData } from "@/types";
import { AppointmentsCard } from "./appointments-card";
import { ActivityCard } from "./activity-card";
import { VirtualCardsCard } from "./virtual-cards-card";
import { ProgressCard } from "./progress-card";
import { ContractTypeCard } from "./contract-type-card";
import { PlacementsByMonthCard } from "./placements-by-month-card";

interface AdminOverviewProps {
  widgets: DashboardWidgetData;
}

export default function AdminOverview({ widgets }: AdminOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-min">
      {/* Facility Calendar — tall, spans 2 rows */}
      <div className="lg:row-span-2 h-full">
        <AppointmentsCard events={widgets.scheduleEvents} />
      </div>

      <ActivityCard data={widgets.activity} />

      <VirtualCardsCard categories={widgets.facilitiesByCategory} />

      <ProgressCard data={widgets.placementsThisWeek} />

      <ContractTypeCard data={widgets.careLevelBreakdown} />

      {/* Placements by Month — fills remaining width */}
      <div className="lg:col-span-2 min-h-[320px]">
        <PlacementsByMonthCard data={widgets.placementsByMonth} className="h-full" />
      </div>
    </div>
  );
}
