import Link from "next/link";
import { PublicHeader, ReferralPreview } from "@/components/public-brand";

// CSP strict-dynamic needs a per-request nonce; static prerender has none, so scripts get blocked.
export const dynamic = "force-dynamic";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <div className="care-public care-onboarding">
    <a className="care-skip" href="#setup">Skip to setup</a><PublicHeader simple />
    <main className="care-onboarding-main">
      <aside className="care-onboarding-aside"><h2>Good care<br />starts together.</h2><p>Connect your organization so your team can coordinate referrals, share updates, and keep every next step in view.</p><ReferralPreview /><p className="care-caption">Setting up for an existing team? Your administrator can share an invite code.</p></aside>
      <section id="setup">{children}</section>
    </main>
    <footer className="care-auth-footer"><Link href="/">CareBridge Health</Link><a href="mailto:support@carebridge.health">Need a hand? Contact support</a></footer>
  </div>;
}
