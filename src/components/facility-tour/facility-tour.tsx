"use client";

import { useMemo, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight, Map as MapIcon, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TourConfig } from "@/lib/facility-tour";
import { AREAS, OVERVIEW, placeStops, type PlacedStop } from "./layout";

const TourScene = dynamic(() => import("./tour-scene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Preparing the 3D walkthrough…
    </div>
  ),
});

export function FacilityTour({ config, facilityName }: { config: TourConfig; facilityName: string }) {
  const stops = useMemo(() => placeStops(config.stops), [config]);
  const [active, setActive] = useState(-1);
  const stop = active >= 0 ? stops[active] : null;
  const go = (i: number) => setActive(((i % stops.length) + stops.length) % stops.length);

  return (
    <div
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
      style={{ "--tour-accent": config.accentColor } as CSSProperties}
    >
      <section
        aria-label={`3D tour of ${facilityName}`}
        className="relative h-[min(72vh,680px)] min-h-[420px] overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-[#eef5fc] to-white dark:from-slate-900 dark:to-slate-950"
      >
        <TourScene config={config} stops={stops} active={active} view={stop?.view ?? OVERVIEW} onSelect={setActive} />

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur">
            {stop ? `${AREAS[stop.area].name} · Stop ${active + 1} of ${stops.length}` : "Overview"}
          </span>
          <span className="hidden rounded-full bg-white/70 px-3 py-1 text-xs text-slate-500 backdrop-blur sm:inline">
            Drag to orbit · scroll to zoom
          </span>
        </div>

        <div className="absolute inset-x-4 bottom-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div
            aria-live="polite"
            className="max-w-md rounded-2xl border border-white/70 bg-white/90 p-5 text-slate-700 shadow-lg backdrop-blur"
          >
            {stop ? (
              <StopDetails stop={stop} />
            ) : (
              <>
                <h2 className="text-base font-semibold text-slate-900">Welcome to {facilityName}</h2>
                <p className="mt-1 text-sm leading-relaxed">
                  {config.welcome ?? "Take a guided walk from the entrance to a patient room."}
                </p>
              </>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            {stop && (
              <Button variant="outline" size="icon-sm" aria-label="Previous stop" onClick={() => go(active - 1)}>
                <ChevronLeft />
              </Button>
            )}
            {stop && (
              <Button variant="outline" size="icon-sm" aria-label="Back to overview" onClick={() => setActive(-1)}>
                <RotateCcw />
              </Button>
            )}
            <Button
              size="sm"
              className="bg-[var(--tour-accent)] text-white hover:bg-[var(--tour-accent)]/85"
              onClick={() => go(active + 1)}
            >
              {stop ? "Next stop" : "Start tour"}
              <ChevronRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapIcon className="h-4 w-4 text-muted-foreground" />
              Floor plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Minimap stops={stops} active={active} onSelect={setActive} accent={config.accentColor} roomName={config.roomName} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tour stops</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-1.5">
              {stops.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    aria-current={i === active ? "step" : undefined}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted aria-[current=step]:bg-[var(--tour-accent)]/10 focus-visible:outline-2 focus-visible:outline-[var(--tour-accent)]"
                  >
                    <span
                      className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ background: config.accentColor }}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{s.label}</span>
                      <span className="block text-xs text-muted-foreground">{AREAS[s.area].name}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function StopDetails({ stop }: { stop: PlacedStop }) {
  return (
    <>
      <h2 className="text-base font-semibold text-slate-900">{stop.label}</h2>
      {stop.description && <p className="mt-1 text-sm leading-relaxed">{stop.description}</p>}
      {stop.highlights.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {stop.highlights.map((h) => (
            <li
              key={h}
              className="rounded-full bg-[var(--tour-accent)]/10 px-2.5 py-0.5 text-xs font-medium text-slate-700"
            >
              {h}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// Top-down plan, rotated so the entrance sits on the left: svgX = 12 - z, svgY = x + 7.
function Minimap({
  stops,
  active,
  onSelect,
  accent,
  roomName,
}: {
  stops: PlacedStop[];
  active: number;
  onSelect: (i: number) => void;
  accent: string;
  roomName: string;
}) {
  return (
    <svg viewBox="0 0 26 16" className="w-full" role="group" aria-label="Floor plan with tour stops">
      {Object.entries(AREAS).map(([key, a]) => (
        <g key={key}>
          <rect
            x={12 - a.z[1]}
            y={a.x[0] + 7}
            width={a.z[1] - a.z[0]}
            height={a.x[1] - a.x[0]}
            rx={0.5}
            className="fill-muted stroke-border"
            strokeWidth={0.12}
          />
          <text
            x={12 - (a.z[0] + a.z[1]) / 2}
            y={a.x[0] + 7 + (key === "corridor" ? 2.1 : 1.3)}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={1}
          >
            {key === "room" ? roomName : a.name}
          </text>
        </g>
      ))}
      {stops.map((s, i) => (
        <g
          key={s.id}
          role="button"
          tabIndex={0}
          aria-label={`Go to ${s.label}`}
          onClick={() => onSelect(i)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(i))}
          className="cursor-pointer outline-none [&:focus-visible>circle:first-child]:stroke-foreground"
        >
          <circle
            cx={12 - s.anchor[2]}
            cy={s.anchor[0] + 7}
            r={i === active ? 0.95 : 0.7}
            fill={accent}
            stroke="white"
            strokeWidth={0.18}
            opacity={active < 0 || i === active ? 1 : 0.55}
          />
          <text x={12 - s.anchor[2]} y={s.anchor[0] + 7.3} textAnchor="middle" fontSize={0.8} fill="white" fontWeight={600}>
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}
