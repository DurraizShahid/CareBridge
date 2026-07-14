import { notFound } from "next/navigation";
import Link from "next/link";
import { getPatient, getPatientFacilityMatches } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, Star, MapPin, Building2 } from "lucide-react";
import type { FacilityMatchResult } from "@/types";

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
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : score >= 60
        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
      {score} pts
    </span>
  );
}

function MatchFactor({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0 text-red-500" />
      )}
      <span className="font-medium">{label}:</span>
      <span className="text-muted-foreground">{detail}</span>
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  if (value === 0) return null;
  const display = value > 0 ? `+${value}` : `${value}`;
  const color = value > 0 ? "text-green-600" : "text-red-500";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono font-medium ${color}`}>{display}</span>
    </div>
  );
}

function FacilityMatchCard({ result }: { result: FacilityMatchResult }) {
  const { facility, breakdown } = result;
  const availableBeds = facility.capacity - facility.currentOccupancy;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg">
            <Link href={`/facilities/${facility.id}`} className="underline-offset-4 hover:underline">
              {facility.name}
            </Link>
          </CardTitle>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              {facility.type.replace(/-/g, " ")}
            </Badge>
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              {facility.rating} ({facility.reviewsCount})
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {facility.address.city}, {facility.address.state}
            </span>
          </div>
        </div>
        <ScoreBadge score={breakdown.totalScore} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <MatchFactor
            ok={breakdown.careLevelMatch}
            label="Care Level"
            detail={breakdown.careLevelMatch ? "Offers required care level" : "Does not offer required care level"}
          />
          <MatchFactor
            ok={breakdown.insuranceAccepted}
            label="Insurance"
            detail={breakdown.insuranceAccepted ? "Accepts patient's insurance" : "Does not accept patient's insurance"}
          />
          <MatchFactor
            ok={breakdown.hasAvailability}
            label="Availability"
            detail={breakdown.hasAvailability ? `${availableBeds} bed${availableBeds === 1 ? "" : "s"} available of ${facility.capacity}` : "No current availability"}
          />
        </div>

        <Separator />

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Score Breakdown
          </p>
          <ScoreRow label="Base" value={breakdown.baseScore} />
          <ScoreRow label="Capacity bonus" value={breakdown.capacityScore} />
          <ScoreRow label="Rating bonus" value={breakdown.ratingScore} />
          <ScoreRow label="Waitlist penalty" value={-breakdown.waitlistPenalty} />
          <ScoreRow label="Location bonus" value={breakdown.locationBonus} />
          <Separator className="my-1" />
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Total</span>
            <span className="font-mono">{breakdown.totalScore} pts</span>
          </div>
        </div>

        <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
          {result.explanation}
        </div>

        <div className="flex gap-2">
          <Button size="sm" render={<Link href={`/placements/new?patientId=${facility.id}&facilityId=${facility.id}`} />}>
            Create Placement
          </Button>
          <Button size="sm" variant="outline" render={<Link href={`/facilities/${facility.id}`} />}>
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function PatientMatchingPage({ params }: Props) {
  const { id } = await params;
  const org = await getServerOrganization();
  if (!org) return notFound();

  const patient = await getPatient(id, org.organizationId, org.role);
  if (!patient) return notFound();

  const matches = await getPatientFacilityMatches(id, org.organizationId, org.role);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href={`/patients/${id}`}
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              &larr; Back to Patient
            </Link>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Patient-Facility Matching
          </h1>
          <p className="text-sm text-muted-foreground">
            AI-powered facility matching for {patient.firstName} {patient.lastName}
          </p>
        </div>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Patient Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div>
              <span className="font-medium">Name:</span>{" "}
              {patient.firstName} {patient.lastName}
            </div>
            <div>
              <span className="font-medium">Care Level:</span>{" "}
              {CARE_LEVEL_LABELS[patient.careLevelRequired] ?? patient.careLevelRequired}
            </div>
            <div>
              <span className="font-medium">Status:</span>{" "}
              {STATUS_LABELS[patient.status] ?? patient.status}
            </div>
            <div>
              <span className="font-medium">Diagnosis:</span>{" "}
              {patient.primaryDiagnosis}
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold">
          Matched Facilities ({matches.length})
        </h2>
        {matches.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No facilities matched this patient&apos;s requirements.
              </p>
              <p className="text-xs text-muted-foreground">
                Ensure your organization has facilities that offer the required care level, accept
                the patient&apos;s insurance, and have current availability.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {matches.map((result) => (
              <FacilityMatchCard key={result.facility.id} result={result} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
