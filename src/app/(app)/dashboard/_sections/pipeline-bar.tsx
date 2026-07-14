interface PipelineBarProps {
  total: number;
  completed: number;
  active: number;
  thisMonth: number;
}

export function PipelineBar({ total, completed, active, thisMonth }: PipelineBarProps) {
  const hasRealData = total > 0 || completed > 0 || active > 0 || thisMonth > 0;

  const dTotal = hasRealData ? total : 40;
  const dCompleted = hasRealData ? completed : 35;
  const dActive = hasRealData ? active : 12;
  const dThisMonth = hasRealData ? thisMonth : 18;

  const segments = [
    { label: "Completed", value: dCompleted, flex: dCompleted, color: "bg-[#202020]", textColor: "text-white" },
    { label: "Active", value: dActive, flex: dActive, color: "bg-[#2B2BFB]", textColor: "text-white" },
    { label: "Total", value: dTotal, flex: dTotal, color: "hatched", textColor: "text-foreground" },
    { label: "This month", value: dThisMonth, flex: dThisMonth, color: "bordered", textColor: "text-foreground" },
  ];

  return (
    <div className="flex flex-col gap-1.5 flex-1">
      <div className="flex items-center gap-1">
        {segments.map((seg, i) => (
          <span
            key={i}
            className="text-[10px] text-muted-foreground truncate text-center"
            style={{ flex: `${seg.flex} 1 0` }}
          >
            {seg.label}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-1 h-12">
        {segments.map((seg, i) => {
          if (seg.color === "hatched") {
            return (
              <div
                key={i}
                className="h-full rounded-full flex items-center justify-start pl-3 text-[10px] relative overflow-hidden bg-background"
                style={{ flex: `${seg.flex} 1 0` }}
              >
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, transparent, transparent 3px, oklch(0.78 0.02 250) 3px, oklch(0.78 0.02 250) 4px)",
                  }}
                />
                <span className={`relative z-10 ${seg.textColor}`}>{seg.value}</span>
              </div>
            );
          }

          if (seg.color === "bordered") {
            return (
              <div
                key={i}
                className="h-full rounded-full border border-border flex items-center justify-start pl-3 text-[10px] bg-background"
                style={{ flex: `${seg.flex} 1 0` }}
              >
                <span className={seg.textColor}>{seg.value}</span>
              </div>
            );
          }

          return (
            <div
              key={i}
              className={`h-full rounded-full flex items-center justify-start pl-3 text-[10px] ${seg.color} ${seg.textColor}`}
              style={{ flex: `${seg.flex} 1 0` }}
            >
              {seg.value}
            </div>
          );
        })}
      </div>
    </div>
  );
}
