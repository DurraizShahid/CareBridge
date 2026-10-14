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
  roomName?: string;
  accentColor?: string;
}

export interface TourConfig {
  accentColor: string;
  wallColor: string;
  floorColor: string;
  welcome?: string;
  title?: string;
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

function resolveArea(rawArea: unknown, rawRoomName: unknown): TourArea | undefined {
  if (rawArea !== undefined) {
    if (typeof rawArea !== "string") return undefined;
    return TOUR_AREAS.find((a) => a === rawArea.toLowerCase().trim());
  }
  if (typeof rawRoomName === "string") {
    const trimmed = rawRoomName.toLowerCase().trim();
    const matched = TOUR_AREAS.find((a) => a === trimmed);
    if (matched) return matched;
    if (
      trimmed.includes("lobby") ||
      trimmed.includes("reception") ||
      trimmed.includes("entrance") ||
      trimmed.includes("atrium") ||
      trimmed.includes("parlor")
    ) {
      return "lobby";
    }
    if (trimmed.includes("corridor") || trimmed.includes("hall") || trimmed.includes("track")) {
      return "corridor";
    }
    if (
      trimmed.includes("room") ||
      trimmed.includes("suite") ||
      trimmed.includes("studio") ||
      trimmed.includes("bed")
    ) {
      return "room";
    }
  }
  return undefined;
}

/** Returns a sanitized config, or null if the value has no usable stops. */
export function parseTourConfig(value: unknown): TourConfig | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.stops)) return null;

  const seen = new Set<string>();
  const stops: TourStop[] = [];
  for (let i = 0; i < Math.min(raw.stops.length, MAX_STOPS); i++) {
    const s = raw.stops[i];
    if (!s || typeof s !== "object") continue;
    const stop = s as Record<string, unknown>;
    const id = text(stop.id, 40) ?? `stop-${i + 1}`;
    const label = text(stop.label ?? stop.title, 60);
    const area = resolveArea(stop.area, stop.roomName);
    if (!id || !label || !area || seen.has(id)) continue;
    seen.add(id);

    const roomName = text(stop.roomName, 60);
    const accent = typeof stop.accentColor === "string" && HEX.test(stop.accentColor) ? stop.accentColor : undefined;

    stops.push({
      id,
      area,
      label,
      description: text(stop.description, 400) ?? "",
      highlights: Array.isArray(stop.highlights)
        ? stop.highlights.map((h) => text(h, 80)).filter((h): h is string => !!h).slice(0, 6)
        : [],
      ...(roomName ? { roomName } : {}),
      ...(accent ? { accentColor: accent } : {}),
    });
  }
  if (stops.length === 0) return null;

  const title = text(raw.title, 120);
  const welcome = text(raw.welcome, 200) ?? title;
  const firstStopAccent = stops.find((s) => s.accentColor)?.accentColor;

  return {
    accentColor: color(raw.accentColor, firstStopAccent ?? "#2f80c8"),
    wallColor: color(raw.wallColor, "#f4f7fb"),
    floorColor: color(raw.floorColor, "#e6ebf1"),
    welcome,
    ...(title ? { title } : {}),
    roomName: text(raw.roomName, 60) ?? "Patient Suite",
    stops,
  };
}

export function validateTourConfig(value: unknown): {
  valid: boolean;
  config?: TourConfig;
  error?: string;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { valid: false, error: "Configuration must be an object" };
  }
  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.stops) || raw.stops.length === 0) {
    return { valid: false, error: "Tour must contain at least one stop" };
  }
  const config = parseTourConfig(value);
  if (!config) {
    return { valid: false, error: "Tour configuration contains invalid stops or areas" };
  }
  return { valid: true, config };
}
