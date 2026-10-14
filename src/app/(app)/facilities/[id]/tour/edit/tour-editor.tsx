"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Rotate3d,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TourConfig, TourArea } from "@/lib/facility-tour";

interface StopEditorItem {
  id: string;
  title: string;
  description: string;
  roomName: string;
  area: TourArea;
  accentColor: string;
  highlights: string[];
}

interface TourEditorProps {
  facilityId: string;
  facilityName: string;
  initialConfig: TourConfig | null;
}

function areaFromRoomName(roomName: string): TourArea {
  const lower = roomName.toLowerCase().trim();
  if (
    lower.includes("lobby") ||
    lower.includes("reception") ||
    lower.includes("entrance") ||
    lower.includes("atrium") ||
    lower.includes("parlor")
  ) {
    return "lobby";
  }
  if (lower.includes("corridor") || lower.includes("hall") || lower.includes("track")) {
    return "corridor";
  }
  return "room";
}

function roomNameFromArea(area: TourArea): string {
  switch (area) {
    case "lobby":
      return "Lobby";
    case "corridor":
      return "Corridor";
    case "room":
      return "Patient Room";
  }
}

export function TourEditor({ facilityId, facilityName, initialConfig }: TourEditorProps) {
  const router = useRouter();

  const [tourTitle, setTourTitle] = useState(
    initialConfig?.title ?? initialConfig?.welcome ?? `Welcome to ${facilityName}`,
  );

  const [stops, setStops] = useState<StopEditorItem[]>(() => {
    if (initialConfig?.stops && initialConfig.stops.length > 0) {
      return initialConfig.stops.map((s, idx) => ({
        id: s.id || `stop-${idx + 1}`,
        title: s.label ?? "",
        description: s.description ?? "",
        roomName: s.roomName ?? roomNameFromArea(s.area),
        area: s.area,
        accentColor: s.accentColor ?? initialConfig.accentColor ?? "#2f80c8",
        highlights: s.highlights ?? [],
      }));
    }

    return [
      {
        id: "arrival",
        title: "Arrival & Admissions",
        description: "Welcome area where families check in and meet the admissions team.",
        roomName: "Lobby",
        area: "lobby",
        accentColor: "#2f80c8",
        highlights: [],
      },
      {
        id: "corridor",
        title: "Main Care Hallway",
        description: "Wide, well-lit hallway with continuous handrails and nurse stations.",
        roomName: "Corridor",
        area: "corridor",
        accentColor: "#2f80c8",
        highlights: [],
      },
      {
        id: "suite",
        title: "Patient Suite",
        description: "Private room with dedicated care amenities and natural lighting.",
        roomName: "Patient Room",
        area: "room",
        accentColor: "#2f80c8",
        highlights: [],
      },
    ];
  });

  const [initialSnapshot, setInitialSnapshot] = useState(() =>
    JSON.stringify({
      tourTitle: initialConfig?.title ?? initialConfig?.welcome ?? `Welcome to ${facilityName}`,
      stops: (initialConfig?.stops && initialConfig.stops.length > 0
        ? initialConfig.stops.map((s, idx) => ({
            id: s.id || `stop-${idx + 1}`,
            title: s.label ?? "",
            description: s.description ?? "",
            roomName: s.roomName ?? roomNameFromArea(s.area),
            area: s.area,
            accentColor: s.accentColor ?? initialConfig.accentColor ?? "#2f80c8",
            highlights: s.highlights ?? [],
          }))
        : [
            {
              id: "arrival",
              title: "Arrival & Admissions",
              description: "Welcome area where families check in and meet the admissions team.",
              roomName: "Lobby",
              area: "lobby",
              accentColor: "#2f80c8",
              highlights: [],
            },
            {
              id: "corridor",
              title: "Main Care Hallway",
              description: "Wide, well-lit hallway with continuous handrails and nurse stations.",
              roomName: "Corridor",
              area: "corridor",
              accentColor: "#2f80c8",
              highlights: [],
            },
            {
              id: "suite",
              title: "Patient Suite",
              description: "Private room with dedicated care amenities and natural lighting.",
              roomName: "Patient Room",
              area: "room",
              accentColor: "#2f80c8",
              highlights: [],
            },
          ]),
    }),
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const currentSnapshot = useMemo(
    () => JSON.stringify({ tourTitle, stops }),
    [tourTitle, stops],
  );

  const isDirty = currentSnapshot !== initialSnapshot;

  function updateStop(index: number, updates: Partial<StopEditorItem>) {
    setStops((prev) => {
      const copy = [...prev];
      const existing = copy[index];
      const updated = { ...existing, ...updates };

      if (updates.roomName !== undefined && updates.area === undefined) {
        updated.area = areaFromRoomName(updates.roomName);
      }

      copy[index] = updated;
      return copy;
    });
    setSaveSuccess(false);
    setError(null);
  }

  function moveStop(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= stops.length) return;
    setStops((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return copy;
    });
    setSaveSuccess(false);
    setError(null);
  }

  function removeStop(index: number) {
    if (stops.length <= 1) {
      toast.error("A tour must have at least one stop");
      return;
    }
    setStops((prev) => prev.filter((_, i) => i !== index));
    setSaveSuccess(false);
    setError(null);
  }

  function addStop() {
    if (stops.length >= 12) {
      toast.error("Maximum 12 stops allowed per facility tour");
      return;
    }
    const newIndex = stops.length + 1;
    const defaultRoom = newIndex % 3 === 1 ? "Lobby" : newIndex % 3 === 2 ? "Corridor" : "Patient Room";
    const newStop: StopEditorItem = {
      id: `stop-${Date.now()}-${newIndex}`,
      title: `Stop ${newIndex}`,
      description: "",
      roomName: defaultRoom,
      area: areaFromRoomName(defaultRoom),
      accentColor: stops[stops.length - 1]?.accentColor ?? "#2f80c8",
      highlights: [],
    };
    setStops((prev) => [...prev, newStop]);
    setSaveSuccess(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (stops.length === 0) {
      setError("Please add at least one stop to the tour.");
      return;
    }

    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const payload = {
        title: tourTitle.trim() || `Welcome to ${facilityName}`,
        welcome: tourTitle.trim() || `Welcome to ${facilityName}`,
        accentColor: stops[0]?.accentColor ?? "#2f80c8",
        stops: stops.map((s, idx) => ({
          id: s.id || `stop-${idx + 1}`,
          title: s.title.trim() || `Stop ${idx + 1}`,
          label: s.title.trim() || `Stop ${idx + 1}`,
          description: s.description.trim(),
          roomName: s.roomName.trim() || roomNameFromArea(s.area),
          area: s.area || areaFromRoomName(s.roomName),
          accentColor: s.accentColor || "#2f80c8",
          highlights: s.highlights ?? [],
        })),
      };

      const res = await fetch(`/api/facilities/${facilityId}/tour`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Failed to save tour configuration";
        setError(msg);
        toast.error(msg);
        return;
      }

      setSaveSuccess(true);
      toast.success("Tour configuration saved successfully");
      setInitialSnapshot(currentSnapshot);
      router.refresh();
    } catch {
      const msg = "Something went wrong while saving the tour. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive dark:border-destructive/40">
          <AlertCircle className="size-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {saveSuccess && (
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800/40 dark:bg-green-950/40 dark:text-green-300">
          <CheckCircle2 className="size-5 shrink-0" />
          <p>Tour configuration saved successfully.</p>
        </div>
      )}

      {/* Tour Title Section */}
      <Card>
        <CardHeader>
          <CardTitle>Tour Information</CardTitle>
          <CardDescription>
            General settings for the 3D walkthrough experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tour-title">Tour title</Label>
            <Input
              id="tour-title"
              value={tourTitle}
              onChange={(e) => {
                setTourTitle(e.target.value);
                setSaveSuccess(false);
                setError(null);
              }}
              placeholder={`Welcome to ${facilityName}`}
              required
            />
            <p className="text-xs text-muted-foreground">
              Displayed as the welcome message when visitors start exploring the facility.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tour Stops Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg">Tour Stops ({stops.length})</CardTitle>
            <CardDescription>
              Manage the ordered sequence of stops visitors can step through.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addStop}
            disabled={stops.length >= 12}
          >
            <Plus className="mr-1.5 size-4" />
            Add stop
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {stops.map((stop, index) => (
            <div
              key={stop.id}
              className="relative rounded-2xl border border-border/80 bg-background/50 p-5 transition-shadow hover:shadow-xs"
            >
              <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs"
                    style={{ backgroundColor: stop.accentColor || "#2f80c8" }}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {stop.title.trim() ? stop.title : `Stop ${index + 1}`}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {stop.roomName || roomNameFromArea(stop.area)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => moveStop(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move stop ${index + 1} up`}
                    title="Move stop up"
                  >
                    <ArrowUp className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => moveStop(index, 1)}
                    disabled={index === stops.length - 1}
                    aria-label={`Move stop ${index + 1} down`}
                    title="Move stop down"
                  >
                    <ArrowDown className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeStop(index)}
                    disabled={stops.length <= 1}
                    aria-label={`Remove stop ${index + 1}`}
                    title={stops.length <= 1 ? "At least one stop required" : "Remove stop"}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`stop-title-${stop.id}`}>Stop title</Label>
                  <Input
                    id={`stop-title-${stop.id}`}
                    value={stop.title}
                    onChange={(e) => updateStop(index, { title: e.target.value })}
                    placeholder="e.g. Arrival & Admissions"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`stop-room-${stop.id}`}>Room name</Label>
                  <Input
                    id={`stop-room-${stop.id}`}
                    value={stop.roomName}
                    onChange={(e) => updateStop(index, { roomName: e.target.value })}
                    placeholder="e.g. Lobby, Corridor, Patient Room"
                    list={`room-suggestions-${stop.id}`}
                    required
                  />
                  <datalist id={`room-suggestions-${stop.id}`}>
                    <option value="Lobby" />
                    <option value="Corridor" />
                    <option value="Patient Room" />
                  </datalist>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {["Lobby", "Corridor", "Patient Room"].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => updateStop(index, { roomName: preset })}
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                          stop.roomName.toLowerCase() === preset.toLowerCase()
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80",
                        )}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={`stop-desc-${stop.id}`}>Description</Label>
                  <Textarea
                    id={`stop-desc-${stop.id}`}
                    value={stop.description}
                    onChange={(e) => updateStop(index, { description: e.target.value })}
                    placeholder="Describe this area, highlights, and amenities for visitors..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`stop-color-${stop.id}`}>Accent color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id={`stop-color-${stop.id}`}
                      value={stop.accentColor}
                      onChange={(e) => updateStop(index, { accentColor: e.target.value })}
                      className="size-9 cursor-pointer rounded-xl border border-border bg-transparent p-0.5"
                      aria-label="Color picker"
                    />
                    <Input
                      value={stop.accentColor}
                      onChange={(e) => updateStop(index, { accentColor: e.target.value })}
                      placeholder="#2f80c8"
                      className="w-32 font-mono text-xs uppercase"
                      maxLength={7}
                    />
                    <div
                      className="size-5 rounded-full border border-black/10 shadow-xs"
                      style={{ backgroundColor: stop.accentColor }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {stops.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">No stops added yet.</p>
              <Button type="button" variant="outline" size="sm" onClick={addStop} className="mt-3">
                <Plus className="mr-1.5 size-4" />
                Add first stop
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save & Status Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          {isDirty ? (
            <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
              Unsaved changes
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              All changes saved
            </Badge>
          )}
          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
              <CheckCircle2 className="size-3.5" />
              Saved
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/facilities/${facilityId}/tour`)}
          >
            <Rotate3d className="mr-1.5 size-4" />
            Preview tour
          </Button>
          <Button
            type="submit"
            disabled={saving || !isDirty}
            className="min-w-32"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
