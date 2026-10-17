import { notFound } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  User,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  Pencil,
  Building2,
  ShieldCheck,
  HeartPulse,
  Clock,
  ArrowRight,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { roleHasPermission } from "@/lib/permissions";
import { getPatient, getPlacements } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeletePatientDialog } from "./delete-dialog";
import { DischargeButton } from "@/components/patients/discharge-button";
import type { Placement } from "@/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  admitted: {
    label: "Admitted",
    badgeClass: "bg-[#EDF2EC] text-[#203E39] border-[#DCE5DE]",
    dotClass: "bg-[#245C52]",
  },
  "assessment-in-progress": {
    label: "Assessment In Progress",
    badgeClass: "bg-[#EBF2FF] text-[#1D4BB8] border-[#D0E0FF]",
    dotClass: "bg-[#255DCE]",
  },
  assessment_in_progress: {
    label: "Assessment In Progress",
    badgeClass: "bg-[#EBF2FF] text-[#1D4BB8] border-[#D0E0FF]",
    dotClass: "bg-[#255DCE]",
  },
  "ready-for-discharge": {
    label: "Ready for Discharge",
    badgeClass: "bg-[#FFF4E5] text-[#9A5B00] border-[#FFE2BF]",
    dotClass: "bg-[#F59E0B]",
  },
  ready_for_discharge: {
    label: "Ready for Discharge",
    badgeClass: "bg-[#FFF4E5] text-[#9A5B00] border-[#FFE2BF]",
    dotClass: "bg-[#F59E0B]",
  },
  placed: {
    label: "Placed",
    badgeClass: "bg-[#E8F8F0] text-[#14532D] border-[#C6F0D9]",
    dotClass: "bg-[#10B981]",
  },
  discharged: {
    label: "Discharged",
    badgeClass: "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]",
    dotClass: "bg-[#9CA3AF]",
  },
};

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

export default async function PatientDetailPage({ params }: Props) {
  const { id } = await params;
  const org = await getServerOrganization();
  if (!org) return notFound();

  const patient = await getPatient(id, org.organizationId, org.role);
  if (!patient) return notFound();

  const placements = await getPlacements(org.organizationId, org.role);
  const patientPlacements = placements.filter(
    (p: { patientId: string; selectedPatientId?: string }) =>
      p.patientId === id || p.selectedPatientId === id
  );

  const canEdit = roleHasPermission(org.role, "patients:update");
  const canDelete = roleHasPermission(org.role, "patients:delete");
  const canMatch = roleHasPermission(org.role, "placements:read");
  const canDischarge =
    roleHasPermission(org.role, "patients:update") &&
    roleHasPermission(org.role, "placements:update");
  const isDischargeable =
    patient.status === "ready_for_discharge" ||
    patient.status === "ready-for-discharge" ||
    patient.status === "placed";

  const patientName = `${patient.firstName} ${patient.lastName}`;
  const statusInfo =
    STATUS_CONFIG[patient.status] ??
    STATUS_CONFIG[patient.status.replace(/_/g, "-")] ?? {
      label: patient.status,
      badgeClass: "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]",
      dotClass: "bg-[#9CA3AF]",
    };

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title={patientName}
        description={`Medical Record No: ${patient.mrn} &middot; Born ${new Date(
          patient.dateOfBirth
        ).toLocaleDateString()} (${patient.age} yrs, ${patient.gender})`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Patients", href: "/patients" },
          { label: patientName },
        ]}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          {canMatch && (
            <Button
              size="sm"
              className="rounded-full bg-[#245C52] px-4 text-xs font-semibold text-white hover:bg-[#19473F] active:scale-[0.98] gap-1.5 shadow-xs"
              render={<Link href={`/patients/${patient.id}/matching`} />}
            >
              <Sparkles className="size-3.5" />
              Match Facilities
            </Button>
          )}
          {canDischarge && isDischargeable && (
            <DischargeButton
              patientId={patient.id}
              patientName={patientName}
            />
          )}
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full bg-white px-4 text-xs font-semibold text-[#203E39] border-[#DCE5DE] hover:bg-[#EDF2EC] active:scale-[0.98] gap-1.5"
              render={<Link href={`/patients/${patient.id}/edit`} />}
            >
              <Pencil className="size-3.5 text-[#53665E]" />
              Edit Profile
            </Button>
          )}
          {canDelete && (
            <DeletePatientDialog
              patientId={patient.id}
              patientName={patientName}
              hasActivePlacements={patientPlacements.length > 0}
            />
          )}
        </div>
      </PageHeader>

      {/* Telemetry / Status Row */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold border ${statusInfo.badgeClass}`}
        >
          <span className={`size-1.5 rounded-full ${statusInfo.dotClass}`} />
          {statusInfo.label}
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#FAFBF8] text-[#203E39] border border-[#DCE5DE]">
          <HeartPulse className="size-3.5 text-[#245C52]" />
          Required Care:{" "}
          <strong className="font-semibold">
            {CARE_LEVEL_LABELS[patient.careLevelRequired] ??
              patient.careLevelRequired.replace(/[-_]/g, " ")}
          </strong>
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#EDF2EC] text-[#203E39] border border-[#DCE5DE]">
          <Calendar className="size-3.5 text-[#53665E]" />
          Admitted: {new Date(patient.admissionDate).toLocaleDateString()}
        </span>
        {patient.estimatedDischargeDate && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium bg-[#FFF4E5] text-[#9A5B00] border border-[#FFE2BF]">
            <Clock className="size-3.5 text-[#F59E0B]" />
            Est. Discharge:{" "}
            {new Date(patient.estimatedDischargeDate).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Main Clinical & Demographics Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contact & Location */}
        <div className="rounded-2xl border border-[#DCE5DE] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#DCE5DE]/60 pb-3">
            <MapPin className="size-4 text-[#245C52]" />
            <h2 className="font-serif text-lg font-medium text-[#0D1B17]">
              Contact & Residence
            </h2>
          </div>
          <div className="space-y-3 text-xs md:text-sm text-[#203E39]">
            <div className="flex items-start gap-3">
              <span className="w-24 font-semibold text-[#53665E] shrink-0">
                Phone:
              </span>
              <a
                href={`tel:${patient.phone}`}
                className="font-medium text-[#255DCE] hover:underline"
              >
                {patient.phone || "Not recorded"}
              </a>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-24 font-semibold text-[#53665E] shrink-0">
                Address:
              </span>
              <div>
                <p>{patient.address?.street || "—"}</p>
                <p>
                  {patient.address?.city ? `${patient.address.city}, ` : ""}
                  {patient.address?.state || ""} {patient.address?.zipCode || ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="rounded-2xl border border-[#DCE5DE] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#DCE5DE]/60 pb-3">
            <Phone className="size-4 text-[#245C52]" />
            <h2 className="font-serif text-lg font-medium text-[#0D1B17]">
              Emergency Contact
            </h2>
          </div>
          <div className="space-y-3 text-xs md:text-sm text-[#203E39]">
            <div className="flex items-start gap-3">
              <span className="w-24 font-semibold text-[#53665E] shrink-0">
                Contact:
              </span>
              <span className="font-medium text-[#0D1B17]">
                {patient.emergencyContact?.name || "None designated"}
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-24 font-semibold text-[#53665E] shrink-0">
                Relationship:
              </span>
              <span>{patient.emergencyContact?.role || "—"}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-24 font-semibold text-[#53665E] shrink-0">
                Phone:
              </span>
              <a
                href={`tel:${patient.emergencyContact?.phone}`}
                className="font-medium text-[#255DCE] hover:underline"
              >
                {patient.emergencyContact?.phone || "—"}
              </a>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-24 font-semibold text-[#53665E] shrink-0">
                Email:
              </span>
              <span>{patient.emergencyContact?.email || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical & Medical Information */}
      <div className="rounded-2xl border border-[#DCE5DE] bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#DCE5DE]/60 pb-3">
          <HeartPulse className="size-4 text-[#245C52]" />
          <h2 className="font-serif text-lg font-medium text-[#0D1B17]">
            Clinical Assessment & Diagnoses
          </h2>
        </div>
        <div className="space-y-4 text-xs md:text-sm">
          <div>
            <span className="font-semibold text-[#53665E] block mb-1">
              Primary Admitting Diagnosis
            </span>
            <div className="rounded-xl bg-[#FAFBF8] border border-[#DCE5DE] p-3 font-medium text-[#0D1B17]">
              {patient.primaryDiagnosis}
            </div>
          </div>

          {patient.secondaryDiagnoses && patient.secondaryDiagnoses.length > 0 && (
            <div>
              <span className="font-semibold text-[#53665E] block mb-1.5">
                Secondary & Comorbid Diagnoses
              </span>
              <div className="flex flex-wrap gap-2">
                {patient.secondaryDiagnoses.map((diag) => (
                  <span
                    key={diag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#FAFBF8] text-[#203E39] border border-[#DCE5DE]"
                  >
                    {diag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {patient.insurance && patient.insurance.length > 0 && (
            <div>
              <span className="font-semibold text-[#53665E] block mb-1.5">
                Insurance Coverage & Payers
              </span>
              <div className="grid gap-2 sm:grid-cols-2">
                {patient.insurance.map((ins, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#DCE5DE] bg-[#FAFBF8] p-3 text-xs"
                  >
                    <p className="font-semibold text-[#0D1B17]">{ins.provider}</p>
                    <p className="text-[#53665E]">Policy: {ins.policyNumber}</p>
                    {ins.groupNumber && (
                      <p className="text-[#53665E]">Group: {ins.groupNumber}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {patient.notes && (
            <div>
              <span className="font-semibold text-[#53665E] block mb-1">
                Clinical Care Notes & Directives
              </span>
              <div className="rounded-xl bg-[#EDF2EC]/40 border border-[#DCE5DE] p-3.5 text-xs text-[#203E39] whitespace-pre-wrap leading-relaxed">
                {patient.notes}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clinical Documents */}
      <div className="rounded-2xl border border-[#DCE5DE] bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#DCE5DE]/60 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-[#245C52]" />
            <h2 className="font-serif text-lg font-medium text-[#0D1B17]">
              Attached Clinical Documents (
              {patient.documents ? patient.documents.length : 0})
            </h2>
          </div>
          {canEdit && (
            <Link
              href={`/patients/${patient.id}/edit`}
              className="text-xs font-semibold text-[#245C52] hover:underline"
            >
              Upload / Manage
            </Link>
          )}
        </div>

        {patient.documents && patient.documents.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {patient.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-xl border border-[#DCE5DE] bg-[#FAFBF8] p-3.5 transition-colors hover:bg-[#EDF2EC]/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white border border-[#DCE5DE] text-[#245C52]">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-xs font-semibold text-[#0D1B17] hover:text-[#255DCE]"
                    >
                      {doc.name}
                    </a>
                    {doc.fileSize && (
                      <span className="text-[11px] text-[#53665E]">
                        {doc.fileSize < 1024
                          ? `${doc.fileSize} B`
                          : doc.fileSize < 1024 * 1024
                          ? `${(doc.fileSize / 1024).toFixed(1)} KB`
                          : `${(doc.fileSize / (1024 * 1024)).toFixed(1)} MB`}
                      </span>
                    )}
                  </div>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-[#53665E] hover:text-[#0D1B17]"
                  aria-label="Open document"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#53665E] py-2">
            No clinical records, transfer packets, or diagnostic files attached yet.
          </p>
        )}
      </div>

      {/* Active Placements */}
      <div className="rounded-2xl border border-[#DCE5DE] bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#DCE5DE]/60 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-[#245C52]" />
            <h2 className="font-serif text-lg font-medium text-[#0D1B17]">
              Placement Trajectory ({patientPlacements.length})
            </h2>
          </div>
          {canMatch && (
            <Link
              href={`/patients/${patient.id}/matching`}
              className="text-xs font-semibold text-[#255DCE] hover:underline"
            >
              Explore Matches &rarr;
            </Link>
          )}
        </div>

        {patientPlacements.length > 0 ? (
          <div className="space-y-3">
            {patientPlacements.map((p: Placement) => (
              <div
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#DCE5DE] bg-[#FAFBF8] p-4 transition-colors hover:border-[#245C52]/40"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/placements/${p.id}`}
                      className="font-medium text-xs md:text-sm text-[#0D1B17] hover:text-[#245C52]"
                    >
                      Placement #{p.id.slice(0, 8)}
                    </Link>
                    <span className="capitalize text-xs text-[#53665E]">
                      &middot; {p.careLevel?.replace(/[-_]/g, " ")}
                    </span>
                  </div>
                  {p.startDate && (
                    <p className="text-xs text-[#53665E] mt-0.5">
                      Target Start: {new Date(p.startDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      p.status === "in-progress" || p.status === "approved"
                        ? "bg-[#EDF2EC] text-[#245C52] border-[#DCE5DE]"
                        : "bg-[#FAFBF8] text-[#53665E] border-[#DCE5DE]"
                    }`}
                  >
                    {p.status}
                  </span>
                  <Link
                    href={`/placements/${p.id}`}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-[#203E39] bg-white border border-[#DCE5DE] hover:bg-[#EDF2EC]"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#DCE5DE] p-6 text-center space-y-2">
            <p className="text-xs text-[#53665E]">
              This patient does not have any active or completed placement
              workflows initiated.
            </p>
            {canMatch && (
              <Button
                size="sm"
                className="rounded-full bg-[#245C52] text-white hover:bg-[#19473F] text-xs"
                render={<Link href={`/patients/${patient.id}/matching`} />}
              >
                Find Facility Match
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Metadata footer */}
      <div className="flex flex-wrap items-center justify-between text-xs text-[#53665E] px-2">
        <span>Patient Record ID: {patient.id}</span>
        {patient.updatedAt && (
          <span>
            Last updated: {new Date(patient.updatedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
