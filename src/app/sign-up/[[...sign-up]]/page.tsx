import { SignUp } from "@clerk/nextjs";
import { Heart } from "lucide-react";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left — Brand Panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-[#0F1A2E] via-[#1a2d45] to-primary p-12 lg:flex">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-health to-teal-400 shadow-lg shadow-health/20">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="font-heading text-xl font-bold text-white">
              CareBridge
            </span>
          </Link>
        </div>

        <div className="space-y-6">
          <blockquote className="space-y-3">
            <p className="text-lg leading-relaxed text-blue-100/90">
              &ldquo;CareBridge has transformed how we place patients. What used
              to take days now takes hours.&rdquo;
            </p>
            <footer className="text-sm text-blue-200/60">
              — Sarah Johnson, Senior Social Worker
              <br />
              Metropolitan General Hospital
            </footer>
          </blockquote>

          <div className="flex items-center gap-6">
            {[
              { stat: "85%", label: "Faster placements" },
              { stat: "1,200+", label: "Facilities onboarded" },
              { stat: "92%", label: "Satisfaction rate" },
            ].map((item) => (
              <div key={item.label}>
                <div className="font-heading text-2xl font-bold text-health">
                  {item.stat}
                </div>
                <div className="mt-0.5 text-xs text-blue-200/60">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-blue-200/40">
          &copy; {new Date().getFullYear()} CareBridge Health, Inc.
        </div>
      </div>

      {/* Right — Sign-Up Form */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        {/* Mobile brand mark */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Heart className="h-4 w-4 text-white" />
          </div>
          <span className="font-heading text-lg font-bold text-primary">
            CareBridge
          </span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              Create your account
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Get started with CareBridge Health.
            </p>
          </div>

          <SignUp
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none p-0 w-full",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "border border-border bg-background hover:bg-muted text-foreground text-sm font-medium rounded-lg h-10",
                socialButtonsBlockButton__google:
                  "border border-border bg-background hover:bg-muted text-foreground text-sm font-medium rounded-lg h-10",
                dividerLine: "bg-border",
                dividerText:
                  "text-xs text-muted-foreground",
                formFieldLabel:
                  "text-sm font-medium text-foreground",
                formFieldInput:
                  "rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                formButtonPrimary:
                  "inline-flex h-10 items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:translate-y-px",
                footerActionLink:
                  "text-sm text-health hover:text-health/80",
                footerActionText:
                  "text-sm text-muted-foreground",
                identityPreviewText:
                  "text-sm text-foreground",
                identityPreviewEditButton:
                  "text-sm text-health hover:text-health/80",
                formFieldAction:
                  "text-xs text-health hover:text-health/80",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
