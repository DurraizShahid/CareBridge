import Link from "next/link";
import { ArrowUpRight, ArrowRight, Building2, ClipboardList, FileSignature, HeartHandshake, ShieldCheck, CreditCard, Send, Hospital, Zap, FlaskConical, Check } from "lucide-react";
import { AuthControls } from "@/components/auth-controls";
import { BrandLogo, BrandMark } from "@/components/brand-logo";

const steps = [
  { number: "01", title: "Create the intake", detail: "Record the patient's care needs, level of care, and preferences in the hospital workspace.", Icon: ClipboardList },
  { number: "02", title: "Match facilities", detail: "Compare vetted facilities by level of care, services, and live bed availability.", Icon: Building2 },
  { number: "03", title: "Send the referral", detail: "One click to the facility. No fax, no phone tag, no lost paperwork.", Icon: Send },
  { number: "04", title: "Get a decision", detail: "The facility accepts or declines — you see the answer the moment it happens.", Icon: HeartHandshake },
  { number: "05", title: "Sign the contract", detail: "A placement agreement is auto-generated and e-signed by both sides, in the app.", Icon: FileSignature },
  { number: "06", title: "Secure the deposit", detail: "The Stripe deposit atomically reserves the bed, then converts to a confirmed placement.", Icon: CreditCard },
];

const trustItems = [
  { title: "E-signatures built in", detail: "Both organizations sign the placement agreement without leaving CareBridge.", Icon: FileSignature },
  { title: "Beds reserved atomically", detail: "The deposit and the bed reservation happen as one action. No double-booking.", Icon: Zap },
  { title: "No patient data in Stripe", detail: "Payments carry no health information, ever. PHI stays in your workspace.", Icon: ShieldCheck },
  { title: "Demo mode included", detail: "Evaluate the full money loop with simulated payments before going live.", Icon: FlaskConical },
];

function Dots({ value }: { value: number }) {
  return <div className="flex items-center gap-1" aria-hidden="true">
    {Array.from({ length: 10 }).map((_, i) => (
      <span key={i} className={"size-1.5 rounded-full " + (i < Math.round(value / 10) ? "bg-brand-blue" : "bg-[#DCE5F2]")} />
    ))}
  </div>;
}

export default function HomePage() {
  return <div className="landing-root min-h-screen overflow-hidden bg-brand-canvas text-brand-navy" style={{ colorScheme: "light" }}>
    <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
      <Link href="/" aria-label="CareBridge Health home" className="flex shrink-0 items-center">
        <BrandLogo className="w-[178px] sm:w-[205px]" priority />
      </Link>
      <nav aria-label="Main navigation" className="hidden items-center gap-8 text-sm font-medium text-[#51647D] md:flex">
        <a href="#how-it-works" className="transition-colors hover:text-brand-blue">How it works</a>
        <a href="#both-sides" className="transition-colors hover:text-brand-blue">Both sides</a>
        <a href="#product" className="transition-colors hover:text-brand-blue">Product</a>
      </nav>
      <div className="flex items-center gap-2"><AuthControls /></div>
    </header>

    <main>
      {/* HERO */}
      <section className="brand-mesh relative isolate mx-auto flex max-w-[1440px] items-center overflow-hidden rounded-b-[42px] px-6 pb-20 pt-16 lg:min-h-[720px] lg:px-16 lg:pb-28 lg:pt-24">
        <div aria-hidden="true" className="brand-breathe pointer-events-none absolute -right-24 -top-28 size-[480px] rounded-full bg-brand-azure/25 blur-[100px]" />
        <div aria-hidden="true" className="brand-breathe pointer-events-none absolute -bottom-56 left-1/3 size-[470px] rounded-full bg-[#DCEBFF]/70 blur-[96px]" />
        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold tracking-[.07em] text-brand-blue shadow-[0_8px_24px_rgba(16,43,78,.05)]">
              <span className="size-2 rounded-full bg-brand-blue" /> HOSPITAL-TO-CARE-HOME PLACEMENT
            </span>
            <h1 className="mt-8 text-[clamp(2.9rem,5.2vw,5.25rem)] font-semibold leading-[1.06] tracking-[-.06em]">
              From hospital discharge to <span className="text-brand-blue">confirmed placement</span>. Without the phone tag.
            </h1>
            <p className="mt-7 max-w-lg text-base leading-8 text-[#5D718A] sm:text-lg">
              CareBridge is the shared workspace for discharge planners and care facilities: build the intake, match the right facility, send the referral, e-sign the contract, and lock the bed with a deposit — in one flow, not five tools.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/sign-in" className="brand-cta min-h-14 px-8 text-sm">Start placing patients <ArrowUpRight size={18}/></Link>
              <a href="#how-it-works" className="inline-flex min-h-14 items-center gap-2 rounded-full bg-white/80 px-7 text-sm font-semibold text-brand-navy shadow-[0_8px_24px_rgba(16,43,78,.06)] transition-all hover:-translate-y-0.5 hover:bg-white">See how it works <ArrowRight size={17}/></a>
            </div>
            <div className="mt-12 flex items-center gap-3 text-xs text-[#73849A]">
              <ShieldCheck className="size-5 text-brand-blue"/>
              Purpose-built for hospital-to-facility coordination
            </div>
          </div>

          {/* Product visual: referral card over placement status */}
          <div className="relative mx-auto w-full max-w-[540px]">
            <div aria-hidden="true" className="brand-breathe absolute -inset-8 rounded-full bg-brand-azure/25 blur-3xl" />
            <div className="brand-float relative rotate-1 p-6 opacity-90 sm:p-7" aria-hidden="true">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-[#D9F477] text-[#344A15]"><Check size={18} strokeWidth={2.5}/></span>
                <div><p className="text-sm font-semibold">Placement confirmed</p><p className="text-xs text-[#75869A]">Mercy General → Oakwood Care Home</p></div>
              </div>
              <div className="mt-4 flex gap-2 text-[11px] font-semibold">
                <span className="rounded-full bg-brand-mist px-3 py-1 text-brand-blue">Contract e-signed</span>
                <span className="rounded-full bg-brand-mist px-3 py-1 text-brand-blue">Deposit secured</span>
                <span className="rounded-full bg-[#D9F477] px-3 py-1 text-[#344A15]">Bed 4B reserved</span>
              </div>
            </div>
            <div className="brand-float relative -mt-6 -rotate-1 p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#8BA0BA]">NEW REFERRAL</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight">Skilled nursing · Intake #2481</h2></div>
                <div className="rounded-[20px] bg-brand-mist p-2.5"><BrandMark tone="blue" className="size-10"/></div>
              </div>
              <div className="mt-6 space-y-2">
                {[
                  { name: "Oakwood Care Home", score: 92, beds: "3 beds open" },
                  { name: "Hillcrest Living", score: 87, beds: "1 bed open" },
                  { name: "Lakeside Manor", score: 81, beds: "5 beds open" },
                ].map((f) => <div key={f.name} className="flex items-center gap-4 rounded-[20px] bg-[#F7F9FD] px-4 py-3.5">
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{f.name}</p><p className="text-xs text-[#75869A]">{f.beds}</p></div>
                  <Dots value={f.score} />
                  <span className="brand-dot-stat text-xl">{f.score}</span>
                </div>)}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <p className="text-xs text-[#90A0B2]">Illustrative data · No real patient details</p>
                <span className="brand-cta px-6 py-3 text-xs">Send referral <Send size={14}/></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="mx-auto max-w-7xl px-6 pt-20 lg:px-10">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {trustItems.map(({title, detail, Icon}) => <div key={title} className="brand-float flex gap-4 p-6">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-mist text-brand-blue"><Icon size={21} strokeWidth={1.8}/></div>
            <div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-[13px] leading-6 text-[#75869A]">{detail}</p></div>
          </div>)}
        </div>
      </section>

      {/* HOW PLACEMENT WORKS */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <div className="max-w-2xl">
          <span className="rounded-full bg-brand-mist px-4 py-2 text-xs font-semibold tracking-[.1em] text-brand-blue">HOW PLACEMENT WORKS</span>
          <h2 className="mt-6 text-4xl font-semibold tracking-[-.055em] sm:text-5xl">Six steps. One shared workspace.</h2>
          <p className="mt-5 text-base leading-8 text-[#75869A]">The discharge-to-placement journey, exactly as it happens in CareBridge — no fax machine required.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {steps.map(({number,title,detail,Icon})=><article key={number} className="brand-float group min-h-60 p-8 transition-transform duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div className="flex size-12 items-center justify-center rounded-[17px] bg-brand-mist text-brand-blue transition-transform duration-300 group-hover:scale-105"><Icon size={23} strokeWidth={1.8}/></div>
              <span className="brand-dot-stat text-5xl" aria-label={"Step "+number}>{number}</span>
            </div>
            <h3 className="mt-8 text-xl font-semibold tracking-tight">{title}</h3>
            <p className="mt-3 text-sm leading-7 text-[#70839B]">{detail}</p>
          </article>)}
        </div>
      </section>

      {/* BUILT FOR BOTH SIDES */}
      <section id="both-sides" className="mx-auto max-w-7xl px-6 pb-24 lg:px-10 lg:pb-32">
        <div className="max-w-2xl">
          <span className="rounded-full bg-brand-mist px-4 py-2 text-xs font-semibold tracking-[.1em] text-brand-blue">BUILT FOR BOTH SIDES</span>
          <h2 className="mt-6 text-4xl font-semibold tracking-[-.055em] sm:text-5xl">Placement takes two teams.</h2>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <article className="brand-float relative overflow-hidden p-8 sm:p-10">
            <div className="relative flex size-12 items-center justify-center rounded-[17px] bg-brand-mist text-brand-blue"><Hospital size={23} strokeWidth={1.8}/></div>
            <h3 className="relative mt-6 text-2xl font-semibold tracking-tight">For hospital discharge planners</h3>
            <ul className="relative mt-5 space-y-3 text-[15px] leading-7 text-[#5D718A]">
              <li className="flex gap-3"><Check size={18} className="mt-1 shrink-0 text-brand-blue"/> Broadcast a referral to matched facilities instead of calling down a list.</li>
              <li className="flex gap-3"><Check size={18} className="mt-1 shrink-0 text-brand-blue"/> Watch accept / decline decisions land in real time.</li>
              <li className="flex gap-3"><Check size={18} className="mt-1 shrink-0 text-brand-blue"/> Get the contract e-signed and the bed locked without chasing paperwork.</li>
            </ul>
          </article>
          <article className="relative flex flex-col justify-between overflow-hidden rounded-[30px] bg-brand-navy p-8 text-white shadow-[0_20px_60px_rgba(16,43,78,.18)] sm:p-10">
            <div aria-hidden="true" className="brand-breathe pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-brand-blue/50 blur-[80px]"/>
            <div className="relative flex size-12 items-center justify-center rounded-[17px] bg-white/10 text-[#CFE3FF]"><Building2 size={23} strokeWidth={1.8}/></div>
            <h3 className="relative mt-6 text-2xl font-semibold tracking-tight">For care facility admins</h3>
            <ul className="relative mt-5 space-y-3 text-[15px] leading-7 text-[#B9C9DE]">
              <li className="flex gap-3"><Check size={18} className="mt-1 shrink-0 text-[#D9F477]"/> Receive qualified referrals with the clinical picture already attached.</li>
              <li className="flex gap-3"><Check size={18} className="mt-1 shrink-0 text-[#D9F477]"/> Accept or decline in one click — your open beds stay accurate.</li>
              <li className="flex gap-3"><Check size={18} className="mt-1 shrink-0 text-[#D9F477]"/> Sign the agreement and collect the deposit in the same flow.</li>
            </ul>
          </article>
        </div>
      </section>

      {/* PRODUCT MOMENTS */}
      <section id="product" className="mx-auto max-w-7xl px-6 pb-24 lg:px-10 lg:pb-32">
        <div className="max-w-2xl">
          <span className="rounded-full bg-brand-mist px-4 py-2 text-xs font-semibold tracking-[.1em] text-brand-blue">INSIDE THE PRODUCT</span>
          <h2 className="mt-6 text-4xl font-semibold tracking-[-.055em] sm:text-5xl">The moments that matter.</h2>
          <p className="mt-5 text-base leading-8 text-[#75869A]">Illustrative mockups of the real workflow — the app looks and works like this.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <div className="brand-float p-7">
            <p className="flex items-center justify-between text-sm font-semibold">Referral inbox <span className="rounded-full bg-brand-mist px-3 py-1 text-xs text-brand-blue">3 active</span></p>
            <div className="mt-5 space-y-2">
              {[
                { who: "Intake #2481 → Oakwood", status: "Accepted", cls: "bg-[#D9F477] text-[#344A15]" },
                { who: "Intake #2479 → Hillcrest", status: "Pending", cls: "bg-brand-mist text-brand-blue" },
                { who: "Intake #2474 → Lakeside", status: "Declined", cls: "bg-[#FBEAEA] text-[#A33B3B]" },
              ].map((r) => <div key={r.who} className="flex items-center justify-between rounded-2xl bg-[#F7F9FD] px-4 py-3">
                <p className="text-sm font-medium">{r.who}</p><span className={"rounded-full px-3 py-1 text-[11px] font-semibold " + r.cls}>{r.status}</span>
              </div>)}
            </div>
          </div>
          <div className="brand-float p-7">
            <p className="text-sm font-semibold">Placement agreement</p>
            <div className="mt-5 rounded-2xl bg-[#F7F9FD] p-5">
              <div className="h-2.5 w-2/3 rounded-full bg-[#E2EAF5]"/><div className="mt-2.5 h-2.5 w-full rounded-full bg-[#EAEFF7]"/><div className="mt-2.5 h-2.5 w-5/6 rounded-full bg-[#EAEFF7]"/>
              <div className="mt-5 space-y-2.5">
                {[ "Mercy General Hospital", "Oakwood Care Home" ].map((s) => <div key={s} className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5 shadow-[0_4px_18px_rgba(16,43,78,.05)]">
                  <p className="text-[13px] font-medium">{s}</p><span className="flex items-center gap-1.5 text-xs font-semibold text-brand-blue"><Check size={14} strokeWidth={2.5}/> Signed</span>
                </div>)}
              </div>
            </div>
          </div>
          <div className="brand-float p-7">
            <p className="flex items-center justify-between text-sm font-semibold">Deposit checkout <span className="rounded-full bg-[#D9F477] px-3 py-1 text-[11px] font-semibold text-[#344A15]">DEMO MODE</span></p>
            <div className="mt-5 rounded-2xl bg-[#F7F9FD] p-5">
              <div className="flex items-baseline justify-between"><p className="text-xs text-[#75869A]">Placement deposit</p><p className="text-3xl font-extrabold tabular-nums tracking-tight text-brand-navy">$1,500</p></div>
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-[0_4px_18px_rgba(16,43,78,.05)]">
                <CreditCard size={18} className="text-brand-blue"/><p className="text-sm font-medium tracking-widest">4242</p><p className="ml-auto text-xs text-[#75869A]">Illustrative</p>
              </div>
              <span className="brand-cta mt-4 w-full py-3.5 text-sm">Pay deposit</span>
              <p className="mt-3 text-center text-xs text-[#90A0B2]">Demo mode — no real charge. Paying reserves Bed 4B instantly.</p>
            </div>
          </div>
          <div className="relative flex flex-col justify-between overflow-hidden rounded-[30px] bg-brand-navy p-8 text-white shadow-[0_20px_60px_rgba(16,43,78,.18)]">
            <div aria-hidden="true" className="brand-breathe pointer-events-none absolute -right-12 -top-10 size-48 rounded-full bg-brand-blue/60 blur-[70px]"/>
            <BrandMark tone="white" className="relative size-9"/>
            <div className="relative"><h3 className="text-xl font-semibold tracking-tight">One workspace, both signatures, zero fax.</h3>
              <p className="mt-2 text-sm leading-6 text-[#A9BDD6]">The contract, the deposit, and the bed — settled in a single flow.</p>
              <Link href="/sign-in" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#D9F477] transition-transform hover:-translate-y-0.5">Go to CareBridge <ArrowUpRight size={16}/></Link></div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mb-20 max-w-[1380px] px-6 lg:px-10">
        <div className="relative overflow-hidden rounded-[38px] bg-brand-mist px-8 py-16 text-center sm:px-12 sm:py-20">
          <div aria-hidden="true" className="brand-breathe absolute -right-20 -top-24 size-[300px] rounded-full bg-brand-azure/30 blur-3xl"/>
          <div aria-hidden="true" className="brand-breathe absolute -bottom-28 -left-16 size-[260px] rounded-full bg-[#D9F477]/25 blur-3xl"/>
          <BrandMark tone="blue" className="relative mx-auto size-14"/>
          <h2 className="relative mx-auto mt-6 max-w-xl text-3xl font-semibold tracking-[-.045em] sm:text-4xl">Stop discharging into the void.</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-sm leading-7 text-[#71829A]">Send the referral, get the decision, sign the agreement, lock the bed — start coordinating placements with CareBridge.</p>
          <Link href="/sign-in" className="brand-cta relative mt-8 min-h-13 px-8 text-sm">Start coordinating placements <ArrowUpRight size={17}/></Link>
        </div>
      </section>
    </main>
    <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 pb-12 pt-5 lg:px-10">
      <BrandLogo className="w-[160px]"/>
      <p className="text-xs text-[#8796A9]">CareBridge Health · Hospital-to-care-home placement coordination</p>
    </footer>
  </div>;
}
