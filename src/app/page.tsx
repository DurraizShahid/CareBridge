import { Heart, HomeIcon, Users, Shield, ArrowRight } from "lucide-react";

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
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Heart className="h-4 w-4 text-white" />
            </div>
            <span className="font-heading text-xl font-bold text-primary">
              CareBridge
            </span>
          </div>
          <div className="hidden items-center gap-8 sm:flex">
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#about"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              About
            </a>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:translate-y-px"
            >
              Get Started
            </button>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/95">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(78,216,199,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,126,107,0.1),transparent_50%)]" />
          <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-4 py-1.5">
                <span className="h-2 w-2 rounded-full bg-health" />
                <span className="text-sm font-medium text-health">
                  Bridging Hospital to Home
                </span>
              </div>
              <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Every patient deserves{" "}
                <span className="text-health">the right care</span> beyond the
                hospital
              </h1>
              <p className="mt-6 text-lg leading-8 text-blue-100/90 sm:text-xl">
                CareBridge Health empowers hospital social workers and discharge
                planners to find and place patients into appropriate care
                settings when returning home is not an option.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
                <button
                  type="button"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-health px-6 text-sm font-semibold text-primary shadow-sm transition-all hover:bg-health/90 active:translate-y-px"
                >
                  Start Free Assessment
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:translate-y-px"
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>
          {/* Wave divider */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
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
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-health px-6 text-sm font-semibold text-primary shadow-sm transition-all hover:bg-health/90 active:translate-y-px"
                >
                  Request Demo
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:translate-y-px"
                >
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <Heart className="h-3 w-3 text-white" />
            </div>
            <span className="font-heading text-sm font-bold text-primary">
              CareBridge Health
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} CareBridge Health. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
