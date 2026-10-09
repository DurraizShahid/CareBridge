import Link from "next/link";
import { ArrowUpRight, ArrowRight, Building2, ClipboardList, FileSignature, HeartHandshake, ShieldCheck, CreditCard } from "lucide-react";
import { AuthControls } from "@/components/auth-controls";
import { BrandLogo, BrandMark } from "@/components/brand-logo";

const steps = [
  { number: "01", title: "Understand the patient", detail: "Record care needs and preferences in the hospital workspace.", Icon: ClipboardList },
  { number: "02", title: "Find appropriate care", detail: "Compare facilities against level of care, services, and available beds.", Icon: Building2 },
  { number: "03", title: "Coordinate the referral", detail: "Share the referral and receive a decision from the facility.", Icon: HeartHandshake },
  { number: "04", title: "Agree on the placement", detail: "Both organizations review and electronically sign the agreement.", Icon: FileSignature },
  { number: "05", title: "Confirm the deposit", detail: "Confirm the deposit, reserve the bed, and convert to a placement.", Icon: CreditCard },
];

export default function HomePage() {
  return <div className="landing-root min-h-screen overflow-hidden bg-brand-canvas text-brand-navy" style={{ colorScheme: "light" }}>
    <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
      <Link href="/" aria-label="CareBridge Health home" className="flex shrink-0 items-center">
        <BrandLogo className="w-[178px] sm:w-[205px]" priority />
      </Link>
      <nav aria-label="Main navigation" className="hidden items-center gap-8 text-sm font-medium text-[#51647D] md:flex">
        <a href="#how-it-works" className="transition-colors hover:text-brand-blue">How it works</a>
        <a href="#platform" className="transition-colors hover:text-brand-blue">The platform</a>
      </nav>
      <div className="flex items-center gap-2"><AuthControls /></div>
    </header>

    <main>
      <section className="brand-mesh relative isolate mx-auto flex max-w-[1440px] items-center overflow-hidden rounded-b-[42px] px-6 pb-20 pt-16 lg:min-h-[700px] lg:px-16 lg:pb-28 lg:pt-24">
        <div aria-hidden="true" className="brand-breathe pointer-events-none absolute -right-24 -top-28 size-[480px] rounded-full bg-brand-azure/25 blur-[100px]" />
        <div aria-hidden="true" className="brand-breathe pointer-events-none absolute -bottom-56 left-1/3 size-[470px] rounded-full bg-[#DCEBFF]/70 blur-[96px]" />
        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold tracking-[.07em] text-brand-blue shadow-[0_8px_24px_rgba(16,43,78,.05)]">
              <span className="size-2 rounded-full bg-brand-blue" /> PATIENT PLACEMENT, CONNECTED
            </span>
            <h1 className="mt-8 text-[clamp(3.25rem,5.7vw,6rem)] font-semibold leading-[1.045] tracking-[-.067em]">
              A clearer path <span className="text-brand-blue">from hospital</span> to care.
            </h1>
            <p className="mt-7 max-w-lg text-base leading-8 text-[#5D718A] sm:text-lg">
              Bring social workers and receiving care facilities together in one considered workflow. From first referral to signed agreement and confirmed placement.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/sign-in" className="brand-cta min-h-14 px-8 text-sm">Open your workspace <ArrowUpRight size={18}/></Link>
              <a href="#how-it-works" className="inline-flex min-h-14 items-center gap-2 rounded-full bg-white/80 px-7 text-sm font-semibold text-brand-navy shadow-[0_8px_24px_rgba(16,43,78,.06)] transition-all hover:-translate-y-0.5 hover:bg-white">Explore the workflow <ArrowRight size={17}/></a>
            </div>
            <div className="mt-12 flex items-center gap-3 text-xs text-[#73849A]">
              <ShieldCheck className="size-5 text-brand-blue"/>
              Purpose-built for hospital-to-facility coordination
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[520px]">
            <div aria-hidden="true" className="brand-breathe absolute -inset-8 rounded-full bg-brand-azure/25 blur-3xl" />
            <div className="brand-float relative overflow-hidden p-6 sm:p-9">
              <div className="flex items-center justify-between">
                <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#8BA0BA]">THE CAREBRIDGE PATHWAY</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-brand-navy">One connected journey</h2>
                </div>
                <div className="rounded-[20px] bg-brand-mist p-2.5"><BrandMark tone="blue" className="size-10"/></div>
              </div>
              <div className="mt-8 space-y-2">
                {steps.map(({number,title,Icon},index)=><div key={number} className="flex items-center gap-4 rounded-[22px] bg-[#F7F9FD] px-4 py-4 transition-transform duration-300 hover:-translate-y-0.5">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-blue shadow-[0_4px_18px_rgba(16,43,78,.06)]">
                    <Icon size={21} strokeWidth={1.8}/>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="brand-dot-stat text-lg leading-none" aria-label={"Step "+number}>{number}</span>
                    <p className="mt-1 text-sm font-semibold text-brand-navy">{title}</p>
                  </div>
                  {index === steps.length - 1 ? <span className="rounded-full bg-[#D9F477] px-3 py-1 text-[10px] font-semibold text-[#344A15]">Complete</span> : <ArrowRight size={17} className="text-[#A3B2C5]"/>}
                </div>)}
              </div>
              <p className="mt-6 text-xs leading-5 text-[#90A0B2]">Illustrative workflow · No patient details displayed</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <div className="max-w-2xl">
          <span className="rounded-full bg-brand-mist px-4 py-2 text-xs font-semibold tracking-[.1em] text-brand-blue">HOW IT WORKS</span>
          <h2 className="mt-6 text-4xl font-semibold tracking-[-.055em] text-brand-navy sm:text-5xl">Every transition, thoughtfully connected.</h2>
          <p className="mt-5 text-base leading-8 text-[#75869A]">The essential placement process, without the back-and-forth between disconnected tools.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {steps.map(({number,title,detail,Icon})=><article key={number} className="brand-float group min-h-64 p-8 transition-transform duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div className="flex size-12 items-center justify-center rounded-[17px] bg-brand-mist text-brand-blue transition-transform duration-300 group-hover:scale-105"><Icon size={23} strokeWidth={1.8}/></div>
              <span className="brand-dot-stat text-5xl" aria-label={"Step "+number}>{number}</span>
            </div>
            <h3 className="mt-9 text-xl font-semibold tracking-tight text-brand-navy">{title}</h3>
            <p className="mt-3 text-sm leading-7 text-[#70839B]">{detail}</p>
          </article>)}
          <article className="relative flex min-h-64 flex-col justify-between overflow-hidden rounded-[30px] bg-brand-navy p-8 text-white shadow-[0_20px_60px_rgba(16,43,78,.18)]">
            <div aria-hidden="true" className="brand-breathe pointer-events-none absolute -right-12 -top-10 size-48 rounded-full bg-brand-blue/60 blur-[70px]"/>
            <BrandMark tone="white" className="relative size-9"/>
            <div className="relative"><h3 className="text-xl font-semibold tracking-tight">A calmer way to coordinate care.</h3>
              <p className="mt-2 text-sm leading-6 text-[#A9BDD6]">Referrals, agreements and deposits in one considered workspace.</p>
              <Link href="/sign-in" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#D9F477] transition-transform hover:-translate-y-0.5">Go to CareBridge <ArrowUpRight size={16}/></Link></div>
          </article>
        </div>
      </section>

      <section id="platform" className="mx-auto mb-20 max-w-[1380px] px-6 lg:px-10">
        <div className="relative overflow-hidden rounded-[38px] bg-brand-mist px-8 py-16 text-center sm:px-12">
          <div aria-hidden="true" className="brand-breathe absolute -right-20 -top-24 size-[300px] rounded-full bg-brand-azure/30 blur-3xl"/>
          <div aria-hidden="true" className="brand-breathe absolute -bottom-28 -left-16 size-[260px] rounded-full bg-[#D9F477]/25 blur-3xl"/>
          <BrandMark tone="blue" className="relative mx-auto size-14"/>
          <h2 className="relative mx-auto mt-6 max-w-xl text-3xl font-semibold tracking-[-.045em] text-brand-navy sm:text-4xl">Care decisions deserve a considered workspace.</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-sm leading-7 text-[#71829A]">Explore patient intake, facility matching, referrals and signed placement agreements in one platform.</p>
          <Link href="/sign-in" className="brand-cta relative mt-8 min-h-13 px-8 text-sm">Sign in <ArrowUpRight size={17}/></Link>
        </div>
      </section>
    </main>
    <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 pb-12 pt-5 lg:px-10">
      <BrandLogo className="w-[160px]"/>
      <p className="text-xs text-[#8796A9]">CareBridge Health · Hospital-to-care-home placement coordination</p>
    </footer>
  </div>;
}
