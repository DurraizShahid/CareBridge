/**
 * Per-facility 3D tour configuration, stored in Facility.tourConfig (Json).
 * The scene layout (lobby → corridor → patient room) is fixed; each facility
 * supplies its own stops, copy, and palette. Parsed defensively because the
 * column is free-form JSON.
 */

export const TOUR_AREAS = ["lobby", "corridor", "room"] as const;
export type TourArea = (typeof TOUR_AREAS)[number];

export interface TourStop {
  id: string;
  area: TourArea;
  label: string;
  description: string;
  highlights: string[];
}

export interface TourConfig {
  accentColor: string;
  wallColor: string;
  floorColor: string;
  welcome?: string;
  roomName: string;
  stops: TourStop[];
}

const HEX = /^#[0-9a-f]{6}$/i;
const MAX_STOPS = 12;

function text(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

function color(value: unknown, fallback: string): string {
  return typeof value === "string" && HEX.test(value) ? value : fallback;
}

/** Returns a sanitized config, or null if the value has no usable stops. */
export function parseTourConfig(value: unknown): TourConfig | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.stops)) return null;

  const seen = new Set<string>();
  const stops: TourStop[] = [];
  for (const s of raw.stops.slice(0, MAX_STOPS)) {
    if (!s || typeof s !== "object") continue;
    const stop = s as Record<string, unknown>;
    const id = text(stop.id, 40);
    const label = text(stop.label, 60);
    const area = TOUR_AREAS.find((a) => a === stop.area);
    if (!id || !label || !area || seen.has(id)) continue;
    seen.add(id);
    stops.push({
      id,
      area,
      label,
      description: text(stop.description, 400) ?? "",
      highlights: Array.isArray(stop.highlights)
        ? stop.highlights.map((h) => text(h, 80)).filter((h): h is string => !!h).slice(0, 6)
        : [],
    });
  }
  if (stops.length === 0) return null;

  return {
    accentColor: color(raw.accentColor, "#2f80c8"),
    wallColor: color(raw.wallColor, "#f4f7fb"),
    floorColor: color(raw.floorColor, "#e6ebf1"),
    welcome: text(raw.welcome, 200),
    roomName: text(raw.roomName, 60) ?? "Patient Suite",
    stops,
  };
}
