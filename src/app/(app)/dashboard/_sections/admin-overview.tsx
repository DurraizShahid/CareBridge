"use client";

import { AppointmentsCard } from "./appointments-card";
import { ActivityCard } from "./activity-card";
import { VirtualCardsCard } from "./virtual-cards-card";
import { ProgressCard } from "./progress-card";
import { ContractTypeCard } from "./contract-type-card";
import { PlacementsByMonthCard } from "./placements-by-month-card";

export default function AdminOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Facility Calendar — tall, spans 2 rows */}
      <div className="lg:row-span-2">
        <AppointmentsCard />
      </div>

      {/* Placement Activity — square */}
      <div className="aspect-square">
        <ActivityCard />
      </div>

      {/* Organization Wallet — square */}
      <div className="aspect-square">
        <VirtualCardsCard />
      </div>

      {/* Progress Card — square */}
      <div className="aspect-square">
        <ProgressCard />
      </div>

      {/* Placement by Care Level — square */}
      <div className="aspect-square">
        <ContractTypeCard />
      </div>

      {/* Placements by Month — free width, fills remaining space */}
      <div className="lg:col-span-2">
        <PlacementsByMonthCard className="h-full" />
      </div>
    </div>
  );
}
