"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Building2,
  Home,
  ArrowLeft,
  ArrowRight,
  Check,
  Users,
  Copy,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

type OrganizationType = "hospital" | "facility";

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [statusError, setStatusError] = useState(false);
  const [statusAttempt, setStatusAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [setupAction, setSetupAction] = useState("create");
  const [activeTab, setActiveTab] = useState<"type" | "action">("type");
  const [selectedType, setSelectedType] = useState<OrganizationType | null>(
    null
  );
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [step, setStep] = useState(1);

  // For Create Org
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");

  // For Join Org
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const checkUserStatus = async () => {
      try {
        const res = await fetch("/api/me", { signal: controller.signal });
        // Clerk redirects signed-out requests to HTML sign-in pages; do not parse them as JSON.
        if (!res.ok || res.redirected || !res.headers.get("content-type")?.includes("application/json")) return;
        const data = await res.json();
        if (data && data.organizationId) {
          router.push("/chat");
        }
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to check user status:", err);
        setStatusError(true);
      } finally {
        clearTimeout(timeout);
        if (mounted) setIsLoading(false);
      }
    };

    checkUserStatus();
    return () => {
      mounted = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [router, statusAttempt]);

  const retryStatusCheck = () => {
    setStatusError(false);
    setIsLoading(true);
    setStatusAttempt(n => n + 1);
  };

  const handleTypeSelect = (type: OrganizationType) => {
    setSelectedType(type);
    setActiveTab("action");
    setStep(2);
  };

  const handleBack = () => {
    setActiveTab("type");
    setStep(1);
    setMessage(null);
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/onboarding/create-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName,
          slug: orgSlug,
          type: selectedType,
        }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to create organization");

      setMessage({
        text: "Organization created successfully!",
        type: "success",
      });
      setTimeout(() => router.push("/chat"), 1200);
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Something went wrong",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const validateRes = await fetch(
        `/api/invite-codes/validate?code=${encodeURIComponent(inviteCode)}`
      );
      const validateData = await validateRes.json();
      if (!validateRes.ok)
        throw new Error(validateData.error || "Failed to validate code");

      if (!validateData.valid) throw new Error(validateData.reason);

      const joinRes = await fetch("/api/join-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: validateData.organization.id,
          inviteCodeId: validateData.inviteCode.id,
        }),
      });

      const joinData = await joinRes.json();
      if (!joinRes.ok)
        throw new Error(joinData.error || "Failed to submit request");

      setMessage({
        text: "Join request submitted! Waiting for approval.",
        type: "success",
      });
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Something went wrong",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const copySlug = async () => {
    try {
      await navigator.clipboard.writeText(orgSlug);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage({ text: "Could not copy. Select and copy the short name instead.", type: "error" });
    }
  };

  return <div className="care-wizard">
    <ol className="care-wizard-steps" aria-label="Setup progress"><li aria-current={step === 1 ? 'step' : undefined}><span>{step > 1 ? <Check size={14} aria-hidden="true" /> : '1'}</span> Your organization</li><li aria-current={step === 2 ? 'step' : undefined}><span>2</span> Your workspace</li></ol>
    {isLoading ? <div className="care-loading" role="status"><Loader2 size={22} className="care-spinner" aria-hidden="true" /> Preparing your workspace…</div> : statusError ? <div className="care-form"><p className="care-form-error" role="alert"><AlertCircle size={18} aria-hidden="true" />We couldn&apos;t load your account status. Check your connection and try again.</p><button type="button" className="care-button" onClick={retryStatusCheck}><RefreshCw size={17} aria-hidden="true" />Retry</button></div> : <>
      {message && <p className={message.type === 'error' ? 'care-form-error' : 'care-email-summary'} role={message.type === 'error' ? 'alert' : 'status'}>{message.type === 'success' ? <CheckCircle2 size={18} aria-hidden="true" /> : <AlertCircle size={18} aria-hidden="true" />}{message.text}</p>}
      {message?.type === 'success' ? <div className="care-success"><h1>{message.text.startsWith('Join') ? 'Your request is on its way.' : 'Welcome to your workspace.'}</h1><p>{message.text.startsWith('Join') ? 'Your organization administrator will review your request. You can return once it has been approved.' : 'Taking you to your workspace…'}</p></div> : <>
        {activeTab === 'type' && <><h1>Where do you work?</h1><p className="care-auth-intro">Choose your organization type. We&apos;ll shape your workspace around your team.</p><div className="care-org-options"><button type="button" className="care-org-choice" onClick={() => handleTypeSelect('hospital')}><Building2 size={26} aria-hidden="true" /><span><strong>Hospital</strong><small>Plan discharges and coordinate placements</small></span><ArrowRight size={18} aria-hidden="true" /></button><button type="button" className="care-org-choice" onClick={() => handleTypeSelect('facility')}><Home size={26} aria-hidden="true" /><span><strong>Care facility</strong><small>Receive referrals and manage availability</small></span><ArrowRight size={18} aria-hidden="true" /></button></div></>}
        {activeTab === 'action' && selectedType && <><button type="button" onClick={handleBack} disabled={submitting} className="care-form-back"><ArrowLeft size={16} aria-hidden="true" /> Change organization type</button><h1 style={{ marginTop: 18 }}>Make room for your team.</h1><p className="care-auth-intro">{selectedType === 'hospital' ? 'Hospital' : 'Care facility'} workspace. Create a new organization or join your team.</p><Tabs value={setupAction} onValueChange={value => { if (!submitting && (value === "create" || value === "join")) setSetupAction(value); }} className="care-setup-tabs"><TabsList><TabsTrigger value="create" disabled={submitting}>Create an organization</TabsTrigger><TabsTrigger value="join" disabled={submitting}>Join your team</TabsTrigger></TabsList>
          <TabsContent value="create" className="mt-6"><form onSubmit={handleCreateOrg} className="care-form" aria-busy={submitting}>
            <div className="care-field"><Label htmlFor="org-name">Organization name</Label><Input id="org-name" name="organization" autoComplete="organization" value={orgName} onChange={e => { setOrgName(e.target.value); setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')); }} placeholder="e.g. Mercy General Hospital" required /></div>
            <div className="care-field"><Label htmlFor="org-slug">Short name</Label><div className="care-password"><Input id="org-slug" name="slug" autoComplete="off" spellCheck={false} value={orgSlug} onChange={e => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="e.g. mercy-general" required aria-describedby="slug-help" />{orgSlug && <button type="button" onClick={copySlug} aria-label={copied ? 'Short name copied' : 'Copy short name'}>{copied ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}</button>}</div><p id="slug-help" className="care-caption">A unique name to identify your organization. Letters, numbers, and hyphens.</p></div>
            <button type="submit" className="care-button" disabled={submitting}>{submitting ? <Loader2 size={17} className="care-spinner" aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}{submitting ? 'Creating workspace…' : 'Create organization'}</button>
          </form></TabsContent>
          <TabsContent value="join" className="mt-6"><form onSubmit={handleJoinOrg} className="care-form" aria-busy={submitting}><div className="care-field"><Label htmlFor="invite-code">Invite code</Label><Input id="invite-code" name="invite-code" autoComplete="off" spellCheck={false} value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} placeholder="Enter your team’s code" required aria-describedby="invite-help" /><p className="care-caption" id="invite-help">Ask your organization administrator for an invite code. They&apos;ll review your request to join.</p></div><button type="submit" className="care-button" disabled={submitting}>{submitting ? <Loader2 size={17} className="care-spinner" aria-hidden="true" /> : <Users size={17} aria-hidden="true" />}{submitting ? 'Sending request…' : 'Request to join'}</button></form></TabsContent>
        </Tabs></>}
      </>}
    </>}
  </div>;
}
