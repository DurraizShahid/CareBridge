import {
  Heart,
  HomeIcon,
  Users,
  Shield,
  ArrowRight,
  Search,
  MapPin,
  Building2,
  Stethoscope,
} from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { AuthControls } from "@/components/auth-controls";
import { Navbar } from "@/components/layout/navbar";

const features = [
  {
    icon: Users,
    title: "Social Worker Portal",
    description:
      "Streamlined case management tools for hospital social workers and discharge planners to assess, match, and place patients efficiently.",
  },
  {
    icon: HomeIcon,
    title: "Care Setting Discovery",
    description:
      "Comprehensive directory of skilled nursing facilities, rehabilitation centers, assisted living, and home health agencies with real-time availability.",
  },
  {
    icon: Shield,
    title: "Placement Coordination",
    description:
      "End-to-end placement workflow with secure communication, document sharing, and status tracking across all stakeholders.",
  },
  {
    icon: Heart,
    title: "Patient-Centered Matching",
    description:
      "Intelligent matching algorithms that consider medical needs, insurance coverage, location preferences, and facility capabilities.",
  },
];

export default function Page() {
  return (
    <div className="flex flex-col flex-1">
      <main className="flex-1">
        {/* Hero Section - Inspired by consulting partner layout */}
        <section className="relative mx-1 mt-1 min-h-screen overflow-hidden rounded-3xl bg-[#0F1A2E] sm:mx-2 sm:mt-1.5 lg:mx-3 lg:mt-2">
          {/* Background image */}
          <div className="absolute inset-0">
            <img
              src="/bg.jpg"
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,black_100%)] opacity-60" />
          </div>

          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]">
            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="hero-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hero-grid)" />
            </svg>
          </div>

          {/* Gradient glows */}
          <div className="absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-health/8 blur-[100px]" />
          <div className="absolute -right-32 bottom-0 h-[400px] w-[400px] rounded-full bg-warmth/5 blur-[80px]" />

          {/* Navbar inside hero */}
          <Navbar />

          {/* Content */}
          <div className="relative px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8 lg:pt-14">
            <div className="mx-4 max-w-2xl sm:mx-6 lg:mx-8">
              {/* Headline */}
              <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Your Trusted{" "}
                <span className="bg-gradient-to-r from-health to-teal-300 bg-clip-text text-transparent">
                  Healthcare
                </span>{" "}
                Partner
              </h1>
            </div>
          </div>

          {/* Facility Search Bar */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8">
            <div className="mx-4 rounded-2xl border border-white/10 bg-white/[0.08] p-5 shadow-xl backdrop-blur-md sm:mx-6 sm:p-6 lg:mx-8">
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                {/* Location input */}
                <div className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 transition-colors focus-within:border-health/50 focus-within:ring-2 focus-within:ring-health/20 sm:w-auto sm:flex-1">
                  <MapPin className="h-5 w-5 shrink-0 text-white/60" />
                  <input
                    type="text"
                    placeholder="City, state, or ZIP code"
                    className="w-full bg-transparent text-sm text-white placeholder-white/40 outline-none"
                  />
                </div>

                {/* Care level select */}
                <div className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 transition-colors focus-within:border-health/50 focus-within:ring-2 focus-within:ring-health/20 sm:w-auto sm:flex-1">
                  <Stethoscope className="h-5 w-5 shrink-0 text-white/60" />
                  <select
                    defaultValue=""
                    className="w-full appearance-none bg-transparent text-sm text-white outline-none"
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
                  className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-health px-6 text-sm font-semibold text-primary shadow-lg shadow-health/25 transition-all hover:bg-health/90 hover:shadow-xl hover:shadow-health/30 active:translate-y-px sm:w-auto"
                >
                  <Search className="h-4 w-4" />
                  <span>Find Facilities</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-background py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Everything you need to{" "}
                <span className="text-health">place patients</span> with
                confidence
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                From initial assessment to final placement, CareBridge provides
                the tools and insights to make informed decisions.
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card p-8 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-health/10">
                    <feature.icon className="h-6 w-6 text-health" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-card-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="bg-muted py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
              <div>
                <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Built for{" "}
                  <span className="text-warmth">those who care</span>
                </h2>
                <p className="mt-6 text-base leading-7 text-muted-foreground">
                  CareBridge Health was founded by healthcare professionals who
                  witnessed the challenges hospital social workers face daily:
                  too many patients, too few options, and too much paperwork.
                </p>
                <p className="mt-4 text-base leading-7 text-muted-foreground">
                  Our platform streamlines the discharge planning process, reducing
                  placement times from days to hours while ensuring every patient
                  finds the setting that best meets their medical, social, and
                  financial needs.
                </p>
                <div className="mt-8 flex flex-col gap-3">
                  {[
                    "HIPAA-compliant secure platform",
                    "Real-time facility availability data",
                    "Integrated insurance verification",
                    "Multi-stakeholder collaboration tools",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warmth/10">
                        <div className="h-2 w-2 rounded-full bg-warmth" />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-health/20 via-health/10 to-primary/5 p-8">
                  <div className="grid h-full grid-cols-2 gap-4">
                    <div className="rounded-xl bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                      <div className="text-3xl font-bold text-health">85%</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Faster placement decisions
                      </div>
                    </div>
                    <div className="mt-8 rounded-xl bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                      <div className="text-3xl font-bold text-warmth">3x</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        More facilities matched
                      </div>
                    </div>
                    <div className="-mt-4 rounded-xl bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                      <div className="text-3xl font-bold text-primary">92%</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Patient satisfaction
                      </div>
                    </div>
                    <div className="rounded-xl bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                      <div className="text-3xl font-bold text-health">
                        1,200+
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Facilities onboarded
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to transform your{" "}
                <span className="text-health">discharge planning</span>?
              </h2>
              <p className="mt-4 text-lg text-blue-100/80">
                Join hundreds of hospitals already using CareBridge to find the
                right care settings for their patients.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
                <button
                  type="button"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-health px-6 text-sm font-semibold text-primary shadow-sm transition-all hover:bg-health/90 active:translate-y-px"
                >
                  Request Demo
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:translate-y-px"
                >
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
