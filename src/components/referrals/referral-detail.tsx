"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  X,
  Send,
  Building2,
  User,
  HeartPulse,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Detail = {
  id: string;
  patientName: string;
  patientDateOfBirth: string;
  patientMrn: string;
  careLevel: string;
  requiredServices: string[];
  status: string;
  sentAt: string | null;
  convertedPlacementId: string | null;
  facility: { name: string };
  sendingOrganization: { name: string };
};

const label = (s: string) =>
  s.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  draft: {
    label: "Draft",
    badgeClass: "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]",
    dotClass: "bg-[#9CA3AF]",
  },
  sent: {
    label: "Under Review",
    badgeClass: "bg-[#EBF2FF] text-[#1D4BB8] border-[#D0E0FF]",
    dotClass: "bg-[#255DCE]",
  },
  accepted: {
    label: "Accepted",
    badgeClass: "bg-[#EDF2EC] text-[#203E39] border-[#DCE5DE]",
    dotClass: "bg-[#245C52]",
  },
  declined: {
    label: "Declined",
    badgeClass: "bg-[#FAEEEB] text-[#A33632] border-[#F2D6D0]",
    dotClass: "bg-[#DC2626]",
  },
  converted: {
    label: "Converted to Placement",
    badgeClass: "bg-[#F5F0FF] text-[#5B21B6] border-[#DDD6FE]",
    dotClass: "bg-[#7C3AED]",
  },
};

export function ReferralDetail({ id }: { id: string }) {
  const router = useRouter();
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [facilityView, setFacilityView] = useState(false);
  const [contractLink, setContractLink] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/referrals/" + encodeURIComponent(id), { cache: "no-store" }),
      fetch("/api/referrals/context", { cache: "no-store" }),
    ])
      .then(async ([r, c]) => {
        if (!r.ok || !c.ok) throw new Error("Unable to load referral");
        return [await r.json(), await c.json()];
      })
      .then(([r, c]) => {
        setData(r);
        setFacilityView(c.type === "facility");
      })
      .catch(() => setError("Referral details could not be retrieved."));
  }, [id]);

  useEffect(() => {
    fetch("/api/referrals/" + encodeURIComponent(id) + "/contract", {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => setContractLink(c?.id ?? null))
      .catch(() => {});
  }, [id, data?.status]);

  useEffect(() => {
    if (!contractLink) {
      setPaymentStatus(null);
      return;
    }
    let active = true;
    fetch("/api/contracts/" + encodeURIComponent(contractLink) + "/payment", {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((value) => {
        if (active) setPaymentStatus(value?.payment?.status ?? null);
      })
      .catch(() => {
        if (active) setPaymentStatus(null);
      });
    return () => {
      active = false;
    };
  }, [contractLink, data?.status]);

  async function convert() {
    setBusy(true);
    setError("");
    try {
      const result = await fetch(
        "/api/referrals/" + encodeURIComponent(id) + "/convert",
        { method: "POST" }
      );
      const body = await result.json();
      if (!result.ok) throw new Error(body.error ?? "Conversion failed");
      setData((old) =>
        old
          ? {
              ...old,
              status: "converted",
              convertedPlacementId: body.placementId,
            }
          : old
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
    } finally {
      setBusy(false);
    }
  }

  async function action(status: "sent" | "accepted" | "declined") {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/referrals/" + encodeURIComponent(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const value = await r.json();
      if (!r.ok) throw new Error(value.error || "Action failed");
      setData((old) => (old ? { ...old, status } : old));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const statusInfo = data
    ? STATUS_CONFIG[data.status] ?? {
        label: label(data.status),
        badgeClass: "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]",
        dotClass: "bg-[#9CA3AF]",
      }
    : null;

  return (
    <div className="space-y-8 pb-10 max-w-4xl">
      <PageHeader
        title={data ? `Referral: ${data.patientName}` : "Referral Details"}
        description={
          data
            ? `${data.sendingOrganization.name} → ${data.facility.name}`
            : error
            ? "Referral details could not be retrieved."
            : "Loading referral information..."
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Referrals", href: "/referrals" },
          { label: `Ref #${id.slice(0, 8)}` },
        ]}
      >
        {statusInfo && (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border",
              statusInfo.badgeClass
            )}
          >
            <span className={cn("size-1.5 rounded-full", statusInfo.dotClass)} />
            {statusInfo.label}
          </span>
        )}
      </PageHeader>

      {error && data && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
          {error}
        </div>
      )}

      {!data ? (
        error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
            {error}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#DCE5DE] bg-white p-12 text-center text-sm text-[#53665E]">
            Loading referral details...
          </div>
        )
      ) : (
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 p-4 rounded-2xl border border-[#DCE5DE] bg-white shadow-xs">
            {facilityView && data.status === "sent" && (
              <>
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => void action("accepted")}
                  className="rounded-full bg-[#245C52] px-5 text-xs font-semibold text-white hover:bg-[#19473F] active:scale-[0.98] gap-1.5 shadow-xs"
                >
                  <Check className="size-3.5" />
                  Accept Referral
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => void action("declined")}
                  className="rounded-full border-[#F2D6D0] bg-white px-4 text-xs font-semibold text-[#A33632] hover:bg-[#FAEEEB]"
                >
                  <X className="size-3.5" />
                  Decline
                </Button>
              </>
            )}

            {!facilityView && data.status === "draft" && (
              <Button
                size="sm"
                disabled={busy}
                onClick={() => void action("sent")}
                className="rounded-full bg-[#245C52] px-5 text-xs font-semibold text-white hover:bg-[#19473F] active:scale-[0.98] gap-1.5 shadow-xs"
              >
                <Send className="size-3.5" />
                Send Referral to Facility
              </Button>
            )}

            {contractLink && (
              <Button
                size="sm"
                className="rounded-full bg-[#255DCE] px-5 text-xs font-semibold text-white hover:bg-[#1D4BB8] active:scale-[0.98] gap-1.5 shadow-xs"
                render={<Link href={"/contracts/" + contractLink} />}
              >
                <FileText className="size-3.5" />
                View Placement Agreement
              </Button>
            )}

            {facilityView &&
              data.status === "accepted" &&
              (paymentStatus === "paid" || paymentStatus === "demo_paid") && (
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => void convert()}
                  className="rounded-full bg-[#245C52] px-5 text-xs font-semibold text-white hover:bg-[#19473F] active:scale-[0.98] gap-1.5 shadow-xs"
                >
                  <Sparkles className="size-3.5" />
                  {busy ? "Converting..." : "Convert to Active Placement"}
                </Button>
              )}

            {data.status === "converted" && data.convertedPlacementId && (
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#EDF2EC] text-[#245C52] border border-[#DCE5DE]">
                  <CheckCircle2 className="size-3.5" />
                  Placement Confirmed: #{data.convertedPlacementId.slice(0, 8)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full border-[#DCE5DE] text-[#203E39] hover:bg-[#EDF2EC] text-xs font-semibold"
                  render={<Link href={"/placements/" + data.convertedPlacementId} />}
                >
                  Open Placement &rarr;
                </Button>
              </div>
            )}

            {facilityView &&
              data.status === "accepted" &&
              paymentStatus !== "paid" &&
              paymentStatus !== "demo_paid" &&
              contractLink && (
                <p className="text-xs text-[#53665E] italic">
                  Placement conversion unlocks after dual signatures and deposit confirmation.
                </p>
              )}

            {data.status === "accepted" && !contractLink && (
              <p className="text-xs text-[#245C52] font-medium">
                Referral accepted. Placement agreement is being prepared.
              </p>
            )}
          </div>

          {/* Transfer Context Card */}
          <div className="rounded-2xl border border-[#DCE5DE] bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#DCE5DE]/60 pb-3">
              <Building2 className="size-4 text-[#245C52]" />
              <h2 className="font-serif text-lg font-medium text-[#0D1B17]">
                Care Setting Coordination
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 text-xs md:text-sm">
              <div className="rounded-xl bg-[#FAFBF8] border border-[#DCE5DE] p-4">
                <span className="text-xs font-semibold text-[#53665E] block mb-1">
                  Referring Hospital
                </span>
                <p className="font-medium text-[#0D1B17]">
                  {data.sendingOrganization.name}
                </p>
              </div>
              <div className="rounded-xl bg-[#FAFBF8] border border-[#DCE5DE] p-4">
                <span className="text-xs font-semibold text-[#53665E] block mb-1">
                  Destination Care Facility
                </span>
                <p className="font-medium text-[#0D1B17]">
                  {data.facility.name}
                </p>
              </div>
            </div>
          </div>

          {/* Patient & Care Requirements Card */}
          <div className="rounded-2xl border border-[#DCE5DE] bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#DCE5DE]/60 pb-3">
              <User className="size-4 text-[#245C52]" />
              <h2 className="font-serif text-lg font-medium text-[#0D1B17]">
                Patient & Clinical Requirements
              </h2>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2 text-xs md:text-sm">
              <div className="rounded-xl bg-[#FAFBF8] border border-[#DCE5DE] p-3.5">
                <dt className="text-xs font-semibold text-[#53665E]">Patient Full Name</dt>
                <dd className="mt-1 font-medium text-[#0D1B17]">{data.patientName}</dd>
              </div>
              <div className="rounded-xl bg-[#FAFBF8] border border-[#DCE5DE] p-3.5">
                <dt className="text-xs font-semibold text-[#53665E]">Medical Record Number (MRN)</dt>
                <dd className="mt-1 font-mono font-medium text-[#0D1B17]">{data.patientMrn}</dd>
              </div>
              <div className="rounded-xl bg-[#FAFBF8] border border-[#DCE5DE] p-3.5">
                <dt className="text-xs font-semibold text-[#53665E]">Date of Birth</dt>
                <dd className="mt-1 font-medium text-[#0D1B17]">
                  {new Date(data.patientDateOfBirth).toLocaleDateString()}
                </dd>
              </div>
              <div className="rounded-xl bg-[#FAFBF8] border border-[#DCE5DE] p-3.5">
                <dt className="text-xs font-semibold text-[#53665E]">Required Care Level</dt>
                <dd className="mt-1 font-medium text-[#0D1B17]">{label(data.careLevel)}</dd>
              </div>
            </dl>

            <div className="pt-2">
              <span className="text-xs font-semibold text-[#53665E] block mb-2">
                Required Clinical Services
              </span>
              {data.requiredServices && data.requiredServices.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {data.requiredServices.map((svc) => (
                    <span
                      key={svc}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#EDF2EC] text-[#245C52] border border-[#DCE5DE]"
                    >
                      {svc}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#53665E] italic">
                  No additional specific clinical service dependencies specified.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}