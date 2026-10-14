import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, FileCheck2, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { AuthControls } from "@/components/auth-controls";

export function PublicHeader({ simple = false }: { simple?: boolean }) {
  return <header className="care-header care-container">
    <Link href="/" aria-label="CareBridge Health home"><BrandLogo className="care-logo" priority /></Link>
    {!simple && <nav aria-label="Main navigation" className="care-nav"><Link href="/#how-it-works">How it works</Link><Link href="/#facilities">Care settings</Link><Link href="/#care-teams">For care teams</Link></nav>}
    {simple ? <Link className="care-text-link" href="/">Back to home <ArrowRight size={16} aria-hidden="true" /></Link> : <AuthControls />}
  </header>;
}

export function ReferralPreview() {
  return <div className="care-referral-preview" data-ui aria-label="Illustrative placement workflow">
    <div className="care-preview-heading"><span>Placement overview</span><span className="care-status"><Check size={13} aria-hidden="true" /> Confirmed</span></div>
    <p className="care-preview-route">Hospital <ArrowRight size={16} aria-hidden="true" /> Care home</p>
    <div className="care-preview-checks"><span><Check size={16} aria-hidden="true" /> Referral accepted</span><span><FileCheck2 size={16} aria-hidden="true" /> Agreement signed</span><span><Check size={16} aria-hidden="true" /> Bed reserved</span></div>
    <p className="care-caption">Product preview · Illustrative data</p>
  </div>;
}

export function AuthShell({ children, signUp = false }: { children: React.ReactNode; signUp?: boolean }) {
  return <div className="care-public care-auth">
    <a className="care-skip" href="#auth-form">Skip to form</a>
    <header className="care-auth-header"><Link href="/" aria-label="CareBridge Health home"><BrandLogo className="care-logo" priority /></Link><p>{signUp ? "Already have an account?" : "New to CareBridge?"} <Link href={signUp ? "/sign-in" : "/sign-up"}>{signUp ? "Sign in" : "Create an account"}</Link></p></header>
    <main className="care-auth-grid">
      <aside className="care-auth-story" aria-label="About CareBridge"><h2>Every handoff<br />is a human moment.</h2><p>Keep the people, the details, and the next step connected. From hospital discharge to a place to recover.</p><div className="care-auth-image"><Image src="/login.jpg" alt="A reassuring hand held during a care transition" fill sizes="(max-width: 900px) 100vw, 45vw" priority /></div><ReferralPreview /><p className="care-auth-reassurance"><ShieldCheck size={18} aria-hidden="true" /> A shared workspace for hospitals and care facilities.</p></aside>
      <section id="auth-form" className="care-auth-form">{children}</section>
    </main>
    <footer className="care-auth-footer"><span>CareBridge Health</span><a href="mailto:support@carebridge.health">Need a hand? Contact support</a></footer>
  </div>;
}

export function GoogleMark() {
  return <svg className="care-google-mark" width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#4285F4" d="M43.61 24.46c0-1.36-.12-2.66-.35-3.92H24v7.41h11a9.4 9.4 0 0 1-4.08 6.18v5.14h6.6c3.86-3.56 6.09-8.8 6.09-14.81Z" />
    <path fill="#34A853" d="M24 44c5.5 0 10.12-1.82 13.5-4.94l-6.6-5.14c-1.83 1.22-4.16 1.96-6.9 1.96-5.3 0-9.8-3.58-11.42-8.4H5.76v5.3A20 20 0 0 0 24 44Z" />
    <path fill="#FBBC05" d="M12.58 27.48a12 12 0 0 1 0-6.96v-5.3H5.76a20 20 0 0 0 0 17.56l6.82-5.3Z" />
    <path fill="#EA4335" d="M24 12.12c3 0 5.68 1.03 7.8 3.06l5.85-5.86C34.1 6.02 29.5 4 24 4A20 20 0 0 0 5.76 15.22l6.82 5.3C14.2 15.7 18.7 12.12 24 12.12Z" />
  </svg>;
}
