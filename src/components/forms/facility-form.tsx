"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FacilityMediaUpload } from "@/components/media/facility-media-upload";
import type {
  Facility,
  FacilityType,
  CareLevel,
  Address,
  Contact,
} from "@/types";

interface FacilityFormData {
  name: string;
  type: FacilityType;
  address: Address;
  phone: string;
  email: string;
  website: string;
  contacts: Contact[];
  licensure: string[];
  accreditations: string[];
  capacity: number;
  currentOccupancy: number;
  insuranceAccepted: string[];
  careLevelsOffered: CareLevel[];
  specialties: string[];
  rating: number;
  reviewsCount: number;
  hasAvailability: boolean;
  waitlistDays: number;
  acceptsMedicare: boolean;
  acceptsMedicaid: boolean;
}

type TagField =
  | "licensure"
  | "accreditations"
  | "insuranceAccepted"
  | "careLevelsOffered"
  | "specialties";

const FACILITY_TYPES: { value: FacilityType; label: string }[] = [
  { value: "skilled-nursing-facility", label: "Skilled Nursing Facility" },
  { value: "rehabilitation-center", label: "Rehabilitation Center" },
  { value: "assisted-living", label: "Assisted Living" },
  { value: "long-term-care", label: "Long-Term Care" },
  { value: "home-health-agency", label: "Home Health Agency" },
  { value: "hospice", label: "Hospice" },
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

function emptyForm(): FacilityFormData {
  return {
    name: "",
    type: "skilled-nursing-facility",
    address: { street: "", city: "", state: "", zipCode: "" },
    phone: "",
    email: "",
    website: "",
    contacts: [],
    licensure: [],
    accreditations: [],
    capacity: 100,
    currentOccupancy: 0,
    insuranceAccepted: [],
    careLevelsOffered: [],
    specialties: [],
    rating: 0,
    reviewsCount: 0,
    hasAvailability: true,
    waitlistDays: 0,
    acceptsMedicare: true,
    acceptsMedicaid: false,
  };
}

function facilityToFormData(facility: Facility): FacilityFormData {
  return {
    name: facility.name,
    type: facility.type,
    address: facility.address,
    phone: facility.phone,
    email: facility.email,
    website: facility.website ?? "",
    contacts: facility.contacts,
    licensure: facility.licensure,
    accreditations: facility.accreditations,
    capacity: facility.capacity,
    currentOccupancy: facility.currentOccupancy,
    insuranceAccepted: facility.insuranceAccepted,
    careLevelsOffered: facility.careLevelsOffered,
    specialties: facility.specialties,
    rating: facility.rating,
    reviewsCount: facility.reviewsCount,
    hasAvailability: facility.hasAvailability,
    waitlistDays: facility.waitlistDays ?? 0,
    acceptsMedicare: facility.acceptsMedicare,
    acceptsMedicaid: facility.acceptsMedicaid,
  };
}

interface Props {
  initialData?: Facility;
  facilityId?: string;
}

export function FacilityForm({ initialData, facilityId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FacilityFormData>(
    initialData ? facilityToFormData(initialData) : emptyForm(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tagInput, setTagInput] = useState<Record<string, string>>({});

  const isEditing = !!facilityId;

  function update<K extends keyof FacilityFormData>(
    key: K,
    value: FacilityFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateTagField(field: TagField, value: FacilityFormData[TagField]) {
    update(field, value);
  }

  function addTag(field: TagField, value: string) {
    if (!value.trim()) return;
    const arr = form[field] as string[];
    if (!arr.includes(value.trim())) {
      updateTagField(field, [...arr, value.trim()]);
    }
    setTagInput((prev) => ({ ...prev, [field]: "" }));
  }

  function removeTag(field: TagField, value: string) {
    const arr = form[field] as string[];
    updateTagField(field, arr.filter((v) => v !== value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = isEditing
        ? `/api/facilities/${facilityId}`
        : "/api/facilities";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          waitlistDays: form.waitlistDays || null,
          website: form.website || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to save facility");
        return;
      }

      router.push(`/facilities/${data.id}`);
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

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Facility Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => update("type", v as FacilityType)}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FACILITY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />
          <h4 className="text-sm font-medium">Address</h4>
          <div className="space-y-2">
            <Label htmlFor="street">Street</Label>
            <Input
              id="street"
              value={form.address.street}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  address: { ...prev.address, street: e.target.value },
                }))
              }
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.address.city}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    address: { ...prev.address, city: e.target.value },
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={form.address.state}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    address: { ...prev.address, state: e.target.value },
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                value={form.address.zipCode}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    address: { ...prev.address, zipCode: e.target.value },
                  }))
                }
                required
              />
            </div>
          </div>

          <Separator />
          <h4 className="text-sm font-medium">Contact</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={form.website}
              onChange={(e) => update("website", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Capacity */}
      <Card>
        <CardHeader>
          <CardTitle>Capacity & Occupancy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="capacity">Total Capacity (beds)</Label>
              <Input
                id="capacity"
                type="number"
                min={0}
                value={form.capacity}
                onChange={(e) => update("capacity", Number(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentOccupancy">
                Current Occupancy (beds)
              </Label>
              <Input
                id="currentOccupancy"
                type="number"
                min={0}
                value={form.currentOccupancy}
                onChange={(e) =>
                  update("currentOccupancy", Number(e.target.value))
                }
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="waitlistDays">Waitlist (days)</Label>
              <Input
                id="waitlistDays"
                type="number"
                min={0}
                value={form.waitlistDays}
                onChange={(e) =>
                  update("waitlistDays", Number(e.target.value))
                }
              />
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 pb-2">
                <input
                  type="checkbox"
                  checked={form.hasAvailability}
                  onChange={(e) =>
                    update("hasAvailability", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm">Has Availability</span>
              </label>
              <label className="flex items-center gap-2 pb-2">
                <input
                  type="checkbox"
                  checked={form.acceptsMedicare}
                  onChange={(e) =>
                    update("acceptsMedicare", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm">Accepts Medicare</span>
              </label>
              <label className="flex items-center gap-2 pb-2">
                <input
                  type="checkbox"
                  checked={form.acceptsMedicaid}
                  onChange={(e) =>
                    update("acceptsMedicaid", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm">Accepts Medicaid</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags sections */}
      <Card>
        <CardHeader>
          <CardTitle>Licensure & Accreditations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TagInput
            label="Licensure"
            items={form.licensure}
            inputValue={tagInput["licensure"] ?? ""}
            onInputChange={(v) =>
              setTagInput((prev) => ({ ...prev, licensure: v }))
            }
            onAdd={(v) => addTag("licensure", v)}
            onRemove={(v) => removeTag("licensure", v)}
          />
          <TagInput
            label="Accreditations"
            items={form.accreditations}
            inputValue={tagInput["accreditations"] ?? ""}
            onInputChange={(v) =>
              setTagInput((prev) => ({ ...prev, accreditations: v }))
            }
            onAdd={(v) => addTag("accreditations", v)}
            onRemove={(v) => removeTag("accreditations", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Services & Insurance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Care Levels Offered</Label>
            <div className="flex flex-wrap gap-2">
              {CARE_LEVELS.map((cl) => {
                const selected = form.careLevelsOffered.includes(cl.value);
                return (
                  <button
                    key={cl.value}
                    type="button"
                    onClick={() => {
                      if (selected) {
                        update(
                          "careLevelsOffered",
                          form.careLevelsOffered.filter((v) => v !== cl.value),
                        );
                      } else {
                        update("careLevelsOffered", [
                          ...form.careLevelsOffered,
                          cl.value,
                        ]);
                      }
                    }}
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selected
                        ? "bg-health text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {cl.label}
                  </button>
                );
              })}
            </div>
          </div>

          <TagInput
            label="Insurance Accepted"
            items={form.insuranceAccepted}
            inputValue={tagInput["insuranceAccepted"] ?? ""}
            onInputChange={(v) =>
              setTagInput((prev) => ({ ...prev, insuranceAccepted: v }))
            }
            onAdd={(v) => addTag("insuranceAccepted", v)}
            onRemove={(v) => removeTag("insuranceAccepted", v)}
          />

          <TagInput
            label="Specialties"
            items={form.specialties}
            inputValue={tagInput["specialties"] ?? ""}
            onInputChange={(v) =>
              setTagInput((prev) => ({ ...prev, specialties: v }))
            }
            onAdd={(v) => addTag("specialties", v)}
            onRemove={(v) => removeTag("specialties", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ratings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rating">Rating (1-5)</Label>
              <Input
                id="rating"
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={form.rating}
                onChange={(e) => update("rating", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reviewsCount">Review Count</Label>
              <Input
                id="reviewsCount"
                type="number"
                min={0}
                value={form.reviewsCount}
                onChange={(e) =>
                  update("reviewsCount", Number(e.target.value))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {facilityId && (
        <FacilityMediaUpload facilityId={facilityId} initialMedia={initialData?.media} />
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Facility"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/facilities")}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function TagInput({
  label,
  items,
  inputValue,
  onInputChange,
  onAdd,
  onRemove,
}: {
  label: string;
  items: string[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
          >
            {item}
            <button
              type="button"
              onClick={() => onRemove(item)}
              className="text-muted-foreground hover:text-foreground"
            >
              &times;
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={`Add ${label.toLowerCase()}...`}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd(inputValue);
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onAdd(inputValue)}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
