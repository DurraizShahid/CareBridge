"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowUpRight, Check, CheckCircle2, Loader2 } from "lucide-react";
import { PublicHeader } from "@/components/public-brand";

export function LeadGenClient() {
  const [orgType, setOrgType] = useState("hospital");
  const [role, setRole] = useState("discharge-planner");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    window.setTimeout(() => { setSubmitting(false); setSubmitted(true); }, 700);
  }

  return <div className="care-public care-lead">
    <a className="care-skip" href="#walkthrough-form">Skip to form</a><PublicHeader simple />
    <main className="care-lead-main care-container">
      <section className="care-lead-story"><h1>Meet your next<br />care connection.</h1><p>Walk through CareBridge with your team. See how the right information, in the right place, makes each placement easier to coordinate.</p><div className="care-lead-image"><Image src="/bg.jpg" alt="A care team discussing a patient's next steps together" fill sizes="(max-width: 800px) 100vw, 44vw" priority /></div><ul className="care-lead-agenda"><li><Check aria-hidden="true" /> Follow a referral from intake to placement</li><li><Check aria-hidden="true" /> Explore facility matching and 3D tours</li><li><Check aria-hidden="true" /> See agreements and bed reservations in one flow</li></ul></section>
      <section id="walkthrough-form" className="care-lead-form" aria-label="Walkthrough request">
        {submitted ? <div className="care-success" role="status"><CheckCircle2 size={38} aria-hidden="true" /><h2>You&apos;re all set for this preview.</h2><p>This demo shows the request experience. Your details haven&apos;t been saved or sent. In the live workflow, the CareBridge team would follow up to arrange your walkthrough.</p><button type="button" className="care-button" onClick={() => setSubmitted(false)}>Try another request</button><Link href="/" className="care-text-link">Return to CareBridge</Link></div> : <>
          <h2>Let&apos;s talk about your team.</h2><p className="care-auth-intro">Tell us a little about your organization.</p>
          <form onSubmit={onSubmit} className="care-form" aria-busy={submitting}>
            <div className="care-form-row"><div className="care-field"><label htmlFor="name">Full name</label><input id="name" name="name" autoComplete="name" required placeholder="Alex Rivera" /></div><div className="care-field"><label htmlFor="email">Work email</label><input id="email" name="email" type="email" autoComplete="email" spellCheck={false} required placeholder="alex@organization.com" /></div></div>
            <div className="care-field"><label htmlFor="organization">Organization</label><input id="organization" name="organization" autoComplete="organization" required placeholder="Your hospital or care facility" /></div>
            <div className="care-form-row"><div className="care-field"><label htmlFor="organization-type">Organization type</label><select id="organization-type" name="organization-type" className="care-input" value={orgType} onChange={e => setOrgType(e.target.value)}><option value="hospital">Hospital / health system</option><option value="facility">Post-acute facility</option></select></div><div className="care-field"><label htmlFor="role">Your role</label><select id="role" name="role" className="care-input" value={role} onChange={e => setRole(e.target.value)}><option value="discharge-planner">Discharge planner</option><option value="social-worker">Social worker</option><option value="care-coordinator">Care coordinator</option><option value="facility-admin">Facility administrator</option><option value="executive">Executive / operations</option></select></div></div>
            <div className="care-field"><label htmlFor="interest">What would you like to explore? <span className="care-caption">(optional)</span></label><textarea id="interest" name="interest" rows={3} placeholder="Tell us about your placement workflow…" aria-describedby="lead-note" /></div>
            <button type="submit" disabled={submitting} className="care-button">{submitting ? <Loader2 size={18} className="care-spinner" aria-hidden="true" /> : <ArrowUpRight size={18} aria-hidden="true" />}{submitting ? "Sending…" : "Request a walkthrough"}</button>
            <p className="care-caption" id="lead-note">Demo form. Details are not saved or sent. Please don&apos;t include patient information.</p>
          </form>
        </>}
      </section>
    </main>
    <footer className="care-auth-footer"><span>CareBridge Health</span><a href="mailto:support@carebridge.health">Need a hand? Contact support</a></footer>
  </div>;
}
