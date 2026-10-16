"use client";

import { DepositCheckout } from "@/components/payments/deposit-checkout";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  LockKeyhole,
  Send,
  ShieldCheck,
  Building2,
  AlertCircle,
  Copy,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Detail = {
  id: string;
  referralId: string;
  status: "draft" | "sent" | "signed";
  documentText: string | null;
  documentHash: string | null;
  myParty: "hospital" | "facility";
  canPrepare: boolean;
  hospitalName: string;
  facilityName: string;
  currency: string;
  depositAmountCents: number;
  signatures: {
    party: "hospital" | "facility";
    typedName: string;
    signedAt: string;
    documentHash: string;
  }[];
};

const label = (s: string) =>
  s.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function ContractView({ id }: { id: string }) {
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deposit, setDeposit] = useState("0.00");
  const [terms, setTerms] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);

  async function reload() {
    const r = await fetch("/api/contracts/" + encodeURIComponent(id), {
      cache: "no-store",
    });
    const x = await r.json();
    if (!r.ok) throw new Error(x.error || "Unable to read agreement");
    setData(x);
  }

  useEffect(() => {
    void reload().catch(() => setError("Contract document is unavailable."));
  }, [id]);

  async function send() {
    if (!/^\d+(\.\d{1,2})?$/.test(deposit)) {
      setError("Enter a valid USD deposit amount (e.g. 500.00)");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const r = await fetch(
        "/api/contracts/" + encodeURIComponent(id) + "/send",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            depositAmountCents: Math.round(Number(deposit) * 100),
            facilityTerms: terms,
          }),
        }
      );
      const x = await r.json();
      if (!r.ok) throw new Error(x.error || "Unable to send agreement");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to send");
    } finally {
      setBusy(false);
    }
  }

  async function sign() {
    if (!consent) {
      setError("Legal signature consent is required");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const r = await fetch(
        "/api/contracts/" + encodeURIComponent(id) + "/sign",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ typedName: name, consent: true }),
        }
      );
      const x = await r.json();
      if (!r.ok) throw new Error(x.error || "Unable to record electronic signature");
      setName("");
      setConsent(false);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to record signature");
    } finally {
      setBusy(false);
    }
  }

  const mine = data?.signatures.find((s) => s.party === data.myParty);

  const inputClass =
    "mt-2 w-full rounded-xl border border-[#DCE5DE] bg-[#FAFBF8] px-3.5 py-2.5 text-xs md:text-sm text-[#0D1B17] outline-none transition-colors placeholder:text-[#53665E]/70 focus:border-[#245C52] focus:bg-white focus:ring-2 focus:ring-[#245C52]/10";

  return (
    <div className="space-y-8 pb-10 max-w-5xl">
      <PageHeader
        title="Placement Care Agreement"
        description={
          data
            ? `${data.hospitalName} &middot; ${data.facilityName}`
            : "Reviewing bilateral agreement terms..."
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Referrals", href: "/referrals" },
          {
            label: "Referral",
            href: data ? `/referrals/${data.referralId}` : "/referrals",
          },
          { label: "Placement Agreement" },
        ]}
      >
        <div className="flex items-center gap-2">
          {data && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border",
                data.status === "signed"
                  ? "bg-[#EDF2EC] text-[#245C52] border-[#DCE5DE]"
                  : data.status === "sent"
                  ? "bg-[#EBF2FF] text-[#255DCE] border-[#D0E0FF]"
                  : "bg-[#FAFBF8] text-[#53665E] border-[#DCE5DE]"
              )}
            >
              <LockKeyhole className="size-3.5" />
              {data.status.toUpperCase()}
            </span>
          )}
        </div>
      </PageHeader>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
          {error}
        </div>
      )}

      {!data ? (
        <div className="rounded-2xl border border-[#DCE5DE] bg-white p-12 text-center text-sm text-[#53665E]">
          Loading placement agreement...
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* Main Agreement Document */}
          <section className="rounded-2xl border border-[#DCE5DE] bg-white p-6 md:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-[#DCE5DE]/60 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-[#255DCE]" />
                <h2 className="font-serif text-lg font-medium text-[#0D1B17]">
                  Agreement Terms & Conditions
                </h2>
              </div>
              <span className="text-xs text-[#53665E]">
                Immutable upon transmission
              </span>
            </div>

            <div className="rounded-xl border border-[#DCE5DE]/70 bg-[#FAFBF8] p-5">
              <pre className="whitespace-pre-wrap break-words font-sans text-xs md:text-sm leading-relaxed text-[#203E39]">
                {data.documentText || "No terms drafted yet."}
              </pre>
            </div>

            {data.documentHash && (
              <div className="rounded-xl border border-[#DCE5DE] bg-[#EDF2EC]/40 p-4 text-xs text-[#53665E] space-y-1">
                <p className="font-semibold text-[#245C52] flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5" />
                  SHA-256 Cryptographic Audit Fingerprint
                </p>
                <code className="block break-all font-mono text-[11px] text-[#203E39]">
                  {data.documentHash}
                </code>
              </div>
            )}
          </section>

          {/* Sidebar / Signatures & Actions */}
          <aside className="space-y-6">
            {/* Signature Progress */}
            <section className="rounded-2xl border border-[#DCE5DE] bg-white p-6 shadow-xs space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#53665E]">
                Bilateral Signature Verification
              </h2>

              {(["hospital", "facility"] as const).map((p) => {
                const s = data.signatures.find((x) => x.party === p);
                return (
                  <div
                    key={p}
                    className="flex items-start gap-3 rounded-xl border border-[#DCE5DE]/60 bg-[#FAFBF8] p-3.5"
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold border",
                        s
                          ? "bg-[#EDF2EC] text-[#245C52] border-[#DCE5DE]"
                          : "bg-white text-[#53665E] border-[#DCE5DE]"
                      )}
                    >
                      {s ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        <ShieldCheck className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold capitalize text-[#0D1B17]">
                        {p} Representative Signature
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#53665E]">
                        {s
                          ? `Signed by ${s.typedName} &middot; ${new Date(
                              s.signedAt
                            ).toLocaleDateString()}`
                          : "Awaiting electronic signature"}
                      </p>
                    </div>
                  </div>
                );
              })}

              {data.status === "signed" && (
                <div className="rounded-xl border border-[#DCE5DE] bg-[#EDF2EC] p-3 text-xs font-medium text-[#245C52] flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0" />
                  Both organizations have executed this verified placement agreement.
                </div>
              )}
            </section>

            {/* Prepare & Send (Draft mode) */}
            {data.canPrepare && (
              <section className="rounded-2xl border border-[#DCE5DE] bg-white p-6 shadow-xs space-y-4">
                <h2 className="font-serif text-lg font-medium text-[#0D1B17]">
                  Prepare Terms & Send
                </h2>
                <p className="text-xs text-[#53665E] leading-relaxed">
                  Draft the facility placement conditions and required security deposit.
                  Transmission permanently locks terms for dual electronic execution.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#53665E]">
                    Security Deposit Amount (USD)
                  </label>
                  <input
                    aria-label="Deposit in USD"
                    inputMode="decimal"
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                    className={inputClass}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#53665E]">
                    Specific Facility Terms & Care Conditions
                  </label>
                  <textarea
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    maxLength={8000}
                    rows={6}
                    placeholder="Describe facility stay, services, refund policy, and cancellation schedule."
                    className={inputClass}
                  />
                </div>

                <Button
                  type="button"
                  onClick={() => void send()}
                  disabled={busy}
                  className="w-full rounded-full bg-[#245C52] py-2.5 text-xs font-semibold text-white hover:bg-[#19473F] active:scale-[0.98] shadow-xs gap-1.5"
                >
                  <Send className="size-3.5" />
                  {busy ? "Transmitting..." : "Send for Electronic Signatures"}
                </Button>
              </section>
            )}

            {/* Sign Document Form */}
            {data.status === "sent" && !mine && (
              <section className="rounded-2xl border border-[#DCE5DE] bg-white p-6 shadow-xs space-y-4">
                <h2 className="font-serif text-lg font-medium text-[#0D1B17]">
                  Sign as {label(data.myParty)}
                </h2>
                <p className="text-xs text-[#53665E] leading-relaxed">
                  Review the contract terms and cryptographic document fingerprint. Your legal name
                  and timestamp become binding audit evidence.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#53665E]">
                    Full Legal Name
                  </label>
                  <input
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={160}
                    placeholder="First and Last Legal Name"
                    className={inputClass}
                  />
                </div>

                <label className="flex cursor-pointer items-start gap-2.5 text-xs text-[#53665E] pt-1">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 accent-[#245C52]"
                  />
                  <span>
                    I confirm that I have reviewed this agreement and intend my typed name
                    to serve as my legally binding electronic signature.
                  </span>
                </label>

                <Button
                  type="button"
                  onClick={() => void sign()}
                  disabled={busy || !consent || name.trim().length < 3}
                  className="w-full rounded-full bg-[#245C52] py-2.5 text-xs font-semibold text-white hover:bg-[#19473F] active:scale-[0.98] shadow-xs gap-1.5"
                >
                  <ShieldCheck className="size-3.5" />
                  {busy ? "Recording..." : "Sign Agreement Electronically"}
                </Button>
              </section>
            )}

            {/* Deposit Checkout */}
            {data.status === "signed" && (
              <div className="rounded-2xl border border-[#DCE5DE] bg-white p-6 shadow-xs">
                <DepositCheckout contractId={data.id} />
              </div>
            )}

            {/* Waiting Notice */}
            {data.status === "sent" && mine && (
              <div className="rounded-2xl border border-[#DCE5DE] bg-[#FAFBF8] p-5 text-xs text-[#53665E]">
                <p className="font-semibold text-[#245C52] mb-1">
                  Signature Recorded
                </p>
                Your electronic signature is verified. Awaiting counterpart signature from the
                partner organization.
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}