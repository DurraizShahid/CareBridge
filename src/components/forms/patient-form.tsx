"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  Patient,
  PatientStatus,
  CareLevel,
  Address,
  Contact,
  Insurance,
  PatientDocument,
} from "@/types";
import { PatientDocumentUpload } from "@/components/media/patient-document-upload";

interface PatientFormData {
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  gender: "male" | "female" | "other";
  address: Address;
  phone: string;
  emergencyContact: Contact;
  insurance: Insurance[];
  primaryDiagnosis: string;
  secondaryDiagnoses: string[];
  careLevelRequired: CareLevel;
  notes: string;
  socialWorkerId: string;
  hospitalId: string;
  admissionDate: string;
  estimatedDischargeDate: string;
  status: PatientStatus;
}

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const STATUSES: { value: PatientStatus; label: string }[] = [
  { value: "admitted", label: "Admitted" },
  { value: "assessment-in-progress", label: "Assessment In Progress" },
  { value: "ready-for-discharge", label: "Ready for Discharge" },
  { value: "placed", label: "Placed" },
  { value: "discharged", label: "Discharged" },
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

function emptyForm(): PatientFormData {
  return {
    mrn: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    age: 0,
    gender: "male",
    address: { street: "", city: "", state: "", zipCode: "" },
    phone: "",
    emergencyContact: { name: "", role: "", phone: "", email: "" },
    insurance: [],
    primaryDiagnosis: "",
    secondaryDiagnoses: [],
    careLevelRequired: "skilled-nursing",
    notes: "",
    socialWorkerId: "",
    hospitalId: "",
    admissionDate: new Date().toISOString().split("T")[0],
    estimatedDischargeDate: "",
    status: "admitted",
  };
}

function patientToFormData(p: Patient): PatientFormData {
  return {
    mrn: p.mrn,
    firstName: p.firstName,
    lastName: p.lastName,
    dateOfBirth: p.dateOfBirth.split("T")[0],
    age: p.age,
    gender: p.gender,
    address: p.address,
    phone: p.phone,
    emergencyContact: p.emergencyContact,
    insurance: p.insurance,
    primaryDiagnosis: p.primaryDiagnosis,
    secondaryDiagnoses: p.secondaryDiagnoses,
    careLevelRequired: p.careLevelRequired,
    notes: p.notes,
    socialWorkerId: p.socialWorkerId,
    hospitalId: p.hospitalId,
    admissionDate: p.admissionDate.split("T")[0],
    estimatedDischargeDate: p.estimatedDischargeDate
      ? p.estimatedDischargeDate.split("T")[0]
      : "",
    status: p.status,
  };
}

interface Props {
  initialData?: Patient;
  patientId?: string;
  initialDocuments?: PatientDocument[];
}

export function PatientForm({ initialData, patientId, initialDocuments }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<PatientFormData>(
    initialData ? patientToFormData(initialData) : emptyForm(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tagInput, setTagInput] = useState("");

  const isEditing = !!patientId;

  function update<K extends keyof PatientFormData>(
    key: K,
    value: PatientFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = isEditing ? `/api/patients/${patientId}` : "/api/patients";
      const method = isEditing ? "PATCH" : "POST";

      const body = {
        ...form,
        estimatedDischargeDate: form.estimatedDischargeDate || null,
        dateOfBirth: new Date(form.dateOfBirth).toISOString(),
        admissionDate: new Date(form.admissionDate).toISOString(),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to save patient");
        return;
      }

      router.push(`/patients/${data.id}`);
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
          <CardTitle>Demographics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="mrn">MRN</Label>
              <Input
                id="mrn"
                value={form.mrn}
                onChange={(e) => update("mrn", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => {
                  const dob = e.target.value;
                  const age = dob
                    ? Math.floor(
                        (Date.now() - new Date(dob).getTime()) /
                          (365.25 * 24 * 60 * 60 * 1000),
                      )
                    : 0;
                  setForm((prev) => ({
                    ...prev,
                    dateOfBirth: dob,
                    age,
                  }));
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" value={form.age} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={form.gender}
                onValueChange={(value) => update("gender", value as Patient["gender"])}
              >
                <SelectTrigger id="gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ec-name">Name</Label>
              <Input
                id="ec-name"
                value={form.emergencyContact.name}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    emergencyContact: {
                      ...prev.emergencyContact,
                      name: e.target.value,
                    },
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ec-role">Relationship</Label>
              <Input
                id="ec-role"
                value={form.emergencyContact.role}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    emergencyContact: {
                      ...prev.emergencyContact,
                      role: e.target.value,
                    },
                  }))
                }
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ec-phone">Phone</Label>
              <Input
                id="ec-phone"
                value={form.emergencyContact.phone}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    emergencyContact: {
                      ...prev.emergencyContact,
                      phone: e.target.value,
                    },
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ec-email">Email</Label>
              <Input
                id="ec-email"
                type="email"
                value={form.emergencyContact.email}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    emergencyContact: {
                      ...prev.emergencyContact,
                      email: e.target.value,
                    },
                  }))
                }
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Medical Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="primaryDiagnosis">Primary Diagnosis</Label>
            <Input
              id="primaryDiagnosis"
              value={form.primaryDiagnosis}
              onChange={(e) => update("primaryDiagnosis", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Secondary Diagnoses</Label>
            <div className="flex flex-wrap gap-1.5">
              {form.secondaryDiagnoses.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
                >
                  {d}
                  <button
                    type="button"
                    onClick={() =>
                      update(
                        "secondaryDiagnoses",
                        form.secondaryDiagnoses.filter((v) => v !== d),
                      )
                    }
                    className="text-muted-foreground hover:text-foreground"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add diagnosis..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (tagInput.trim()) {
                      update("secondaryDiagnoses", [
                        ...form.secondaryDiagnoses,
                        tagInput.trim(),
                      ]);
                      setTagInput("");
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (tagInput.trim()) {
                    update("secondaryDiagnoses", [
                      ...form.secondaryDiagnoses,
                      tagInput.trim(),
                    ]);
                    setTagInput("");
                  }
                }}
              >
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="careLevelRequired">Care Level Required</Label>
            <Select
              value={form.careLevelRequired}
              onValueChange={(v) => update("careLevelRequired", v as CareLevel)}
            >
              <SelectTrigger id="careLevelRequired">
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
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => update("status", v as PatientStatus)}
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
              <Label htmlFor="admissionDate">Admission Date</Label>
              <Input
                id="admissionDate"
                type="date"
                value={form.admissionDate}
                onChange={(e) => update("admissionDate", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedDischargeDate">
                Est. Discharge Date
              </Label>
              <Input
                id="estimatedDischargeDate"
                type="date"
                value={form.estimatedDischargeDate}
                onChange={(e) =>
                  update("estimatedDischargeDate", e.target.value)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {patientId && (
        <PatientDocumentUpload patientId={patientId} initialDocuments={initialDocuments} />
      )}

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
          {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Patient"}
        </ShimmerButton>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/patients")}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
