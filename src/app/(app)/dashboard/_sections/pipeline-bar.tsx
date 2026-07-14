interface PipelineBarProps {
  total: number;
  completed: number;
  active: number;
  thisMonth: number;
}

export function PipelineBar({ total, completed, active, thisMonth }: PipelineBarProps) {
  const maxValue = Math.max(total, completed, active, thisMonth, 1);

  const segments = [
    { label: "Completed", value: completed, color: "bg-[#202020]", textColor: "text-white" },
    { label: "Active", value: active, color: "bg-[#2B2BFB]", textColor: "text-white" },
    { label: "Total", value: total, color: "hatched", textColor: "text-foreground" },
    { label: "This month", value: thisMonth, color: "bordered", textColor: "text-foreground" },
  ];

  const getWidth = (value: number) => {
    const minWidth = 70;
    const maxWidth = 280;
    return `${Math.max(minWidth, (value / maxValue) * maxWidth)}px`;
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center">
        {segments.map((seg, i) => (
          <span key={i} className="text-[10px] text-muted-foreground" style={{ width: getWidth(seg.value) }}>
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
                style={{ width: getWidth(seg.value) }}
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
                style={{ width: getWidth(seg.value) }}
              >
                <span className={seg.textColor}>{seg.value}</span>
              </div>
            );
          }

          return (
            <div
              key={i}
              className={`h-full rounded-full flex items-center justify-start pl-3 text-[10px] ${seg.color} ${seg.textColor}`}
              style={{ width: getWidth(seg.value) }}
            >
              {seg.value}
            </div>
          );
        })}
      </div>
    </div>
  );
}
