"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Bed,
  CheckCircle2,
  FileText,
  User,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const CARE_LEVELS = [
  "skilled_nursing",
  "assisted_living",
  "memory_care",
  "long_term_care",
  "rehabilitation",
  "home_health",
  "hospice",
  "independent_living",
];

const label = (v: string) =>
  v.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

type Candidate = {
  id: string;
  name: string;
  availableBeds: number;
  specialties: string[];
};

export function NewReferralForm() {
  const router = useRouter();
  const [patientName, setPatientName] = useState("");
  const [patientMrn, setPatientMrn] = useState("");
  const [dob, setDob] = useState("");
  const [careLevel, setCareLevel] = useState("skilled_nursing");
  const [serviceText, setServiceText] = useState("");
  const [facilityId, setFacilityId] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const services = serviceText
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ careLevel });
    for (const service of services) query.append("service", service);

    fetch("/api/referrals/facilities?" + query.toString(), { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Unable to match facilities");
        return r.json();
      })
      .then((data: Candidate[]) => {
        if (active) {
          setCandidates(data);
          setFacilityId((old) => (data.some((x) => x.id === old) ? old : ""));
          setError("");
        }
      })
      .catch(() => {
        if (active) {
          setCandidates([]);
          setError("Facility matching is currently unavailable.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [careLevel, serviceText]);

  async function submit(status: "draft" | "sent") {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName,
          patientMrn,
          patientDateOfBirth: dob,
          careLevel,
          requiredServices: services,
          facilityId,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to create referral");
      router.push("/referrals/" + data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create referral");
      setBusy(false);
    }
  }

  const inputClass =
    "h-11 w-full rounded-xl border border-[#DCE5DE] bg-[#FAFBF8] px-3.5 text-sm text-[#0D1B17] outline-none transition-colors placeholder:text-[#53665E]/70 focus:border-[#245C52] focus:bg-white focus:ring-2 focus:ring-[#245C52]/10";

  return (
    <div className="space-y-8 pb-10 max-w-4xl">
      <PageHeader
        title="Create Patient Referral"
        description="Submit clinical care specifications and request admission into certified network facilities."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Referrals", href: "/referrals" },
          { label: "New Referral" },
        ]}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit("sent");
        }}
        className="space-y-6"
      >
        {/* Section 1: Patient Essentials */}
        <div className="rounded-2xl border border-[#DCE5DE] bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-[#DCE5DE]/60 pb-3">
            <User className="size-4 text-[#245C52]" />
            <h2 className="font-serif text-lg font-medium text-[#0D1B17]">
              Patient Demographics & Medical Identification
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#53665E]">
                Patient Full Legal Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                maxLength={160}
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className={inputClass}
                placeholder="e.g. Eleanor Vance"
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#53665E]">
                Medical Record Number (MRN) <span className="text-red-500">*</span>
              </label>
              <input
                required
                maxLength={80}
                value={patientMrn}
                onChange={(e) => setPatientMrn(e.target.value)}
                className={inputClass}
                placeholder="e.g. MRN-849201"
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#53665E]">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#53665E]">
                Required Care Level <span className="text-red-500">*</span>
              </label>
              <select
                value={careLevel}
                onChange={(e) => setCareLevel(e.target.value)}
                className={inputClass}
              >
                {CARE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {label(level)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-semibold text-[#53665E]">
              Required Clinical Services{" "}
              <span className="font-normal text-[#53665E]/80">
                (Optional, comma-separated e.g. wound care, physical therapy, IV antibiotics)
              </span>
            </label>
            <input
              value={serviceText}
              onChange={(e) => setServiceText(e.target.value)}
              className={inputClass}
              placeholder="e.g. tracheostomy, physical therapy, memory care"
              maxLength={400}
            />
          </div>
        </div>

        {/* Section 2: Matched Network Facilities */}
        <div className="rounded-2xl border border-[#DCE5DE] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#DCE5DE]/60 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-[#245C52]" />
              <h2 className="font-serif text-lg font-medium text-[#0D1B17]">
                Eligible Network Facilities
              </h2>
            </div>
            <span className="text-xs text-[#53665E]">
              Filtered by care level & open capacity
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-[#53665E]">
              Verifying real-time bed census and specialty requirements...
            </div>
          ) : candidates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#DCE5DE] bg-[#FAFBF8] p-6 text-center space-y-1 text-xs text-[#53665E]">
              <p className="font-semibold text-[#0D1B17]">
                No available facilities match these clinical criteria.
              </p>
              <p>
                Try broadening the required services or selecting an alternate care setting.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {candidates.map((c) => {
                const isSelected = facilityId === c.id;
                return (
                  <label
                    key={c.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl p-4 transition-all border",
                      isSelected
                        ? "bg-[#EDF2EC] border-[#245C52] ring-2 ring-[#245C52]/20"
                        : "bg-[#FAFBF8] border-[#DCE5DE] hover:bg-[#EDF2EC]/40"
                    )}
                  >
                    <input
                      type="radio"
                      name="facilityId"
                      checked={isSelected}
                      onChange={() => setFacilityId(c.id)}
                      className="mt-1 accent-[#245C52]"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-serif text-sm font-medium text-[#0D1B17]">
                          {c.name}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-white border border-[#DCE5DE] text-[#245C52]">
                          <Bed className="size-3" />
                          {c.availableBeds} open
                        </span>
                      </div>
                      {c.specialties && c.specialties.length > 0 && (
                        <p className="text-[11px] text-[#53665E] truncate">
                          {c.specialties.slice(0, 3).join(", ")}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
            {error}
          </div>
        )}

        {/* Submission Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy || !facilityId}
            onClick={() => void submit("draft")}
            className="rounded-full border-[#DCE5DE] px-5 text-xs font-semibold text-[#203E39] hover:bg-[#EDF2EC]"
          >
            Save as Draft
          </Button>
          <Button
            type="submit"
            disabled={busy || !facilityId}
            className="rounded-full bg-[#245C52] px-6 text-xs font-semibold text-white hover:bg-[#19473F] active:scale-[0.98] shadow-xs gap-1.5"
          >
            {busy ? "Submitting..." : "Send Referral"}
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </form>
    </div>
  );
}