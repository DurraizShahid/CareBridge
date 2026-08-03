"use client";

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
    { label: "Completed", value: dCompleted, color: "#277979" },
    { label: "Active", value: dActive, color: "#bab9c4" },
    { label: "Total", value: dTotal, color: "hatched" },
    { label: "This month", value: dThisMonth, color: "bordered" },
  ];

  return (
    <div className="flex items-center gap-2 h-11">
      {segments.map((seg, i) => {
        if (seg.color === "hatched") {
          return (
            <div
              key={i}
              className="h-full rounded-full flex items-center justify-center text-xs font-medium relative overflow-hidden flex-1"
              style={{
                background: "repeating-linear-gradient(45deg, #f1f0f6, #f1f0f6 4px, #eae8f0 4px, #eae8f0 5px)",
                color: "#6c6a78",
              }}
            >
              <span className="relative z-10">{seg.value}</span>
            </div>
          );
        }
        if (seg.color === "bordered") {
          return (
            <div
              key={i}
              className="h-full rounded-full flex items-center justify-center text-xs font-medium flex-1"
              style={{
                border: "1px solid #eceaf2",
                color: "#6c6a78",
              }}
            >
              {seg.value}
            </div>
          );
        }
        return (
          <div
            key={i}
            className="h-full rounded-full flex items-center justify-center text-xs font-medium flex-1 text-white"
            style={{ backgroundColor: seg.color }}
          >
            {seg.value}
          </div>
        );
      })}
    </div>
  );
}
