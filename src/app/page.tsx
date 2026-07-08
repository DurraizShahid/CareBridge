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
        <section className="border-y border-border bg-muted/30 py-8">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <p className="text-center text-sm font-medium text-foreground/60">
              Trusted by leading healthcare organizations
            </p>
            <div className="mt-6 flex items-center justify-center gap-8 sm:gap-12 lg:gap-16">
              {customerLogos.map((logo) => (
                <span
                  key={logo}
                  className="text-sm font-semibold text-foreground/40 sm:text-base"
                >
                  {logo}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Showcase - Okta style: two-column cards */}
        <section id="features" className="bg-[#44BEAF] py-24 sm:py-32">
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

            {/* Feature Card 1 */}
            <div className="mx-auto mt-16 grid max-w-5xl items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-5 font-heading text-2xl font-bold text-white">
                  Social Worker Portal
                </h3>
                <p className="mt-3 text-base leading-7 text-white/80">
                  Streamlined case management tools for hospital social workers
                  and discharge planners to assess, match, and place patients
                  efficiently.
                </p>
                <div className="mt-6 flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                    <span className="text-sm text-white/80">
                      Real-time availability
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                    <span className="text-sm text-white/80">
                      HIPAA compliant
                    </span>
                  </div>
                </div>
                <a
                  href="#"
                  className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-white hover:underline"
                >
                  Learn more <ArrowRight className="h-4 w-4" />
                </a>
              </div>
              <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <div className="text-2xl font-bold text-[#134675]">85%</div>
                    <div className="mt-1 text-xs text-foreground/50">
                      Faster decisions
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <div className="text-2xl font-bold text-[#44BEAF]">3x</div>
                    <div className="mt-1 text-xs text-foreground/50">
                      More matches
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <div className="text-2xl font-bold text-[#134675]">92%</div>
                    <div className="mt-1 text-xs text-foreground/50">
                      Satisfaction
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <div className="text-2xl font-bold text-[#44BEAF]">1,200+</div>
                    <div className="mt-1 text-xs text-foreground/50">
                      Facilities
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Card 2 */}
            <div className="mx-auto mt-20 grid max-w-5xl items-center gap-12 lg:grid-cols-2">
              <div className="order-2 lg:order-1">
                <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-sm">
                  <div className="space-y-4">
                    {[
                      {
                        icon: Building2,
                        text: "1,200+ facilities with real-time availability",
                      },
                      {
                        icon: Clock,
                        text: "Placement decisions in hours, not days",
                      },
                      {
                        icon: FileCheck,
                        text: "Automated insurance verification",
                      },
                      {
                        icon: Shield,
                        text: "HIPAA-compliant secure platform",
                      },
                    ].map((item) => (
                      <div
                        key={item.text}
                        className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm"
                      >
                        <item.icon className="h-5 w-5 shrink-0 text-[#44BEAF]" />
                        <span className="text-sm font-medium text-[#134675]">
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                  <HomeIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-5 font-heading text-2xl font-bold text-white">
                  Care Setting Discovery
                </h3>
                <p className="mt-3 text-base leading-7 text-white/80">
                  Comprehensive directory of skilled nursing facilities,
                  rehabilitation centers, assisted living, and home health
                  agencies with real-time availability.
                </p>
                <div className="mt-6 flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                    <span className="text-sm text-white/80">
                      Multi-stakeholder tools
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                    <span className="text-sm text-white/80">
                      Document sharing
                    </span>
                  </div>
                </div>
                <a
                  href="#"
                  className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-white hover:underline"
                >
                  Learn more <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Feature Card 3 */}
            <div className="mx-auto mt-20 grid max-w-5xl items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-5 font-heading text-2xl font-bold text-white">
                  Placement Coordination
                </h3>
                <p className="mt-3 text-base leading-7 text-white/80">
                  End-to-end placement workflow with secure communication,
                  document sharing, and status tracking across all
                  stakeholders.
                </p>
                <div className="mt-6 flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                    <span className="text-sm text-white/80">
                      Secure messaging
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                    <span className="text-sm text-white/80">
                      Status tracking
                    </span>
                  </div>
                </div>
                <a
                  href="#"
                  className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-white hover:underline"
                >
                  Learn more <ArrowRight className="h-4 w-4" />
                </a>
              </div>
              <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-sm">
                <div className="space-y-3">
                  {[
                    { step: "01", text: "Patient assessment completed" },
                    { step: "02", text: "Matching criteria evaluated" },
                    { step: "03", text: "Facilities notified" },
                    { step: "04", text: "Placement confirmed" },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#134675] text-xs font-bold text-white">
                        {item.step}
                      </div>
                      <span className="text-sm font-medium text-[#134675]">
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature Card 4 */}
            <div className="mx-auto mt-20 grid max-w-5xl items-center gap-12 lg:grid-cols-2">
              <div className="order-2 lg:order-1">
                <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                      <Heart className="h-6 w-6 text-[#44BEAF]" />
                      <div className="mt-2 text-sm font-bold text-[#134675]">
                        Medical Needs
                      </div>
                      <div className="mt-1 text-xs text-foreground/50">
                        Condition-based matching
                      </div>
                    </div>
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                      <FileCheck className="h-6 w-6 text-[#134675]" />
                      <div className="mt-2 text-sm font-bold text-[#134675]">
                        Insurance
                      </div>
                      <div className="mt-1 text-xs text-foreground/50">
                        Coverage verification
                      </div>
                    </div>
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                      <MapPin className="h-6 w-6 text-[#44BEAF]" />
                      <div className="mt-2 text-sm font-bold text-[#134675]">
                        Location
                      </div>
                      <div className="mt-1 text-xs text-foreground/50">
                        Proximity preferences
                      </div>
                    </div>
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                      <Building2 className="h-6 w-6 text-[#134675]" />
                      <div className="mt-2 text-sm font-bold text-[#134675]">
                        Facility
                      </div>
                      <div className="mt-1 text-xs text-foreground/50">
                        Capability matching
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-5 font-heading text-2xl font-bold text-white">
                  Patient-Centered Matching
                </h3>
                <p className="mt-3 text-base leading-7 text-white/80">
                  Intelligent matching algorithms that consider medical needs,
                  insurance coverage, location preferences, and facility
                  capabilities.
                </p>
                <div className="mt-6 flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                    <span className="text-sm text-white/80">
                      AI-powered
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                    <span className="text-sm text-white/80">
                      Custom criteria
                    </span>
                  </div>
                </div>
                <a
                  href="#"
                  className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-white hover:underline"
                >
                  Learn more <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* About Section - Okta style: stats + story */}
        <section id="about" className="bg-[#134675] py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
              <div>
                <h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Built for those who care
                </h2>
                <p className="mt-6 text-base leading-7 text-white/70">
                  CareBridge Health was founded by healthcare professionals who
                  witnessed the challenges hospital social workers face daily:
                  too many patients, too few options, and too much paperwork.
                </p>
                <p className="mt-4 text-base leading-7 text-white/70">
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
                      <span className="text-sm text-white/80">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
                  >
                    <div className="text-3xl font-bold text-[#44BEAF]">
                      {stat.value}
                    </div>
                    <div className="mt-2 text-sm text-white/60">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Resources Section - Okta style: content cards */}
        <section id="resources" className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-[#134675] sm:text-4xl">
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
                  className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#134675]/5">
                    <item.icon className="h-5 w-5 text-[#134675]" />
                  </div>
                  <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#44BEAF]">
                    {item.category}
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-[#134675] group-hover:underline">
                    {item.title}
                  </h3>
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
