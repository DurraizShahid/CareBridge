import { notFound } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Star,
  MapPin,
  Building2,
  ArrowRight,
  Rotate3d,
  Sparkles,
  ShieldCheck,
  Bed,
} from "lucide-react";
import { getPatient, getPatientFacilityMatches } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import type { FacilityMatchResult } from "@/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

const CARE_LEVEL_LABELS: Record<string, string> = {
  "independent-living": "Independent Living",
  "assisted-living": "Assisted Living",
  "skilled-nursing": "Skilled Nursing",
  "long-term-care": "Long Term Care",
  rehabilitation: "Rehabilitation",
  "home-health": "Home Health",
  hospice: "Hospice",
  "memory-care": "Memory Care",
};

const STATUS_LABELS: Record<string, string> = {
  admitted: "Admitted",
  "assessment-in-progress": "Assessment In Progress",
  "ready-for-discharge": "Ready for Discharge",
  placed: "Placed",
  discharged: "Discharged",
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-[#EDF2EC] text-[#245C52] border-[#DCE5DE]"
      : score >= 60
      ? "bg-[#FFF4E5] text-[#9A5B00] border-[#FFE2BF]"
      : "bg-[#FAEEEB] text-[#A33632] border-[#F2D6D0]";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${color}`}
    >
      <Sparkles className="size-3" />
      {score} pts
    </span>
  );
}

function MatchFactor({
  ok,
  label,
  detail,
}: {
  ok: boolean;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs md:text-sm">
      {ok ? (
        <CheckCircle2 className="size-4 shrink-0 text-[#245C52]" />
      ) : (
        <XCircle className="size-4 shrink-0 text-[#A33632]" />
      )}
      <span className="font-semibold text-[#203E39]">{label}:</span>
      <span className="text-[#53665E]">{detail}</span>
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  if (value === 0) return null;
  const display = value > 0 ? `+${value}` : `${value}`;
  const color = value > 0 ? "text-[#245C52]" : "text-[#A33632]";
  return (
    <div className="flex items-center justify-between text-xs md:text-sm">
      <span className="text-[#53665E]">{label}</span>
      <span className={`font-mono font-semibold ${color}`}>{display}</span>
    </div>
  );
}

function FacilityMatchCard({
  result,
  patientId,
}: {
  result: FacilityMatchResult;
  patientId: string;
}) {
  const { facility, breakdown } = result;
  const availableBeds = Math.max(0, facility.capacity - facility.currentOccupancy);

  return (
    <div className="rounded-2xl border border-[#DCE5DE] bg-white p-6 shadow-xs transition-all hover:border-[#245C52]/40">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-[#DCE5DE]/60">
        <div>
          <h3 className="font-serif text-lg md:text-xl font-medium text-[#0D1B17]">
            <Link
              href={`/facilities/${facility.id}`}
              className="hover:text-[#245C52] transition-colors"
            >
              {facility.name}
            </Link>
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#53665E]">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#FAFBF8] border border-[#DCE5DE] font-medium text-[#203E39]">
              {facility.type.replace(/[-_]/g, " ")}
            </span>
            <span className="flex items-center gap-1 font-semibold text-[#203E39]">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              {facility.rating} ({facility.reviewsCount})
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5 text-[#53665E]" />
              {facility.address.city}, {facility.address.state}
            </span>
            {facility.tourConfig && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-[#EBF2FF] text-[#255DCE] border border-[#D0E0FF]">
                <Rotate3d className="size-3" />
                3D Tour Ready
              </span>
            )}
          </div>
        </div>
        <div className="self-start">
          <ScoreBadge score={breakdown.totalScore} />
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {/* Match factors */}
        <div className="rounded-xl bg-[#FAFBF8] p-4 border border-[#DCE5DE]/60 space-y-2">
          <MatchFactor
            ok={breakdown.careLevelMatch}
            label="Care Level"
            detail={
              breakdown.careLevelMatch
                ? "Offers required care setting and clinical staffing"
                : "Does not support required care level"
            }
          />
          <MatchFactor
            ok={breakdown.insuranceAccepted}
            label="Insurance & Payer"
            detail={
              breakdown.insuranceAccepted
                ? "Payer network contracted and accepted"
                : "Not currently in-network for patient's insurance"
            }
          />
          <MatchFactor
            ok={breakdown.hasAvailability}
            label="Capacity & Bed Availability"
            detail={
              breakdown.hasAvailability
                ? `${availableBeds} bed${availableBeds === 1 ? "" : "s"} open out of ${facility.capacity} total capacity`
                : "No currently open beds (waitlist required)"
            }
          />
        </div>

        {/* Score breakdown */}
        <div className="space-y-1.5 px-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#53665E]">
            Algorithmic Score Breakdown
          </p>
          <ScoreRow label="Baseline matching criteria" value={breakdown.baseScore} />
          <ScoreRow label="Bed capacity availability bonus" value={breakdown.capacityScore} />
          <ScoreRow label="Facility star rating bonus" value={breakdown.ratingScore} />
          <ScoreRow label="Waitlist delay penalty" value={-breakdown.waitlistPenalty} />
          <ScoreRow label="Geographic proximity bonus" value={breakdown.locationBonus} />
          <div className="pt-1 border-t border-[#DCE5DE]/60 flex items-center justify-between text-xs md:text-sm font-semibold text-[#0D1B17]">
            <span>Total Compatibility Score</span>
            <span className="font-mono text-sm">{breakdown.totalScore} pts</span>
          </div>
        </div>

        {/* Narrative explanation */}
        <div className="rounded-xl bg-[#EDF2EC]/60 border border-[#DCE5DE] p-3.5 text-xs text-[#203E39] leading-relaxed">
          <p className="font-semibold text-[#245C52] mb-1">Clinical Match Summary</p>
          {result.explanation}
        </div>

        {/* Actions - FIXED patientId query param! */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <Button
            size="sm"
            className="rounded-full bg-[#245C52] px-4 text-xs font-semibold text-white hover:bg-[#19473F] active:scale-[0.98] shadow-xs"
            render={
              <Link
                href={`/placements/new?patientId=${patientId}&facilityId=${facility.id}`}
              />
            }
          >
            Create Placement
            <ArrowRight className="size-3.5 ml-1.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full bg-white px-4 text-xs font-semibold text-[#203E39] border-[#DCE5DE] hover:bg-[#EDF2EC]"
            render={<Link href={`/facilities/${facility.id}`} />}
          >
            <Building2 className="size-3.5 mr-1.5 text-[#53665E]" />
            View Facility Profile
          </Button>
          {facility.tourConfig && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full bg-white px-3.5 text-xs font-semibold text-[#255DCE] border-[#D0E0FF] hover:bg-[#EBF2FF]"
              render={<Link href={`/facilities/${facility.id}/tour`} />}
            >
              <Rotate3d className="size-3.5 mr-1" />
              Launch 3D Tour
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function PatientMatchingPage({ params }: Props) {
  const { id } = await params;
  const org = await getServerOrganization();
  if (!org) return notFound();

  const patient = await getPatient(id, org.organizationId, org.role);
  if (!patient) return notFound();

  const matches = await getPatientFacilityMatches(
    id,
    org.organizationId,
    org.role
  );

  const patientName = `${patient.firstName} ${patient.lastName}`;

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Patient-Facility Matching"
        description={`Algorithmic facility recommendations, bed availability, and insurance compatibility for ${patientName}.`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Patients", href: "/patients" },
          { label: patientName, href: `/patients/${id}` },
          { label: "Matching" },
        ]}
      />

      {/* Patient Summary Header Card */}
      <div className="rounded-2xl border border-[#DCE5DE] bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-[#EDF2EC] font-serif text-base font-semibold text-[#245C52] border border-[#DCE5DE]">
              {patient.firstName.charAt(0)}
              {patient.lastName.charAt(0)}
            </div>
            <div>
              <h2 className="font-serif text-xl font-medium text-[#0D1B17]">
                {patientName}
              </h2>
              <p className="text-xs text-[#53665E]">
                MRN: <span className="font-mono font-medium">{patient.mrn}</span> &middot; DOB:{" "}
                {new Date(patient.dateOfBirth).toLocaleDateString()} ({patient.age} yrs,{" "}
                <span className="capitalize">{patient.gender}</span>)
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]">
              {STATUS_LABELS[patient.status] ?? patient.status}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#FAFBF8] text-[#203E39] border border-[#DCE5DE]">
              {CARE_LEVEL_LABELS[patient.careLevelRequired] ??
                patient.careLevelRequired.replace(/[-_]/g, " ")}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-3 border-t border-[#DCE5DE]/60 text-xs">
          <div>
            <span className="font-semibold text-[#53665E] block mb-0.5">Primary Diagnosis</span>
            <span className="font-medium text-[#0D1B17]">{patient.primaryDiagnosis}</span>
          </div>
          <div>
            <span className="font-semibold text-[#53665E] block mb-0.5">Insurance Provider</span>
            <span className="font-medium text-[#0D1B17]">
              {patient.insurance && patient.insurance.length > 0
                ? patient.insurance.map((ins) => ins.provider).join(", ")
                : "None recorded"}
            </span>
          </div>
          <div>
            <span className="font-semibold text-[#53665E] block mb-0.5">Admission Date</span>
            <span className="font-medium text-[#0D1B17]">
              {new Date(patient.admissionDate).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="font-semibold text-[#53665E] block mb-0.5">Target Discharge</span>
            <span className="font-medium text-[#0D1B17]">
              {patient.estimatedDischargeDate
                ? new Date(patient.estimatedDischargeDate).toLocaleDateString()
                : "Unscheduled"}
            </span>
          </div>
        </div>
      </div>

      {/* Matched Facilities Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-medium text-[#0D1B17]">
            Matched Care Facilities ({matches.length})
          </h2>
          <span className="text-xs text-[#53665E]">
            Ranked by total clinical compatibility
          </span>
        </div>

        {matches.length === 0 ? (
          <Empty className="border border-[#DCE5DE] bg-white py-16">
            <EmptyMedia variant="icon">
              <Building2 className="size-6 text-[#245C52]" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle className="text-xl font-serif text-[#0D1B17]">
                No matching network facilities
              </EmptyTitle>
              <EmptyDescription className="text-sm text-[#53665E] max-w-md">
                No facilities in your network currently match this patient&apos;s
                care level, accept their insurance, or have open bed availability.
              </EmptyDescription>
            </EmptyHeader>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 rounded-full border-[#DCE5DE] text-[#203E39] hover:bg-[#EDF2EC]"
              render={<Link href={`/patients/${id}`} />}
            >
              Return to Patient Profile
            </Button>
          </Empty>
        ) : (
          <div className="grid gap-5">
            {matches.map((result) => (
              <FacilityMatchCard
                key={result.facility.id}
                result={result}
                patientId={id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
