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
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">{today}</p>
        <h1 className="text-4xl sm:text-5xl leading-[1.06] font-medium tracking-tight text-foreground">
          Welcome, {userName}.
        </h1>
        <p className="text-[15px] text-muted-foreground max-w-lg">
          Here&apos;s what&apos;s happening with your placements today.
        </p>
      </div>

      <div className="w-full max-w-2xl">
        <PipelineBar
          total={totalPlacements}
          completed={completedPlacements}
          active={activePlacements}
          thisMonth={placementsThisMonth}
        />
      </div>
    </div>
  );
}
