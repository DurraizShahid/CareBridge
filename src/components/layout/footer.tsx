import Link from "next/link";
import {
  Heart,
  HeartHandshake,
  Shield,
  Mail,
  Globe,
  AtSign,
} from "lucide-react";
const footerLinks = {
  product: [
    { label: "Features", href: "/#features" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Patients", href: "/patients" },
    { label: "Facilities", href: "/facilities" },
    { label: "Placements", href: "/placements" },
  ],
  resources: [
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Integration Guide", href: "#" },
    { label: "Release Notes", href: "#" },
    { label: "Help Center", href: "#" },
  ],
  company: [
    { label: "About Us", href: "/#about" },
    { label: "Careers", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Contact", href: "#" },
  ],
};

const socialLinks = [
  { label: "Twitter", icon: AtSign, href: "#" },
  { label: "LinkedIn", icon: Globe, href: "#" },
  { label: "Email", icon: Mail, href: "mailto:hello@carebridge.health" },
];

interface FooterProps {
  compact?: boolean;
}

export function Footer({ compact = false }: FooterProps) {
  if (compact) {
    return (
      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
              <Heart className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-bold text-primary">
              CareBridge
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} CareBridge Health. All rights
            reserved.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-border bg-gradient-to-b from-background to-muted/50">
      {/* Main footer content */}
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-sm">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span className="font-heading text-xl font-bold text-primary">
                CareBridge
                <span className="text-health"> Health</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Empowering hospital social workers and discharge planners to find
              the right care settings for every patient — faster, smarter, and
              with confidence.
            </p>

            {/* Social links */}
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground shadow-sm transition-all hover:border-health/30 hover:bg-health/5 hover:text-health"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-health" />
                <span className="text-xs font-medium text-muted-foreground">
                  HIPAA Compliant
                </span>
              </div>
              <div className="flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-warmth" />
                <span className="text-xs font-medium text-muted-foreground">
                  SOC 2 Type II
                </span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          <div>
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground">
              Product
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-health"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground">
              Resources
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-health"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground">
              Company
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-health"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-5 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} CareBridge Health, Inc. All
            rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="#"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <span className="text-muted-foreground/40">&middot;</span>
            <Link
              href="#"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Terms of Service
            </Link>
            <span className="text-muted-foreground/40">&middot;</span>
            <Link
              href="#"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
