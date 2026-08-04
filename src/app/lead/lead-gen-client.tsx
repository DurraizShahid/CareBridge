"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  RiArrowRightLine,
  RiBuilding2Line,
  RiCheckboxCircleLine,
  RiHospitalLine,
  RiTimeLine,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
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
import { SocialPlatformIcon } from "@/components/marketing/social-platform-icons";
import type { SocialPlatform } from "@/components/marketing/social-platform-icons";

type OrgType = "hospital" | "facility";

const highlights = [
  {
    icon: RiTimeLine,
    title: "Place patients faster",
    copy: "Match open beds by specialty, distance, and capacity in one referral flow.",
  },
  {
    icon: RiHospitalLine,
    title: "Built for discharge teams",
    copy: "Social workers, discharge planners, and coordinators work from a shared queue.",
  },
  {
    icon: RiBuilding2Line,
    title: "Grow your facility network",
    copy: "Post-acute partners list availability so hospitals can find the right bed today.",
  },
];

const channels: SocialPlatform[] = ["linkedin", "x", "facebook", "instagram"];

export function LeadGenClient() {
  const [orgType, setOrgType] = useState<OrgType>("hospital");
  const [role, setRole] = useState("discharge-planner");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 700);
  }

  return (
    <div className="relative min-h-svh overflow-hidden bg-[#07111f] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 15% 10%, rgba(68,190,175,0.28), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 0%, rgba(19,70,117,0.55), transparent 50%), linear-gradient(180deg, #07111f 0%, #0a1628 45%, #10243a 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-svh w-full max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/logos/Dark.png"
              alt="CareBridge"
              width={160}
              height={44}
              className="h-10 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-2">
            {channels.map((platform) => (
              <SocialPlatformIcon key={platform} platform={platform} className="size-7" />
            ))}
          </div>
        </header>

        <main className="mt-10 grid flex-1 items-center gap-12 lg:mt-0 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <section className="max-w-xl">
            <p className="font-heading text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              CareBridge
            </p>
            <h1 className="mt-5 max-w-lg font-heading text-2xl font-medium tracking-tight text-white/95 sm:text-3xl">
              Cut placement delays. Fill open beds. Connect the continuum of care.
            </h1>
            <p className="mt-4 max-w-md text-base leading-7 text-white/70">
              Request a walkthrough for your hospital discharge team or facility network.
              This is a demo lead form — no data is stored.
            </p>

            <ul className="mt-10 space-y-5">
              {highlights.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#44BEAF]/15 text-[#7FE0D3]">
                    <item.icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-white/65">{item.copy}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="w-full">
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-8">
              {submitted ? (
                <div className="flex flex-col items-start gap-4 py-6">
                  <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#44BEAF]/20 text-[#7FE0D3]">
                    <RiCheckboxCircleLine className="size-6" />
                  </span>
                  <div>
                    <h2 className="font-heading text-2xl font-semibold tracking-tight text-white">
                      Thanks — we&apos;ll be in touch
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      Your demo request was captured locally for this prototype.
                      A CareBridge specialist would normally follow up about placement workflows
                      for your organization.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-2 border-white/20 bg-transparent text-white hover:bg-white/10"
                    onClick={() => setSubmitted(false)}
                  >
                    Submit another request
                  </Button>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={onSubmit}>
                  <div>
                    <h2 className="font-heading text-2xl font-semibold tracking-tight text-white">
                      Book a product walkthrough
                    </h2>
                    <p className="mt-1 text-sm text-white/65">
                      Tell us how your team places patients today.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <Label htmlFor="name" className="text-white/80">
                        Full name
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        required
                        placeholder="Alex Rivera"
                        className="border-white/15 bg-white/5 text-white placeholder:text-white/35"
                      />
                    </Field>
                    <Field>
                      <Label htmlFor="email" className="text-white/80">
                        Work email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="alex@hospital.org"
                        className="border-white/15 bg-white/5 text-white placeholder:text-white/35"
                      />
                    </Field>
                  </div>

                  <Field>
                    <Label htmlFor="organization" className="text-white/80">
                      Organization
                    </Label>
                    <Input
                      id="organization"
                      name="organization"
                      required
                      placeholder="Riverside Health System"
                      className="border-white/15 bg-white/5 text-white placeholder:text-white/35"
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <Label className="text-white/80">Organization type</Label>
                      <Select
                        value={orgType}
                        onValueChange={(value) => setOrgType((value ?? "hospital") as OrgType)}
                      >
                        <SelectTrigger className="w-full border-white/15 bg-white/5 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hospital">Hospital / health system</SelectItem>
                          <SelectItem value="facility">Post-acute facility</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <Label className="text-white/80">Your role</Label>
                      <Select
                        value={role}
                        onValueChange={(value) => setRole(value ?? "discharge-planner")}
                      >
                        <SelectTrigger className="w-full border-white/15 bg-white/5 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="discharge-planner">Discharge planner</SelectItem>
                          <SelectItem value="social-worker">Social worker</SelectItem>
                          <SelectItem value="care-coordinator">Care coordinator</SelectItem>
                          <SelectItem value="facility-admin">Facility administrator</SelectItem>
                          <SelectItem value="executive">Executive / ops</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <Field>
                    <Label htmlFor="interest" className="text-white/80">
                      What should we focus on?
                    </Label>
                    <Textarea
                      id="interest"
                      name="interest"
                      rows={3}
                      placeholder="e.g. Faster SNF matching, capacity visibility, documentation vault…"
                      className="border-white/15 bg-white/5 text-white placeholder:text-white/35"
                    />
                  </Field>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-11 w-full bg-[#44BEAF] text-[#06201c] hover:bg-[#5acbbb]"
                  >
                    {submitting ? "Sending…" : "Request walkthrough"}
                    <RiArrowRightLine data-icon className="size-4" />
                  </Button>

                  <p className="text-center text-xs text-white/45">
                    Dummy frontend only · No PHI · Not a live CRM submission
                  </p>
                </form>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-2">{children}</div>;
}
