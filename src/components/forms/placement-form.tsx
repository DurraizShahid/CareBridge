"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Placement, PlacementStatus, CareLevel, Patient, Facility, User } from "@/types";

interface PlacementFormData {
  patientId: string;
  socialWorkerId: string;
  status: PlacementStatus;
  careLevel: CareLevel;
  priority: "low" | "medium" | "high" | "emergency";
  assessmentNotes: string;
  preferredLocationCity: string;
  preferredLocationState: string;
  preferredLocationMaxDistance: number;
  selectedFacilityId: string;
  insurancePreAuthorized: boolean;
  estimatedCost: string;
  startDate: string;
  completedDate: string;
  cancellationReason: string;
  notes: string;
}

const STATUSES: { value: PlacementStatus; label: string }[] = [
  { value: "assessment", label: "Assessment" },
  { value: "searching", label: "Searching" },
  { value: "matching", label: "Matching" },
  { value: "pending-approval", label: "Pending Approval" },
  { value: "approved", label: "Approved" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const CARE_LEVELS: { value: CareLevel; label: string }[] = [
  { value: "independent-living", label: "Independent Living" },
  { value: "assisted-living", label: "Assisted Living" },
  { value: "skilled-nursing", label: "Skilled Nursing" },
  { value: "long-term-care", label: "Long Term Care" },
  { value: "rehabilitation", label: "Rehabilitation" },
  { value: "home-health", label: "Home Health" },
  { value: "hospice", label: "Hospice" },
  { value: "memory-care", label: "Memory Care" },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "emergency", label: "Emergency" },
];

const NO_SELECTED_FACILITY = "none";

function emptyForm(): PlacementFormData {
  return {
    patientId: "",
    socialWorkerId: "",
    status: "assessment",
    careLevel: "skilled-nursing",
    priority: "medium",
    assessmentNotes: "",
    preferredLocationCity: "",
    preferredLocationState: "",
    preferredLocationMaxDistance: 50,
    selectedFacilityId: "",
    insurancePreAuthorized: false,
    estimatedCost: "",
    startDate: "",
    completedDate: "",
    cancellationReason: "",
    notes: "",
  };
}

function placementToFormData(p: Placement): PlacementFormData {
  return {
    patientId: p.patientId,
    socialWorkerId: p.socialWorkerId,
    status: p.status,
    careLevel: p.careLevel,
    priority: p.priority,
    assessmentNotes: p.assessmentNotes ?? "",
    preferredLocationCity: p.preferredLocation?.city ?? "",
    preferredLocationState: p.preferredLocation?.state ?? "",
    preferredLocationMaxDistance: p.preferredLocation?.maxDistanceMiles ?? 50,
    selectedFacilityId: p.selectedFacilityId ?? p.facilityId ?? "",
    insurancePreAuthorized: p.insurancePreAuthorized,
    estimatedCost: p.estimatedCost?.toString() ?? "",
    startDate: p.startDate ? p.startDate.split("T")[0] : "",
    completedDate: p.completedDate ? p.completedDate.split("T")[0] : "",
    cancellationReason: p.cancellationReason ?? "",
    notes: p.notes,
  };
}

interface Props {
  initialData?: Placement;
  placementId?: string;
  patients: Patient[];
  facilities: Facility[];
  socialWorkers: User[];
}

export function PlacementForm({ initialData, placementId, patients, facilities, socialWorkers }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<PlacementFormData>(
    initialData ? placementToFormData(initialData) : emptyForm(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!placementId;

  function update<K extends keyof PlacementFormData>(
    key: K,
    value: PlacementFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = isEditing ? `/api/placements/${placementId}` : "/api/placements";
      const method = isEditing ? "PATCH" : "POST";

      const body: Record<string, unknown> = {
        ...form,
        selectedFacilityId: form.selectedFacilityId || null,
        estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : null,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        completedDate: form.completedDate ? new Date(form.completedDate).toISOString() : null,
        preferredLocation:
          form.preferredLocationCity || form.preferredLocationState
            ? {
                city: form.preferredLocationCity,
                state: form.preferredLocationState,
                maxDistanceMiles: form.preferredLocationMaxDistance,
              }
            : null,
      };
      delete body.preferredLocationCity;
      delete body.preferredLocationState;
      delete body.preferredLocationMaxDistance;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to save placement");
        return;
      }

      router.push(`/placements/${data.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Placement Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="patientId">Patient</Label>
              <Select
                value={form.patientId}
                onValueChange={(v) => v !== null && update("patientId", v as string)}
              >
                <SelectTrigger id="patientId">
                  <SelectValue placeholder="Select patient..." />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="socialWorkerId">Social Worker</Label>
              <Select
                value={form.socialWorkerId}
                onValueChange={(v) => v !== null && update("socialWorkerId", v as string)}
              >
                <SelectTrigger id="socialWorkerId">
                  <SelectValue placeholder="Assign social worker..." />
                </SelectTrigger>
                <SelectContent>
                  {socialWorkers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => update("status", v as PlacementStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="careLevel">Care Level</Label>
              <Select
                value={form.careLevel}
                onValueChange={(v) => update("careLevel", v as CareLevel)}
              >
                <SelectTrigger id="careLevel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CARE_LEVELS.map((cl) => (
                    <SelectItem key={cl.value} value={cl.value}>
                      {cl.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(value) =>
                  update("priority", value as Placement["priority"])
                }
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((pr) => (
                    <SelectItem key={pr.value} value={pr.value}>
                      {pr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="selectedFacilityId">Preferred Facility</Label>
            <Select
              value={form.selectedFacilityId || NO_SELECTED_FACILITY}
              onValueChange={(v) => {
                if (v !== null) update("selectedFacilityId", v === NO_SELECTED_FACILITY ? "" : v);
              }}
            >
              <SelectTrigger id="selectedFacilityId">
                <SelectValue placeholder="Assign facility..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SELECTED_FACILITY}>None (TBD)</SelectItem>
                {facilities.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="insurancePreAuthorized"
              checked={form.insurancePreAuthorized}
              onCheckedChange={(v) => update("insurancePreAuthorized", v === true)}
            />
            <Label htmlFor="insurancePreAuthorized" className="cursor-pointer">
              Insurance Pre-Authorized
            </Label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="estimatedCost">Estimated Cost ($)</Label>
              <Input
                id="estimatedCost"
                type="number"
                min={0}
                value={form.estimatedCost}
                onChange={(e) => update("estimatedCost", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => update("startDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="completedDate">Completed Date</Label>
              <Input
                id="completedDate"
                type="date"
                value={form.completedDate}
                onChange={(e) => update("completedDate", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferred Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="prefCity">City</Label>
              <Input
                id="prefCity"
                value={form.preferredLocationCity}
                onChange={(e) => update("preferredLocationCity", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prefState">State</Label>
              <Input
                id="prefState"
                value={form.preferredLocationState}
                onChange={(e) => update("preferredLocationState", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prefMaxDistance">Max Distance (miles)</Label>
              <Input
                id="prefMaxDistance"
                type="number"
                min={0}
                value={form.preferredLocationMaxDistance}
                onChange={(e) => update("preferredLocationMaxDistance", Number(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assessmentNotes">Assessment Notes</Label>
            <Textarea
              id="assessmentNotes"
              value={form.assessmentNotes}
              onChange={(e) => update("assessmentNotes", e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">General Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
            />
          </div>
          {form.status === "cancelled" && (
            <div className="space-y-2">
              <Label htmlFor="cancellationReason">Cancellation Reason</Label>
              <Textarea
                id="cancellationReason"
                value={form.cancellationReason}
                onChange={(e) => update("cancellationReason", e.target.value)}
                rows={2}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex items-center gap-3">
        <ShimmerButton
          type="submit"
          disabled={saving}
          shimmerColor="#ffffff"
          shimmerSize="0.05em"
          shimmerDuration="3s"
          borderRadius="12px"
          background="rgba(68, 190, 175, 1)"
        >
          {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Placement"}
        </ShimmerButton>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/placements")}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
