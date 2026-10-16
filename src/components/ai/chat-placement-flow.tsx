"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { DepositCheckout } from "@/components/payments/deposit-checkout";
import type { ChatFacility } from "@/components/ai/facility-result-card";
import { cn } from "@/lib/utils";

type Referral = { id: string; status: "draft" | "sent" | "accepted" | "declined" | "converted"; convertedPlacementId: string | null };
type Contract = { id: string; status: "draft" | "sent" | "signed" } | null;

const careLabel = (v: string) => v.replaceAll("-", " ").replace(/^\w/, (c) => c.toUpperCase());
const POLL_MS = 15_000;

const field =
  "min-h-11 w-full rounded-xl bg-[var(--chat-quiet)] px-3 text-[15px] text-[var(--chat-ink)] outline-none placeholder:text-[var(--chat-dim)] focus-visible:ring-2 focus-visible:ring-[var(--chat-accent)]";
const primary =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--chat-accent)] px-5 text-sm font-semibold text-white transition-[transform,opacity] hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chat-accent)] focus-visible:ring-offset-2 dark:text-[#0E1A2E]";

async function json<T>(res: Response, fallback: string): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error ?? fallback);
  return body as T;
}

/**
 * Selected-facility panel shown inside the chat: send the referral, follow
 * acceptance and signing, pay the deposit through the existing Stripe
 * checkout, then discharge once the facility has admitted the patient.
 */
export function ChatPlacementFlow({ facility, onClose }: { facility: ChatFacility; onClose: () => void }) {
  const [referral, setReferral] = useState<Referral | null>(null);
  const [contract, setContract] = useState<Contract>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async (id: string) => {
    const [r, c] = await Promise.all([
      fetch(`/api/referrals/${encodeURIComponent(id)}`, { cache: "no-store" }).then((res) => json<Referral>(res, "Referral unavailable")),
      fetch(`/api/referrals/${encodeURIComponent(id)}/contract`, { cache: "no-store" }).then((res) => (res.ok ? res.json() : null)),
    ]);
    setReferral(r);
    setContract(c);
  }, []);

  useEffect(() => {
    if (!referral || referral.status === "declined" || referral.status === "converted") return;
    const t = setInterval(() => void refresh(referral.id).catch(() => {}), POLL_MS);
    return () => clearInterval(t);
  }, [referral, refresh]);

  const steps = [
    { label: "Referral sent", done: !!referral },
    { label: "Facility accepts", done: referral?.status === "accepted" || referral?.status === "converted" },
    { label: "Agreement signed", done: contract?.status === "signed" },
    { label: "Deposit paid and patient admitted", done: referral?.status === "converted" },
  ];

  return (
    <section
      aria-label={`Place patient at ${facility.name}`}
      className="cb-rise mt-3 rounded-3xl bg-[var(--chat-raised)] p-5 shadow-[0_12px_32px_-12px_rgba(16,43,78,0.18)] sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-heading text-xl font-medium tracking-[-0.01em] text-[var(--chat-ink)] [overflow-wrap:anywhere]">
            {facility.name}
          </h3>
          <p className="mt-1 text-[13px] text-[var(--chat-dim)]">Referral, agreement and deposit, without leaving the chat.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--chat-dim)] hover:bg-[var(--chat-quiet)] hover:text-[var(--chat-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chat-accent)]"
          aria-label="Close placement panel"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <ol className="mt-5 flex flex-wrap gap-x-5 gap-y-2" aria-label="Placement progress">
        {steps.map((s) => (
          <li key={s.label} className={cn("flex items-center gap-2 text-[13px]", s.done ? "text-[var(--chat-ink)]" : "text-[var(--chat-dim)]")}>
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full",
                s.done ? "bg-[var(--chat-accent)] text-white dark:text-[#0E1A2E]" : "bg-[var(--chat-quiet)]",
              )}
              aria-hidden="true"
            >
              {s.done && <Check className="size-3" />}
            </span>
            {s.label}
            <span className="sr-only">{s.done ? "(done)" : "(pending)"}</span>
          </li>
        ))}
      </ol>

      <div className="mt-5" aria-live="polite">
        {!referral ? (
          <ReferralForm facility={facility} onSent={(id) => refresh(id).catch((e) => setError(e.message))} />
        ) : referral.status === "declined" ? (
          <p role="alert" className="rounded-2xl bg-[var(--chat-warn-bg)] p-4 text-sm text-[var(--chat-warn)]">
            {facility.name} declined this referral. Select another facility above to try again.
          </p>
        ) : referral.status === "sent" ? (
          <Waiting text={`Waiting for ${facility.name} to accept the referral. This panel checks for updates every 15 seconds.`} />
        ) : referral.status === "converted" && referral.convertedPlacementId ? (
          <DischargeAction placementId={referral.convertedPlacementId} facilityName={facility.name} />
        ) : contract?.status === "signed" ? (
          <>
            <DepositCheckout contractId={contract.id} />
            <p className="mt-3 text-[13px] text-[var(--chat-dim)]">
              After the deposit clears, {facility.name} admits the patient and discharge unlocks here.
            </p>
          </>
        ) : contract ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--chat-quiet)] p-4">
            <p className="text-sm text-[var(--chat-ink)]">
              {contract.status === "draft" ? "Accepted. Prepare and send the placement agreement." : "Agreement sent. Both parties need to sign before the deposit."}
            </p>
            <Link href={`/contracts/${contract.id}`} className={primary}>
              {contract.status === "draft" ? "Prepare agreement" : "Review and sign"}
            </Link>
          </div>
        ) : (
          <Waiting text="Accepted. The placement agreement is being prepared." />
        )}
        {error && <p role="alert" className="mt-3 text-sm text-[#B42318] dark:text-[#FDA29B]">{error}</p>}
      </div>

      {referral && (
        <p className="mt-4 text-[13px] text-[var(--chat-dim)]">
          You can also follow this on the{" "}
          <Link href={`/referrals/${referral.id}`} className="font-medium text-[var(--chat-accent)] underline underline-offset-4">
            referral page
          </Link>
          .
        </p>
      )}
    </section>
  );
}

function Waiting({ text }: { text: string }) {
  return (
    <p className="flex items-start gap-2.5 rounded-2xl bg-[var(--chat-quiet)] p-4 text-sm text-[var(--chat-ink)]">
      <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-[var(--chat-accent)] motion-reduce:animate-none" aria-hidden="true" />
      {text}
    </p>
  );
}

function ReferralForm({ facility, onSent }: { facility: ChatFacility; onSent: (id: string) => void }) {
  const [name, setName] = useState("");
  const [mrn, setMrn] = useState("");
  const [dob, setDob] = useState("");
  const [careLevel, setCareLevel] = useState<string>(facility.careLevelsOffered[0] ?? "skilled-nursing");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: name,
          patientMrn: mrn,
          patientDateOfBirth: dob,
          careLevel: careLevel.replaceAll("-", "_"),
          facilityId: facility.id,
          requiredServices: [],
          status: "sent",
        }),
      });
      const body = await json<{ id: string }>(res, "Referral could not be sent");
      onSent(body.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Referral could not be sent");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2" aria-describedby={error ? "referral-error" : undefined}>
      <label className="grid gap-1.5 text-[13px] font-medium text-[var(--chat-ink)]">
        Patient name
        <input required minLength={2} maxLength={160} autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} className={field} />
      </label>
      <label className="grid gap-1.5 text-[13px] font-medium text-[var(--chat-ink)]">
        MRN
        <input required maxLength={80} autoComplete="off" value={mrn} onChange={(e) => setMrn(e.target.value)} className={field} />
      </label>
      <label className="grid gap-1.5 text-[13px] font-medium text-[var(--chat-ink)]">
        Date of birth
        <input required type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={field} />
      </label>
      <label className="grid gap-1.5 text-[13px] font-medium text-[var(--chat-ink)]">
        Care level
        <select value={careLevel} onChange={(e) => setCareLevel(e.target.value)} className={field}>
          {facility.careLevelsOffered.map((l) => (
            <option key={l} value={l}>{careLabel(l)}</option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={busy} className={primary}>
          {busy && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {busy ? "Sending referral…" : "Send referral"}
        </button>
        <p className="text-[13px] text-[var(--chat-dim)]">Must match the patient&apos;s intake record so the facility can admit them.</p>
      </div>
      {error && <p id="referral-error" role="alert" className="text-sm text-[#B42318] dark:text-[#FDA29B] sm:col-span-2">{error}</p>}
    </form>
  );
}

function DischargeAction({ placementId, facilityName }: { placementId: string; facilityName: string }) {
  const [stage, setStage] = useState<"idle" | "confirm" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  async function discharge() {
    setStage("busy");
    setError("");
    try {
      const placement = await fetch(`/api/placements/${encodeURIComponent(placementId)}`, { cache: "no-store" })
        .then((r) => json<{ patientId: string }>(r, "Placement unavailable"));
      await fetch(`/api/patients/${encodeURIComponent(placement.patientId)}/discharge`, { method: "POST" })
        .then((r) => json(r, "Discharge failed"));
      setStage("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Discharge failed");
      setStage("confirm");
    }
  }

  if (stage === "done") {
    return (
      <p role="status" className="flex items-center gap-2.5 rounded-2xl bg-[var(--chat-ok-bg)] p-4 text-sm font-medium text-[var(--chat-ok)]">
        <Check className="size-4" aria-hidden="true" />
        Discharged to {facilityName}. The placement is closed and the bed count is updated.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--chat-ok-bg)] p-4">
      <p className="text-sm text-[var(--chat-ok)]">
        {stage === "idle" ? `Deposit paid and ${facilityName} has admitted the patient.` : "This closes the placement and marks the patient discharged. Continue?"}
      </p>
      <div className="flex gap-2">
        {stage !== "idle" && (
          <button type="button" onClick={() => setStage("idle")} disabled={stage === "busy"} className="min-h-11 cursor-pointer rounded-full px-4 text-sm font-medium text-[var(--chat-ink)] hover:bg-[var(--chat-raised)]">
            Cancel
          </button>
        )}
        <button type="button" onClick={stage === "idle" ? () => setStage("confirm") : discharge} disabled={stage === "busy"} className={primary}>
          {stage === "busy" && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {stage === "idle" ? "Discharge patient" : stage === "busy" ? "Discharging…" : "Confirm discharge"}
        </button>
      </div>
      {error && <p role="alert" className="w-full text-sm text-[#B42318] dark:text-[#FDA29B]">{error}</p>}
    </div>
  );
}
