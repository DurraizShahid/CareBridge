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
import { Card, CardContent } from "@/components/ui/card";
import { Footer } from "@/components/layout/footer";
import { AuthControls } from "@/components/auth-controls";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Ripple } from "@/components/ui/ripple";
import Silk from "@/components/ui/silk";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { CareLevelCombobox } from "@/components/care-level-combobox";
import { LandingPageLoader } from "@/components/landing-page-loader";
import Link from "next/link";

const stats = [
  { value: "85%", label: "Faster placement decisions" },
  { value: "3x", label: "More facilities matched" },
  { value: "92%", label: "Patient satisfaction" },
  { value: "1,200+", label: "Facilities onboarded" },
];

export default function Page() {
  return (
    <LandingPageLoader>
      <div className="flex flex-col flex-1">
        <main className="flex-1">
          {/* Hero Section - Full screen with Silk animation */}
          <section className="relative h-screen min-h-[600px] overflow-hidden bg-[#0a1628]">
          {/* Silk animation background */}
          <div className="absolute inset-0 z-0">
            <Silk
              speed={12}
              scale={1.2}
              color="#134675"
              noiseIntensity={1.5}
              rotation={0}
            />
          </div>
          {/* Stronger gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/50 to-[#0a1628]/30 z-[1]" />

          {/* Navbar */}
          <nav className="absolute inset-x-0 top-0 z-20">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 pt-6 lg:px-8">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/Images/Logo.png"
                  alt="CareBridge"
                  width={200}
                  height={56}
                  className="h-14 w-auto"
                  priority
                />
              </Link>

              {/* Navigation */}
              <NavigationMenu className="hidden lg:flex">
                <NavigationMenuList className="gap-1">
                  {[
                    { label: "Features", href: "#features" },
                    { label: "About", href: "#about" },
                    { label: "Resources", href: "#resources" },
                    { label: "Contact", href: "#contact" },
                  ].map((item) => (
                    <NavigationMenuItem key={item.href}>
                      <NavigationMenuLink
                        render={<a href={item.href} />}
                        className="inline-flex h-9 w-max items-center justify-center rounded-3xl px-4 py-2 text-sm font-medium text-white/90 transition-colors duration-200 hover:text-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                      >
                        {item.label}
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>

              {/* Auth Controls */}
              <div className="flex items-center">
                <AuthControls />
              </div>
            </div>
          </nav>

          {/* Content - Left aligned with logo */}
          <div className="absolute inset-0 z-10 flex items-center">
            <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
              <div className="max-w-2xl">
                <h1 className="font-heading text-4xl font-bold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] sm:text-5xl lg:text-6xl xl:text-7xl">
                  CareBridge secures{" "}
                  <span className="text-[#44BEAF] drop-shadow-[0_2px_10px_rgba(68,190,175,0.4)]">patient placement</span>
                </h1>
                <p className="mt-4 text-lg leading-7 text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)] sm:text-xl sm:leading-8">
                  Connecting patients to the right care settings — from skilled
                  nursing to home health — faster, smarter, and with confidence.
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <Link href="/sign-up">
                    <ShimmerButton
                      shimmerColor="#134675"
                      shimmerSize="0.05em"
                      shimmerDuration="3s"
                      borderRadius="100px"
                      background="rgba(255, 255, 255, 1)"
                      className="text-[#134675] font-semibold shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_25px_rgba(0,0,0,0.4)] px-8 py-3 text-base"
                    >
                      Get started
                    </ShimmerButton>
                  </Link>
                  <a href="#contact">
                    <ShimmerButton
                      shimmerColor="#44BEAF"
                      shimmerSize="0.05em"
                      shimmerDuration="3s"
                      borderRadius="100px"
                      background="rgba(255, 255, 255, 0.15)"
                      className="border border-white/40 text-white font-semibold shadow-[0_4px_15px_rgba(0,0,0,0.2)] backdrop-blur-md hover:bg-white/25 px-8 py-3 text-base"
                    >
                      Contact sales
                    </ShimmerButton>
                  </a>
                </div>

                {/* Search Bar */}
                <div className="mt-8 rounded-2xl border border-white/15 bg-white/[0.1] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:p-6">
                  <div className="flex flex-col items-center gap-4 sm:flex-row">
                    {/* Location input */}
                    <div className="flex w-full items-center gap-3 rounded-xl border border-white/20 bg-white/[0.08] px-4 py-3 transition-colors focus-within:border-[#44BEAF]/60 focus-within:ring-2 focus-within:ring-[#44BEAF]/30 sm:flex-1">
                      <MapPin className="h-5 w-5 shrink-0 text-white/70" />
                      <input
                        type="text"
                        placeholder="City, state, or ZIP code"
                        className="w-full bg-transparent text-sm text-white placeholder-white/50 outline-none"
                        suppressHydrationWarning
                      />
                    </div>

                    {/* Care level select */}
                    <CareLevelCombobox />

                    {/* Search button */}
                    <ShimmerButton
                      shimmerColor="#ffffff"
                      shimmerSize="0.05em"
                      shimmerDuration="3s"
                      borderRadius="100px"
                      background="rgba(68, 190, 175, 1)"
                      className="h-12 w-full shrink-0 items-center justify-center gap-2 px-6 text-sm font-semibold text-white shadow-[0_4px_15px_rgba(68,190,175,0.4)] sm:w-auto"
                      suppressHydrationWarning
                    >
                      <Search className="h-4 w-4" />
                      <span>Find Facilities</span>
                    </ShimmerButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Showcase - Okta style: two-column cards */}
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
              <div className="flex justify-center lg:justify-end">
                <Image
                  src="/Images/upscalemedia-transformed111.png"
                  alt="CareBridge Dashboard on Tablet"
                  width={600}
                  height={450}
                  className="w-full max-w-md rounded-2xl shadow-2xl"
                />
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
        <section id="about" className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
              <div>
                <h2 className="font-heading text-3xl font-bold tracking-tight text-[#134675] sm:text-4xl">
                  Built for those who care
                </h2>
                <p className="mt-6 text-base leading-7 text-gray-600">
                  CareBridge Health was founded by healthcare professionals who
                  witnessed the challenges hospital social workers face daily:
                  too many patients, too few options, and too much paperwork.
                </p>
                <p className="mt-4 text-base leading-7 text-gray-600">
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
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-6"
                  >
                    <div className="text-3xl font-bold text-[#134675]">
                      {stat.value}
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
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
                  className="group rounded-xl border border-white/10 bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/15"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                    <item.icon className="h-5 w-5 text-[#44BEAF]" />
                  </div>
                  <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#44BEAF]">
                    {item.category}
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-white group-hover:underline">
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
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Go further with CareBridge
              </h2>
            </div>
            <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <a href="/sign-up" className="block p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#44BEAF]/10">
                  <ArrowUpRight className="h-6 w-6 text-[#44BEAF]" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-bold text-card-foreground">
                  Start a free trial
                </h3>
                <p className="mt-2 text-sm text-foreground/60">
                  Try our 30-day free trial to explore some product capabilities
                  in your own time.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-card-foreground group-hover:underline">
                  Start a free trial <ArrowRight className="h-4 w-4" />
                </span>
                </a>
              </Card>
              <Card className="group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <a href="#resources" className="block p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#44BEAF]/10">
                  <BookOpen className="h-6 w-6 text-[#44BEAF]" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-bold text-card-foreground">
                  Expert resources
                </h3>
                <p className="mt-2 text-sm text-foreground/60">
                  Stay up to date on the latest patient placement and care
                  coordination innovations.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-card-foreground group-hover:underline">
                  Explore resources <ArrowRight className="h-4 w-4" />
                </span>
                </a>
              </Card>
              <Card className="group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <a href="#" className="block p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#44BEAF]/10">
                  <Phone className="h-6 w-6 text-[#44BEAF]" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-bold text-card-foreground">
                  Talk to an expert
                </h3>
                <p className="mt-2 text-sm text-foreground/60">
                  Submit a contact form to get connected with our team of
                  healthcare placement experts.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-card-foreground group-hover:underline">
                  Talk to an expert <ArrowRight className="h-4 w-4" />
                </span>
                </a>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
    </LandingPageLoader>
  );
}
