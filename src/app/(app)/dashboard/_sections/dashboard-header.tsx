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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground w-fit border border-border/50">
          <span className="size-1.5 rounded-full bg-primary" />
          {today}
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-[1.08] font-normal tracking-tight text-foreground">
          Welcome, {userName}.
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
          Here&apos;s an overview of active placements, team schedules, and facility availability today.
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
