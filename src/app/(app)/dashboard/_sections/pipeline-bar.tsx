interface PipelineBarProps {
  total: number;
  completed: number;
  active: number;
  thisMonth: number;
}

export function PipelineBar({ total, completed, active, thisMonth }: PipelineBarProps) {
  const completedPct = total > 0 ? (completed / total) * 100 : 0;
  const activePct = total > 0 ? (active / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-5 flex-wrap text-[13px]">
        <span className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2.5 rounded-full bg-[var(--chart-1)]" />
          Completed
          <span className="font-semibold tabular-nums text-foreground">{completed}</span>
        </span>
        <span className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2.5 rounded-full bg-[var(--chart-2)]" />
          Active
          <span className="font-semibold tabular-nums text-foreground">{active}</span>
        </span>
        <span className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2.5 rounded-full border border-border bg-transparent" />
          This month
          <span className="font-semibold tabular-nums text-foreground">{thisMonth}</span>
        </span>
        <span className="ml-auto text-muted-foreground">
          <span className="font-semibold tabular-nums text-foreground">{total}</span> total
        </span>
      </div>

      <div
        className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`${completed} of ${total} placements completed, ${active} active`}
      >
        {completed > 0 && (
          <div
            className="h-full rounded-full bg-[var(--chart-1)]"
            style={{ width: `${completedPct}%`, minWidth: "12px" }}
          />
        )}
        {active > 0 && (
          <div
            className="h-full rounded-full bg-[var(--chart-2)]"
            style={{ width: `${activePct}%`, minWidth: "12px" }}
          />
        )}
      </div>
      {total === 0 && (
        <p className="text-xs text-muted-foreground -mt-1">No placements yet</p>
      )}
    </div>
  );
}
