import {
  Heart,
  HomeIcon,
  Users,
  Shield,
  CheckCircle2,
  Building2,
  FileCheck,
  TrendingUp,
  Award,
  BookOpen,
  Phone,
  ArrowUpRight,
  ArrowRight,
  Stethoscope,
  MapPin,
  Clock,
  Search,
} from "lucide-react";
import Image from "next/image";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

const stats = [
  { value: "85%", label: "Faster placement decisions" },
  { value: "3x", label: "More facilities matched" },
  { value: "92%", label: "Patient satisfaction" },
  { value: "1,200+", label: "Facilities onboarded" },
];

const customerLogos = [
  "Mount Sinai Health",
  "Cleveland Clinic",
  " Mayo Clinic",
  "Johns Hopkins",
  "Mass General",
  "Cedars-Sinai",
];

export default function Page() {
  return (
    <div className="flex flex-col flex-1">
      <main className="flex-1">
        {/* Hero Section - Full screen with background image */}
        <section className="relative h-screen min-h-[600px] overflow-hidden">
          {/* Background image */}
          <Image
            src="/Images/hero.png"
            alt=""
            fill
            priority
            className="object-cover"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#134675]/90 via-[#134675]/40 to-transparent" />

          {/* Navbar */}
          <Navbar />

          {/* Content - Left aligned with logo */}
          <div className="absolute inset-0 z-10 flex items-center">
            <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
              <div className="ml-[70px] max-w-2xl">
                <h1 className="font-heading text-4xl font-bold tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl xl:text-7xl">
                  CareBridge secures{" "}
                  <span className="text-[#44BEAF]">patient placement</span>
                </h1>
                <p className="mt-4 text-lg leading-7 text-white/80 drop-shadow-md sm:text-xl sm:leading-8">
                  Connecting patients to the right care settings — from skilled
                  nursing to home health — faster, smarter, and with confidence.
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <a
                    href="/sign-up"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-8 text-sm font-semibold text-[#134675] shadow-lg transition-all hover:bg-white/90 hover:shadow-xl active:translate-y-px"
                  >
                    Get started
                  </a>
                  <a
                    href="#contact"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-white/40 bg-white/10 px-8 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:translate-y-px"
                  >
                    Contact sales
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar - Bottom */}
          <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8">
            <div className="mx-auto max-w-7xl">
              <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-5 shadow-xl backdrop-blur-md sm:p-6">
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                  {/* Location input */}
                  <div className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 transition-colors focus-within:border-[#44BEAF]/50 focus-within:ring-2 focus-within:ring-[#44BEAF]/20 sm:flex-1">
                    <MapPin className="h-5 w-5 shrink-0 text-white/60" />
                    <input
                      type="text"
                      placeholder="City, state, or ZIP code"
                      className="w-full bg-transparent text-sm text-white placeholder-white/40 outline-none"
                    />
                  </div>

                  {/* Care level select */}
                  <div className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 transition-colors focus-within:border-[#44BEAF]/50 focus-within:ring-2 focus-within:ring-[#44BEAF]/20 sm:flex-1">
                    <Stethoscope className="h-5 w-5 shrink-0 text-white/60" />
                    <select
                      defaultValue=""
                      className="w-full appearance-none bg-transparent text-sm text-white outline-none [&>option]:bg-[#134675] [&>option]:text-white"
                    >
                      <option value="" disabled className="text-white/40">
                        Care level needed
                      </option>
                      <option value="skilled-nursing">Skilled Nursing</option>
                      <option value="rehab">Rehabilitation</option>
                      <option value="assisted-living">Assisted Living</option>
                      <option value="home-health">Home Health</option>
                      <option value="memory-care">Memory Care</option>
                      <option value="ltc">Long-Term Care</option>
                    </select>
                  </div>

                  {/* Search button */}
                  <button
                    type="button"
                    className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-[#44BEAF] px-6 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 hover:shadow-xl active:translate-y-px sm:w-auto"
                  >
                    <Search className="h-4 w-4" />
                    <span>Find Facilities</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Bar - Company logos */}
        <section className="border-y border-gray-200 bg-gray-100 py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <p className="text-center text-base font-semibold text-gray-700">
              Trusted by leading healthcare organizations
            </p>
            <div className="mt-8 flex items-center justify-center gap-8 sm:gap-12 lg:gap-16">
              {customerLogos.map((logo) => (
                <span
                  key={logo}
                  className="text-base font-semibold text-gray-600 sm:text-lg"
                >
                  {logo}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Showcase - 4 cards in one row */}
        <section id="features" className="bg-gradient-to-br from-[#134675] via-[#1a5c8f] to-[#44BEAF] py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
                CareBridge secures patient placement
              </h2>
              <p className="mt-4 text-lg text-white/80">
                Our neutral and extensible platform lets you secure every
                patient placement across its full lifecycle.
              </p>
            </div>

            {/* 4 Cards in one row */}
            <div className="mx-auto mt-16 grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Card 1 - Social Worker Portal */}
              <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(0,0,0,0.1),0_0_20px_rgba(255,255,255,0.1)]">
                <div className="absolute inset-0 rounded-3xl shadow-[inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.1)]" />
                <div className="absolute inset-x-0 top-0 h-px rounded-t-3xl bg-gradient-to-r from-white/0 via-white/50 to-white/0" />
                <div className="absolute inset-y-0 left-0 w-px rounded-l-3xl bg-gradient-to-b from-white/0 via-white/50 to-white/0" />
                <div className="absolute inset-x-0 bottom-0 h-px rounded-b-3xl bg-gradient-to-r from-black/0 via-black/20 to-black/0" />
                <div className="absolute inset-y-0 right-0 w-px rounded-r-3xl bg-gradient-to-b from-black/0 via-black/20 to-black/0" />
                <div className="absolute -left-16 -top-16 h-32 w-32 rotate-45 bg-gradient-to-br from-pink-400/20 via-purple-400/20 to-cyan-400/20 blur-3xl" />
                <div className="absolute -bottom-16 -right-16 h-32 w-32 rotate-45 bg-gradient-to-br from-cyan-400/20 via-blue-400/20 to-purple-400/20 blur-3xl" />
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="mt-4 font-heading text-lg font-bold leading-tight text-white">
                    Social Worker Portal
                  </h4>
                  <div className="my-4 h-px w-full bg-gradient-to-r from-pink-300/30 via-purple-300/30 to-cyan-300/30" />
                  <p className="text-sm leading-relaxed text-white/70">
                    Streamlined case management tools for hospital social workers and discharge planners.
                  </p>
                  <div className="mt-4 space-y-2">
                    {["Real-time availability", "HIPAA compliant"].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-[#44BEAF]" />
                        <span className="text-xs text-white/70">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 2 - Care Setting Discovery */}
              <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(0,0,0,0.1),0_0_20px_rgba(255,255,255,0.1)]">
                <div className="absolute inset-0 rounded-3xl shadow-[inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.1)]" />
                <div className="absolute inset-x-0 top-0 h-px rounded-t-3xl bg-gradient-to-r from-white/0 via-white/50 to-white/0" />
                <div className="absolute inset-y-0 left-0 w-px rounded-l-3xl bg-gradient-to-b from-white/0 via-white/50 to-white/0" />
                <div className="absolute inset-x-0 bottom-0 h-px rounded-b-3xl bg-gradient-to-r from-black/0 via-black/20 to-black/0" />
                <div className="absolute inset-y-0 right-0 w-px rounded-r-3xl bg-gradient-to-b from-black/0 via-black/20 to-black/0" />
                <div className="absolute -left-16 -top-16 h-32 w-32 rotate-45 bg-gradient-to-br from-cyan-400/20 via-blue-400/20 to-purple-400/20 blur-3xl" />
                <div className="absolute -bottom-16 -right-16 h-32 w-32 rotate-45 bg-gradient-to-br from-pink-400/20 via-purple-400/20 to-cyan-400/20 blur-3xl" />
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                    <HomeIcon className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="mt-4 font-heading text-lg font-bold leading-tight text-white">
                    Care Setting Discovery
                  </h4>
                  <div className="my-4 h-px w-full bg-gradient-to-r from-cyan-300/30 via-blue-300/30 to-purple-300/30" />
                  <p className="text-sm leading-relaxed text-white/70">
                    Comprehensive directory of skilled nursing facilities, rehabilitation centers, and home health agencies.
                  </p>
                  <div className="mt-4 space-y-2">
                    {["1,200+ verified facilities", "Real-time availability"].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-[#44BEAF]" />
                        <span className="text-xs text-white/70">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 3 - Placement Coordination */}
              <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(0,0,0,0.1),0_0_20px_rgba(255,255,255,0.1)]">
                <div className="absolute inset-0 rounded-3xl shadow-[inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.1)]" />
                <div className="absolute inset-x-0 top-0 h-px rounded-t-3xl bg-gradient-to-r from-white/0 via-white/50 to-white/0" />
                <div className="absolute inset-y-0 left-0 w-px rounded-l-3xl bg-gradient-to-b from-white/0 via-white/50 to-white/0" />
                <div className="absolute inset-x-0 bottom-0 h-px rounded-b-3xl bg-gradient-to-r from-black/0 via-black/20 to-black/0" />
                <div className="absolute inset-y-0 right-0 w-px rounded-r-3xl bg-gradient-to-b from-black/0 via-black/20 to-black/0" />
                <div className="absolute -left-16 -top-16 h-32 w-32 rotate-45 bg-gradient-to-br from-green-400/20 via-teal-400/20 to-blue-400/20 blur-3xl" />
                <div className="absolute -bottom-16 -right-16 h-32 w-32 rotate-45 bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 blur-3xl" />
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="mt-4 font-heading text-lg font-bold leading-tight text-white">
                    Placement Coordination
                  </h4>
                  <div className="my-4 h-px w-full bg-gradient-to-r from-green-300/30 via-teal-300/30 to-blue-300/30" />
                  <p className="text-sm leading-relaxed text-white/70">
                    End-to-end placement workflow with secure communication and status tracking.
                  </p>
                  <div className="mt-4 space-y-2">
                    {["Secure messaging", "Status tracking"].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-[#44BEAF]" />
                        <span className="text-xs text-white/70">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 4 - Patient-Centered Matching */}
              <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(0,0,0,0.1),0_0_20px_rgba(255,255,255,0.1)]">
                <div className="absolute inset-0 rounded-3xl shadow-[inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.1)]" />
                <div className="absolute inset-x-0 top-0 h-px rounded-t-3xl bg-gradient-to-r from-white/0 via-white/50 to-white/0" />
                <div className="absolute inset-y-0 left-0 w-px rounded-l-3xl bg-gradient-to-b from-white/0 via-white/50 to-white/0" />
                <div className="absolute inset-x-0 bottom-0 h-px rounded-b-3xl bg-gradient-to-r from-black/0 via-black/20 to-black/0" />
                <div className="absolute inset-y-0 right-0 w-px rounded-r-3xl bg-gradient-to-b from-black/0 via-black/20 to-black/0" />
                <div className="absolute -left-16 -top-16 h-32 w-32 rotate-45 bg-gradient-to-br from-rose-400/20 via-orange-400/20 to-yellow-400/20 blur-3xl" />
                <div className="absolute -bottom-16 -right-16 h-32 w-32 rotate-45 bg-gradient-to-br from-yellow-400/20 via-green-400/20 to-teal-400/20 blur-3xl" />
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                    <Heart className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="mt-4 font-heading text-lg font-bold leading-tight text-white">
                    Patient-Centered Matching
                  </h4>
                  <div className="my-4 h-px w-full bg-gradient-to-r from-rose-300/30 via-orange-300/30 to-yellow-300/30" />
                  <p className="text-sm leading-relaxed text-white/70">
                    Intelligent matching algorithms that consider medical needs, insurance, and location.
                  </p>
                  <div className="mt-4 space-y-2">
                    {["AI-powered matching", "Custom criteria"].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-[#44BEAF]" />
                        <span className="text-xs text-white/70">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section - Okta style: stats + story */}
        <section id="about" className="relative overflow-hidden py-24 sm:py-32">
          {/* Background image */}
          <Image
            src="/Images/care.png"
            alt=""
            fill
            className="object-cover"
          />
          {/* Color overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#134675]/90 via-[#1a5c8f]/85 to-[#44BEAF]/80" />
          
          <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
              <div>
                <h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Built for those who care
                </h2>
                <p className="mt-6 text-base leading-7 text-white/80">
                  CareBridge Health was founded by healthcare professionals who
                  witnessed the challenges hospital social workers face daily:
                  too many patients, too few options, and too much paperwork.
                </p>
                <p className="mt-4 text-base leading-7 text-white/80">
                  Our platform streamlines the discharge planning process,
                  reducing placement times from days to hours while ensuring
                  every patient finds the setting that best meets their medical,
                  social, and financial needs.
                </p>
                <div className="mt-8 flex flex-col gap-3">
                  {[
                    "HIPAA-compliant secure platform",
                    "Real-time facility availability data",
                    "Integrated insurance verification",
                    "Multi-stakeholder collaboration tools",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-[#44BEAF]" />
                      <span className="text-sm text-white/90">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm"
                  >
                    <div className="text-3xl font-bold text-[#44BEAF]">
                      {stat.value}
                    </div>
                    <div className="mt-2 text-sm text-white/70">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Resources Section - Okta style: content cards */}
        <section id="resources" className="bg-[#134675] py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Read. Watch. Learn. More.
              </h2>
            </div>
            <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  category: "Product",
                  title: "Streamlined discharge planning with CareBridge",
                  icon: BookOpen,
                },
                {
                  category: "Customer Story",
                  title: "How Mount Sinai reduced placement time by 85%",
                  icon: Award,
                },
                {
                  category: "Guide",
                  title: "The complete guide to patient placement coordination",
                  icon: FileCheck,
                },
                {
                  category: "Webinar",
                  title: "Optimizing care transitions in 2026",
                  icon: TrendingUp,
                },
                {
                  category: "Blog",
                  title: "AI-powered patient matching: A new era in healthcare",
                  icon: Stethoscope,
                },
                {
                  category: "Report",
                  title: "State of patient placement in US hospitals",
                  icon: Building2,
                },
              ].map((item) => (
                <a
                  key={item.title}
                  href="#"
                  className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(0,0,0,0.1),0_0_20px_rgba(255,255,255,0.1)] transition-all hover:bg-white/15"
                >
                  {/* Beveled edge highlights */}
                  <div className="absolute inset-0 rounded-3xl shadow-[inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.1)]" />
                  <div className="absolute inset-x-0 top-0 h-px rounded-t-3xl bg-gradient-to-r from-white/0 via-white/50 to-white/0" />
                  <div className="absolute inset-y-0 left-0 w-px rounded-l-3xl bg-gradient-to-b from-white/0 via-white/50 to-white/0" />
                  <div className="absolute inset-x-0 bottom-0 h-px rounded-b-3xl bg-gradient-to-r from-black/0 via-black/20 to-black/0" />
                  <div className="absolute inset-y-0 right-0 w-px rounded-r-3xl bg-gradient-to-b from-black/0 via-black/20 to-black/0" />
                  {/* Iridescent effects */}
                  <div className="absolute -left-12 -top-12 h-24 w-24 rotate-45 bg-gradient-to-br from-pink-400/20 via-purple-400/20 to-cyan-400/20 blur-2xl" />
                  <div className="absolute -bottom-12 -right-12 h-24 w-24 rotate-45 bg-gradient-to-br from-cyan-400/20 via-blue-400/20 to-purple-400/20 blur-2xl" />
                  
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                      <item.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-white/70">
                      {item.category}
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-white group-hover:underline">
                      {item.title}
                    </h3>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - Okta style: three cards */}
        <section id="contact" className="bg-muted/30 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-[#134675] sm:text-4xl">
                Go further with CareBridge
              </h2>
            </div>
            <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <a
                href="/sign-up"
                className="group rounded-xl border border-border bg-card p-8 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#44BEAF]/10">
                  <ArrowUpRight className="h-6 w-6 text-[#44BEAF]" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-bold text-[#134675]">
                  Start a free trial
                </h3>
                <p className="mt-2 text-sm text-foreground/60">
                  Try our 30-day free trial to explore some product capabilities
                  in your own time.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#134675] group-hover:underline">
                  Start a free trial <ArrowRight className="h-4 w-4" />
                </span>
              </a>
              <a
                href="#resources"
                className="group rounded-xl border border-border bg-card p-8 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#134675]/10">
                  <BookOpen className="h-6 w-6 text-[#134675]" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-bold text-[#134675]">
                  Expert resources
                </h3>
                <p className="mt-2 text-sm text-foreground/60">
                  Stay up to date on the latest patient placement and care
                  coordination innovations.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#134675] group-hover:underline">
                  Explore resources <ArrowRight className="h-4 w-4" />
                </span>
              </a>
              <a
                href="#"
                className="group rounded-xl border border-border bg-card p-8 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#44BEAF]/10">
                  <Phone className="h-6 w-6 text-[#44BEAF]" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-bold text-[#134675]">
                  Talk to an expert
                </h3>
                <p className="mt-2 text-sm text-foreground/60">
                  Submit a contact form to get connected with our team of
                  healthcare placement experts.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#134675] group-hover:underline">
                  Talk to an expert <ArrowRight className="h-4 w-4" />
                </span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
