"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Building2,
  Home,
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Users,
  Sparkles,
  Copy,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type OrganizationType = "hospital" | "facility";

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
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
    const checkUserStatus = async () => {
      try {
        const res = await fetch("/api/me");
        const data = await res.json();
        if (data && data.organizationId) {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Failed to check user status:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, [router]);

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
    setIsLoading(true);
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
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Something went wrong",
        type: "error",
      });
      setIsLoading(false);
    }
  };

  const handleJoinOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const validateRes = await fetch(
        `/api/invite-codes/validate?code=${inviteCode}`
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
      setIsLoading(false);
    }
  };

  const copySlug = () => {
    navigator.clipboard.writeText(orgSlug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-white/10 border-t-[#44BEAF] animate-spin" />
          <Sparkles className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-[#44BEAF]" />
        </div>
        <p className="text-sm text-white/50">Setting things up...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[520px]">
      {/* Logo */}
      <div className="mb-8 flex justify-center">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#44BEAF]">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">CareBridge</span>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-3">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${
                  step >= s
                    ? "bg-[#44BEAF] text-white shadow-[0_0_20px_rgba(68,190,175,0.4)]"
                    : "bg-white/10 text-white/40"
                }`}
              >
                {step > s ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{s}</span>
                )}
              </div>
              {s < 2 && (
                <div
                  className={`h-0.5 w-16 rounded-full transition-all duration-500 ${
                    step > s ? "bg-[#44BEAF]" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-center gap-20">
          <span
            className={`text-xs font-medium transition-colors ${
              step >= 1 ? "text-white/80" : "text-white/30"
            }`}
          >
            Organization
          </span>
          <span
            className={`text-xs font-medium transition-colors ${
              step >= 2 ? "text-white/80" : "text-white/30"
            }`}
          >
            Setup
          </span>
        </div>
      </div>

      {/* Main Card */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-8 shadow-[0_8px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        {/* Messages */}
        {message && (
          <Alert
            variant={message.type === "error" ? "destructive" : "default"}
            className="mb-6 border-0"
          >
            <div
              className={`flex items-center gap-2 rounded-xl px-4 py-3 ${
                message.type === "success"
                  ? "bg-[#44BEAF]/10 text-[#44BEAF]"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <AlertDescription className="text-sm">
                {message.text}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Step 1: Type Selection */}
        {activeTab === "type" && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">
                Welcome to CareBridge
              </h2>
              <p className="mt-2 text-sm text-white/50">
                Let&apos;s get your organization set up. First, tell us about
                your workplace.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleTypeSelect("hospital")}
                className="group relative flex h-36 flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:border-[#44BEAF]/40 hover:bg-[#44BEAF]/5 hover:shadow-[0_0_30px_rgba(68,190,175,0.1)]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#134675]/50 transition-colors group-hover:bg-[#134675]">
                  <Building2 className="h-7 w-7 text-[#44BEAF]" />
                </div>
                <div className="text-center">
                  <span className="text-sm font-semibold text-white">
                    Hospital
                  </span>
                  <p className="mt-0.5 text-xs text-white/40">
                    Acute care settings
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeSelect("facility")}
                className="group relative flex h-36 flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:border-[#44BEAF]/40 hover:bg-[#44BEAF]/5 hover:shadow-[0_0_30px_rgba(68,190,175,0.1)]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#134675]/50 transition-colors group-hover:bg-[#134675]">
                  <Home className="h-7 w-7 text-[#44BEAF]" />
                </div>
                <div className="text-center">
                  <span className="text-sm font-semibold text-white">
                    Facility
                  </span>
                  <p className="mt-0.5 text-xs text-white/40">
                    Post-acute care
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Action Selection */}
        {activeTab === "action" && selectedType && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {selectedType === "hospital"
                    ? "Hospital"
                    : "Facility"}{" "}
                  Setup
                </h2>
                <p className="text-xs text-white/40">
                  Create a new organization or join an existing one
                </p>
              </div>
            </div>

            <Tabs defaultValue="create">
              <TabsList className="grid w-full grid-cols-2 rounded-xl bg-white/5 p-1">
                <TabsTrigger
                  value="create"
                  className="flex items-center gap-2 rounded-lg py-2.5 text-sm data-[state=active]:bg-[#44BEAF] data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(68,190,175,0.3)]"
                >
                  <Plus className="h-4 w-4" />
                  Create New
                </TabsTrigger>
                <TabsTrigger
                  value="join"
                  className="flex items-center gap-2 rounded-lg py-2.5 text-sm data-[state=active]:bg-[#44BEAF] data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(68,190,175,0.3)]"
                >
                  <Users className="h-4 w-4" />
                  Join Existing
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="mt-6">
                <form onSubmit={handleCreateOrg} className="space-y-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="org-name"
                      className="text-sm font-medium text-white/70"
                    >
                      Organization Name
                    </Label>
                    <Input
                      id="org-name"
                      value={orgName}
                      onChange={(e) => {
                        setOrgName(e.target.value);
                        setOrgSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9\s]/g, "")
                            .replace(/\s+/g, "-")
                        );
                      }}
                      placeholder="e.g., Mercy General Hospital"
                      className="h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder-white/30 focus:border-[#44BEAF]/50 focus:ring-[#44BEAF]/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="org-slug"
                      className="text-sm font-medium text-white/70"
                    >
                      Short Name
                    </Label>
                    <div className="relative">
                      <Input
                        id="org-slug"
                        value={orgSlug}
                        onChange={(e) =>
                          setOrgSlug(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-]/g, "")
                          )
                        }
                        placeholder="e.g., mercy-general"
                        className="h-12 rounded-xl border-white/10 bg-white/5 pr-10 text-white placeholder-white/30 focus:border-[#44BEAF]/50 focus:ring-[#44BEAF]/20"
                        required
                      />
                      {orgSlug && (
                        <button
                          type="button"
                          onClick={copySlug}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-[#44BEAF]" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                    {orgSlug && (
                      <p className="text-xs text-white/30">
                        carebridge.health/{orgSlug}
                      </p>
                    )}
                  </div>

                  <ShimmerButton
                    type="submit"
                    shimmerColor="#ffffff"
                    shimmerSize="0.05em"
                    shimmerDuration="3s"
                    borderRadius="12px"
                    background="rgba(68, 190, 175, 1)"
                    className="h-12 w-full rounded-xl text-white shadow-[0_4px_20px_rgba(68,190,175,0.3)]"
                    disabled={isLoading || !orgName || !orgSlug}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Create Organization
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </ShimmerButton>
                </form>
              </TabsContent>

              <TabsContent value="join" className="mt-6">
                <form onSubmit={handleJoinOrg} className="space-y-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="invite-code"
                      className="text-sm font-medium text-white/70"
                    >
                      Invite Code
                    </Label>
                    <Input
                      id="invite-code"
                      value={inviteCode}
                      onChange={(e) =>
                        setInviteCode(e.target.value.toUpperCase())
                      }
                      placeholder="Enter your invite code"
                      className="h-12 rounded-xl border-white/10 bg-white/5 text-center font-mono text-lg tracking-widest text-white placeholder-white/30 focus:border-[#44BEAF]/50 focus:ring-[#44BEAF]/20"
                      required
                    />
                    <p className="text-center text-xs text-white/30">
                      Get this code from your organization admin
                    </p>
                  </div>

                  <ShimmerButton
                    type="submit"
                    shimmerColor="#ffffff"
                    shimmerSize="0.05em"
                    shimmerDuration="3s"
                    borderRadius="12px"
                    background="rgba(68, 190, 175, 1)"
                    className="h-12 w-full rounded-xl text-white shadow-[0_4px_20px_rgba(68,190,175,0.3)]"
                    disabled={isLoading || !inviteCode}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Join Organization
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </ShimmerButton>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="mt-6 text-center text-xs text-white/30">
        Need help?{" "}
        <a
          href="mailto:support@carebridge.health"
          className="text-[#44BEAF]/70 hover:text-[#44BEAF]"
        >
          Contact support
        </a>
      </p>
    </div>
  );
}
