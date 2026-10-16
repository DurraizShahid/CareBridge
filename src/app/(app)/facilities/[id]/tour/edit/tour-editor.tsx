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
  Sparkles,
  Palette,
  MapPin,
  Building2,
  DoorOpen,
  Layers,
  Undo2,
  X,
  Compass,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

const PRESET_COLORS = [
  { label: "CareBridge Forest", value: "#245C52" },
  { label: "Clinical Blue", value: "#255DCE" },
  { label: "Sage Slate", value: "#53665E" },
  { label: "Deep Forest", value: "#19473F" },
  { label: "Brand Navy", value: "#102B4E" },
  { label: "Warm Amber", value: "#C05621" },
];

const SUGGESTED_HIGHLIGHTS: Record<TourArea, string[]> = {
  lobby: ["Check-in Desk", "Admissions Office", "Visitor Lounge", "Family Consultation", "Accessible Entryway"],
  corridor: ["Nurse Call Station", "Continuous Handrails", "Wide Hallways", "Non-Slip Flooring", "Direct Elevator Access"],
  room: ["Private Bathroom", "Zero-Threshold Shower", "Electric Hospital Bed", "Natural Lighting", "Family Seating"],
};

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
      return "Lobby & Reception";
    case "corridor":
      return "Main Care Corridor";
    case "room":
      return "Patient Suite";
  }
}

export function TourEditor({
  facilityId,
  facilityName,
  initialConfig,
}: TourEditorProps) {
  const router = useRouter();

  const [tourTitle, setTourTitle] = useState(
    initialConfig?.title ?? initialConfig?.welcome ?? `Welcome to ${facilityName}`,
  );

  const [globalAccentColor, setGlobalAccentColor] = useState(
    initialConfig?.accentColor ?? "#245C52",
  );

  const [patientRoomLabel, setPatientRoomLabel] = useState(
    initialConfig?.roomName ?? "Patient Suite",
  );

  const [stops, setStops] = useState<StopEditorItem[]>(() => {
    if (initialConfig?.stops && initialConfig.stops.length > 0) {
      return initialConfig.stops.map((s, idx) => ({
        id: s.id || `stop-${idx + 1}`,
        title: s.label || `Stop ${idx + 1}`,
        description: s.description ?? "",
        roomName: s.roomName ?? roomNameFromArea(s.area),
        area: s.area,
        accentColor: s.accentColor ?? initialConfig.accentColor ?? "#245C52",
        highlights: s.highlights ?? [],
      }));
    }

    return [
      {
        id: "arrival",
        title: "Arrival & Admissions",
        description: "Welcome area where families check in and meet the clinical care team.",
        roomName: "Lobby & Reception",
        area: "lobby",
        accentColor: "#245C52",
        highlights: ["Admissions Office", "Accessible Entryway"],
      },
      {
        id: "corridor",
        title: "Main Care Hallway",
        description: "Wide, well-lit corridor with continuous support handrails and direct nursing station visibility.",
        roomName: "Main Care Corridor",
        area: "corridor",
        accentColor: "#245C52",
        highlights: ["Nurse Call Station", "Continuous Handrails"],
      },
      {
        id: "suite",
        title: "Patient Suite",
        description: "Private room with dedicated therapeutic care amenities, natural daylight, and en-suite facilities.",
        roomName: "Patient Suite",
        area: "room",
        accentColor: "#245C52",
        highlights: ["Private Bathroom", "Electric Hospital Bed", "Natural Lighting"],
      },
    ];
  });

  const [newHighlightInputs, setNewHighlightInputs] = useState<Record<string, string>>({});

  const initialSnapshot = useMemo(
    () =>
      JSON.stringify({
        tourTitle: initialConfig?.title ?? initialConfig?.welcome ?? `Welcome to ${facilityName}`,
        globalAccentColor: initialConfig?.accentColor ?? "#245C52",
        patientRoomLabel: initialConfig?.roomName ?? "Patient Suite",
        stops: (initialConfig?.stops && initialConfig.stops.length > 0
          ? initialConfig.stops.map((s, idx) => ({
              id: s.id || `stop-${idx + 1}`,
              title: s.label || `Stop ${idx + 1}`,
              description: s.description ?? "",
              roomName: s.roomName ?? roomNameFromArea(s.area),
              area: s.area,
              accentColor: s.accentColor ?? initialConfig.accentColor ?? "#245C52",
              highlights: s.highlights ?? [],
            }))
          : [
              {
                id: "arrival",
                title: "Arrival & Admissions",
                description: "Welcome area where families check in and meet the clinical care team.",
                roomName: "Lobby & Reception",
                area: "lobby",
                accentColor: "#245C52",
                highlights: ["Admissions Office", "Accessible Entryway"],
              },
              {
                id: "corridor",
                title: "Main Care Hallway",
                description: "Wide, well-lit corridor with continuous support handrails and direct nursing station visibility.",
                roomName: "Main Care Corridor",
                area: "corridor",
                accentColor: "#245C52",
                highlights: ["Nurse Call Station", "Continuous Handrails"],
              },
              {
                id: "suite",
                title: "Patient Suite",
                description: "Private room with dedicated therapeutic care amenities, natural daylight, and en-suite facilities.",
                roomName: "Patient Suite",
                area: "room",
                accentColor: "#245C52",
                highlights: ["Private Bathroom", "Electric Hospital Bed", "Natural Lighting"],
              },
            ]),
      }),
    [initialConfig, facilityName],
  );

  const [committedSnapshot, setCommittedSnapshot] = useState(initialSnapshot);

  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
        tourTitle,
        globalAccentColor,
        patientRoomLabel,
        stops,
      }),
    [tourTitle, globalAccentColor, patientRoomLabel, stops],
  );

  const isDirty = currentSnapshot !== committedSnapshot;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  function handleRevert() {
    try {
      const parsed = JSON.parse(committedSnapshot);
      setTourTitle(parsed.tourTitle);
      setGlobalAccentColor(parsed.globalAccentColor);
      setPatientRoomLabel(parsed.patientRoomLabel);
      setStops(parsed.stops);
      setSaveSuccess(false);
      setError(null);
      toast.info("Reverted unsaved edits");
    } catch {
      // ignore
    }
  }

  function updateStop(index: number, updates: Partial<StopEditorItem>) {
    setStops((prev) => {
      const copy = [...prev];
      const existing = copy[index];
      const updated = { ...existing, ...updates };

      if (updates.area !== undefined && updates.roomName === undefined) {
        if (!updated.roomName || updated.roomName === roomNameFromArea(existing.area)) {
          updated.roomName = roomNameFromArea(updates.area);
        }
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
      toast.error("A walkthrough tour must have at least one stop");
      return;
    }
    setStops((prev) => prev.filter((_, i) => i !== index));
    setSaveSuccess(false);
    setError(null);
  }

  function addStop() {
    if (stops.length >= 12) {
      toast.error("Maximum 12 stops allowed per facility walkthrough");
      return;
    }
    const newIndex = stops.length + 1;
    const defaultArea: TourArea =
      newIndex % 3 === 1 ? "lobby" : newIndex % 3 === 2 ? "corridor" : "room";
    const newStop: StopEditorItem = {
      id: `stop-${Date.now()}-${newIndex}`,
      title: `Stop ${newIndex} - ${roomNameFromArea(defaultArea)}`,
      description: "",
      roomName: roomNameFromArea(defaultArea),
      area: defaultArea,
      accentColor: globalAccentColor,
      highlights: [],
    };
    setStops((prev) => [...prev, newStop]);
    setSaveSuccess(false);
    setError(null);
  }

  function addHighlight(stopIndex: number, text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const currentHighlights = stops[stopIndex]?.highlights ?? [];
    if (currentHighlights.includes(trimmed)) return;
    if (currentHighlights.length >= 6) {
      toast.error("Maximum 6 highlights per stop");
      return;
    }
    updateStop(stopIndex, {
      highlights: [...currentHighlights, trimmed],
    });
    setNewHighlightInputs((prev) => ({ ...prev, [stops[stopIndex].id]: "" }));
  }

  function removeHighlight(stopIndex: number, highlightIndex: number) {
    const current = stops[stopIndex]?.highlights ?? [];
    updateStop(stopIndex, {
      highlights: current.filter((_, i) => i !== highlightIndex),
    });
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
        roomName: patientRoomLabel.trim() || "Patient Suite",
        accentColor: globalAccentColor,
        wallColor: "#f4f7fb",
        floorColor: "#e6ebf1",
        stops: stops.map((s, idx) => ({
          id: s.id || `stop-${idx + 1}`,
          title: s.title.trim() || `Stop ${idx + 1}`,
          label: s.title.trim() || `Stop ${idx + 1}`,
          description: s.description.trim(),
          roomName: s.roomName.trim() || roomNameFromArea(s.area),
          area: s.area || areaFromRoomName(s.roomName),
          accentColor: s.accentColor || globalAccentColor,
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
      toast.success("3D tour configuration saved successfully");
      setCommittedSnapshot(currentSnapshot);
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
      {/* ── Status Banners ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#A33632]/20 bg-[#FAEEEB] p-4 text-xs sm:text-sm text-[#A33632]">
          <AlertCircle className="size-4 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {saveSuccess && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#C7D3CA] bg-[#DCE8DA]/60 p-4 text-xs sm:text-sm text-[#203E39]">
          <CheckCircle2 className="size-4 shrink-0 text-[#245C52]" />
          <p className="font-medium">
            Tour configuration saved successfully. Your changes are live in the 3D walkthrough experience.
          </p>
        </div>
      )}

      {/* ── 1. General Walkthrough Settings Card ── */}
      <Card className="rounded-2xl border border-[#DCE5DE] bg-white shadow-xs">
        <CardHeader className="border-b border-[#DCE5DE]/70 pb-4">
          <CardTitle className="font-serif text-xl font-medium text-[#0D1B17]">
            Walkthrough General Settings
          </CardTitle>
          <CardDescription className="text-xs text-[#53665E]">
            Greeting message, room terminology, and primary architectural accent colors.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tour-title" className="text-xs font-semibold text-[#0D1B17]">
                Welcome Heading
              </Label>
              <Input
                id="tour-title"
                value={tourTitle}
                onChange={(e) => {
                  setTourTitle(e.target.value);
                  setSaveSuccess(false);
                  setError(null);
                }}
                placeholder={`Welcome to ${facilityName}`}
                className="h-10 rounded-xl border-[#DCE5DE] bg-[#FAFBF8] text-xs sm:text-sm text-[#0D1B17] focus:border-[#245C52]"
                required
              />
              <p className="text-[11px] text-[#53665E]">
                Displayed in the overview banner when a visitor enters the 3D tour.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="room-label" className="text-xs font-semibold text-[#0D1B17]">
                Patient Room Custom Title
              </Label>
              <Input
                id="room-label"
                value={patientRoomLabel}
                onChange={(e) => {
                  setPatientRoomLabel(e.target.value);
                  setSaveSuccess(false);
                  setError(null);
                }}
                placeholder="e.g. Private Suite, Rehabilitation Room"
                className="h-10 rounded-xl border-[#DCE5DE] bg-[#FAFBF8] text-xs sm:text-sm text-[#0D1B17] focus:border-[#245C52]"
              />
              <p className="text-[11px] text-[#53665E]">
                Label shown on the top-down floor plan for residential rooms.
              </p>
            </div>
          </div>

          <Separator className="bg-[#DCE5DE]/70" />

          {/* Color Scheme Picker */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-[#0D1B17]">
              Primary Architectural Accent Color
            </Label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => {
                    setGlobalAccentColor(preset.value);
                    setSaveSuccess(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-all",
                    globalAccentColor.toLowerCase() === preset.value.toLowerCase()
                      ? "border-[#0D1B17] bg-[#EDF2EC] text-[#0D1B17] ring-1 ring-[#0D1B17]"
                      : "border-[#DCE5DE] bg-white text-[#53665E] hover:bg-[#FAFBF8]",
                  )}
                >
                  <span
                    className="size-3 rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: preset.value }}
                  />
                  {preset.label}
                </button>
              ))}

              <div className="flex items-center gap-2 ml-2">
                <input
                  type="color"
                  value={globalAccentColor}
                  onChange={(e) => {
                    setGlobalAccentColor(e.target.value);
                    setSaveSuccess(false);
                  }}
                  className="size-8 cursor-pointer rounded-lg border border-[#DCE5DE] bg-transparent p-0.5"
                  aria-label="Custom tour accent color"
                />
                <Input
                  value={globalAccentColor}
                  onChange={(e) => {
                    setGlobalAccentColor(e.target.value);
                    setSaveSuccess(false);
                  }}
                  className="h-8 w-24 font-mono text-xs uppercase rounded-lg border-[#DCE5DE]"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Tour Stops Sequence Manager ── */}
      <Card className="rounded-2xl border border-[#DCE5DE] bg-white shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#DCE5DE]/70 pb-4 gap-3">
          <div>
            <CardTitle className="font-serif text-xl font-medium text-[#0D1B17] flex items-center gap-2">
              <Layers className="size-4 text-[#245C52]" />
              Architectural Tour Stops ({stops.length}/12)
            </CardTitle>
            <CardDescription className="text-xs text-[#53665E]">
              Order and configure each step in the 3D walkthrough from reception to patient suites.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addStop}
            disabled={stops.length >= 12}
            className="rounded-full border-[#DCE5DE] text-xs font-semibold text-[#203E39] hover:bg-[#EDF2EC] gap-1.5 self-start sm:self-auto"
          >
            <Plus className="size-3.5 text-[#245C52]" />
            Add Walkthrough Stop
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          {stops.map((stop, index) => (
            <div
              key={stop.id}
              className="relative rounded-2xl border border-[#DCE5DE] bg-[#FAFBF8] p-5 transition-shadow hover:shadow-xs space-y-4"
            >
              {/* Header row with stop order controls */}
              <div className="flex items-center justify-between border-b border-[#DCE5DE]/80 pb-3">
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs"
                    style={{ backgroundColor: stop.accentColor || globalAccentColor }}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-serif text-base font-medium text-[#0D1B17]">
                      {stop.title.trim() ? stop.title : `Stop ${index + 1}`}
                    </h3>
                    <p className="text-xs text-[#53665E]">
                      {roomNameFromArea(stop.area)} &middot; {stop.roomName || roomNameFromArea(stop.area)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveStop(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move stop ${index + 1} up`}
                    title="Move stop earlier in walkthrough"
                    className="size-8 p-0 text-[#53665E] hover:text-[#0D1B17] hover:bg-[#EDF2EC] rounded-lg disabled:opacity-30"
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveStop(index, 1)}
                    disabled={index === stops.length - 1}
                    aria-label={`Move stop ${index + 1} down`}
                    title="Move stop later in walkthrough"
                    className="size-8 p-0 text-[#53665E] hover:text-[#0D1B17] hover:bg-[#EDF2EC] rounded-lg disabled:opacity-30"
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStop(index)}
                    disabled={stops.length <= 1}
                    aria-label={`Remove stop ${index + 1}`}
                    title={stops.length <= 1 ? "At least one stop required" : "Remove stop"}
                    className="size-8 p-0 text-[#A33632] hover:bg-[#FAEEEB] rounded-lg disabled:opacity-30"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Form Inputs Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Stop Title */}
                <div className="space-y-1.5">
                  <Label htmlFor={`stop-title-${stop.id}`} className="text-xs font-semibold text-[#0D1B17]">
                    Stop Heading
                  </Label>
                  <Input
                    id={`stop-title-${stop.id}`}
                    value={stop.title}
                    onChange={(e) => updateStop(index, { title: e.target.value })}
                    placeholder="e.g. Arrival & Family Welcome"
                    className="h-10 rounded-xl border-[#DCE5DE] bg-white text-xs sm:text-sm text-[#0D1B17] focus:border-[#245C52]"
                    required
                  />
                </div>

                {/* 3D Zone / Area Selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#0D1B17]">
                    3D Scene Zone
                  </Label>
                  <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                    {(
                      [
                        { area: "lobby", label: "Lobby" },
                        { area: "corridor", label: "Corridor" },
                        { area: "room", label: "Room" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.area}
                        type="button"
                        onClick={() => updateStop(index, { area: opt.area })}
                        className={cn(
                          "rounded-lg px-2 py-1.5 text-xs font-medium transition-all border text-center",
                          stop.area === opt.area
                            ? "bg-[#245C52] text-white border-[#245C52] shadow-xs"
                            : "bg-white text-[#53665E] border-[#DCE5DE] hover:bg-[#EDF2EC] hover:text-[#0D1B17]",
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Room Display Name */}
                <div className="space-y-1.5">
                  <Label htmlFor={`stop-room-${stop.id}`} className="text-xs font-semibold text-[#0D1B17]">
                    Specific Room / Station Name
                  </Label>
                  <Input
                    id={`stop-room-${stop.id}`}
                    value={stop.roomName}
                    onChange={(e) => updateStop(index, { roomName: e.target.value })}
                    placeholder="e.g. West Wing Nursing Station"
                    className="h-10 rounded-xl border-[#DCE5DE] bg-white text-xs sm:text-sm text-[#0D1B17] focus:border-[#245C52]"
                    required
                  />
                </div>

                {/* Stop Accent Color */}
                <div className="space-y-1.5">
                  <Label htmlFor={`stop-color-${stop.id}`} className="text-xs font-semibold text-[#0D1B17]">
                    Stop Marker Accent
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id={`stop-color-${stop.id}`}
                      value={stop.accentColor || globalAccentColor}
                      onChange={(e) => updateStop(index, { accentColor: e.target.value })}
                      className="size-9 cursor-pointer rounded-lg border border-[#DCE5DE] bg-white p-0.5"
                      aria-label="Color picker"
                    />
                    <Input
                      value={stop.accentColor || globalAccentColor}
                      onChange={(e) => updateStop(index, { accentColor: e.target.value })}
                      className="h-9 w-28 font-mono text-xs uppercase rounded-lg border-[#DCE5DE] bg-white"
                      maxLength={7}
                    />
                    <button
                      type="button"
                      onClick={() => updateStop(index, { accentColor: globalAccentColor })}
                      className="text-[11px] text-[#245C52] hover:underline"
                    >
                      Reset to default
                    </button>
                  </div>
                </div>

                {/* Description Textarea */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor={`stop-desc-${stop.id}`} className="text-xs font-semibold text-[#0D1B17]">
                    Clinical & Architectural Description
                  </Label>
                  <Textarea
                    id={`stop-desc-${stop.id}`}
                    value={stop.description}
                    onChange={(e) => updateStop(index, { description: e.target.value })}
                    placeholder="Describe this area's therapeutic equipment, comfort features, natural lighting, and safety amenities..."
                    rows={2}
                    className="rounded-xl border-[#DCE5DE] bg-white text-xs sm:text-sm text-[#0D1B17] focus:border-[#245C52] resize-y"
                  />
                </div>

                {/* Amenity Highlights Manager */}
                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-[#0D1B17]">
                      Amenity Highlights & Features ({stop.highlights?.length ?? 0}/6)
                    </Label>
                    <span className="text-[11px] text-[#53665E]">
                      Shown as interactive pills during the tour
                    </span>
                  </div>

                  {/* Active highlight chips */}
                  <div className="flex flex-wrap items-center gap-1.5 min-h-7">
                    {stop.highlights?.map((h, hIdx) => (
                      <span
                        key={hIdx}
                        className="inline-flex items-center gap-1 rounded-full bg-white border border-[#DCE5DE] px-2.5 py-0.5 text-xs text-[#203E39] shadow-2xs"
                      >
                        {h}
                        <button
                          type="button"
                          onClick={() => removeHighlight(index, hIdx)}
                          className="text-[#53665E] hover:text-[#A33632] ml-0.5"
                          aria-label={`Remove highlight ${h}`}
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                    {(!stop.highlights || stop.highlights.length === 0) && (
                      <span className="text-xs text-[#53665E] italic">
                        No highlights added yet. Select suggestions below or type a custom feature.
                      </span>
                    )}
                  </div>

                  {/* Add Custom Highlight Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      value={newHighlightInputs[stop.id] ?? ""}
                      onChange={(e) =>
                        setNewHighlightInputs((prev) => ({
                          ...prev,
                          [stop.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addHighlight(index, newHighlightInputs[stop.id] ?? "");
                        }
                      }}
                      placeholder="Add amenity (e.g. 24/7 Monitoring, Low-Threshold Shower)"
                      className="h-8 text-xs rounded-lg border-[#DCE5DE] bg-white max-w-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addHighlight(index, newHighlightInputs[stop.id] ?? "")}
                      className="h-8 rounded-lg border-[#DCE5DE] text-xs font-medium text-[#203E39] hover:bg-[#EDF2EC]"
                    >
                      Add Tag
                    </Button>
                  </div>

                  {/* Suggested chips for current area */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-medium text-[#53665E]">Suggested:</span>
                    {SUGGESTED_HIGHLIGHTS[stop.area]
                      .filter((s) => !stop.highlights?.includes(s))
                      .map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => addHighlight(index, suggestion)}
                          className="rounded-full bg-[#EDF2EC] hover:bg-[#DCE8DA] text-[#203E39] text-[10px] font-medium px-2 py-0.5 transition-colors"
                        >
                          + {suggestion}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {stops.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#DCE5DE] bg-[#FAFBF8] p-8 text-center">
              <p className="text-xs sm:text-sm text-[#53665E]">No walkthrough stops configured yet.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addStop}
                className="mt-3 rounded-full border-[#DCE5DE] text-xs font-semibold text-[#203E39] hover:bg-[#EDF2EC]"
              >
                <Plus className="mr-1.5 size-3.5" />
                Add First Stop
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 3. Sticky Save & Action Status Bar ── */}
      <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#DCE5DE] bg-white/95 p-4 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          {isDirty ? (
            <Badge className="border-[#C05621]/30 bg-[#C05621]/10 text-[#C05621] rounded-full text-xs px-3 py-1 font-semibold">
              <span className="size-1.5 rounded-full bg-[#C05621] mr-1.5" />
              Unsaved changes
            </Badge>
          ) : (
            <Badge className="border-[#C7D3CA] bg-[#DCE8DA]/60 text-[#203E39] rounded-full text-xs px-3 py-1 font-semibold">
              <CheckCircle2 className="size-3.5 mr-1 text-[#245C52]" />
              All changes saved
            </Badge>
          )}

          {isDirty && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRevert}
              className="text-xs text-[#53665E] hover:text-[#0D1B17] h-8 gap-1"
            >
              <Undo2 className="size-3.5" />
              Discard edits
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push(`/facilities/${facilityId}/tour`)}
            className="rounded-full border-[#DCE5DE] text-xs font-semibold text-[#203E39] hover:bg-[#FAFBF8] h-9 px-4"
          >
            <Rotate3d className="mr-1.5 size-3.5 text-[#245C52]" />
            Preview Tour
          </Button>

          <Button
            type="submit"
            disabled={saving || !isDirty}
            className="rounded-full bg-[#245C52] hover:bg-[#19473F] text-white text-xs font-semibold h-9 px-5 transition-all duration-200 active:scale-[0.98] shadow-xs disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 size-3.5 animate-spin" />
                Saving Tour...
              </>
            ) : (
              "Save Tour Configuration"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
