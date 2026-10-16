'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

// Shared Google OAuth landing for /sign-in and /sign-up. Clerk transfers a
// sign-in with no matching account into a sign-up (and vice versa), so one
// button works for new and existing users. /onboarding routes on to
// /dashboard when the user already has an organization.
export default function SSOCallbackPage() {
  return <>
    <AuthenticateWithRedirectCallback signInForceRedirectUrl="/onboarding" signUpForceRedirectUrl="/onboarding" />
    <div id="clerk-captcha" />
  </>;
}
