'use client';

import { useEffect, useState, useCallback } from 'react';
import { SignInButton, useSignIn, useAuth, useClerk } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthShell, GoogleMark } from '@/components/public-brand';
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function SignInPage() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { setActive } = useClerk();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'password' | 'mfa'>('email');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error') || params.get('oauth_error');
    return error ? decodeURIComponent(error) : null;
  });

  useEffect(() => {
    if (isSignedIn) {
      router.push('/onboarding');
    }
  }, [isSignedIn, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('error') || params.has('oauth_error')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      url.searchParams.delete('oauth_error');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const clearError = useCallback(() => setErrorMessage(null), []);

  if (isSignedIn) {
    return null;
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await signIn.create({ identifier: emailAddress });

      if (signIn.status === 'needs_first_factor') {
        const factors = signIn.supportedFirstFactors ?? [];
        const hasPassword = factors.some((f) => f.strategy === 'password');

        if (hasPassword) {
          setStep('password');
        } else if (factors.some((f) => f.strategy === 'oauth_google')) {
          setErrorMessage(
            'This account uses Google Sign-In. Please click "Continue with Google" above.'
          );
        } else {
          setErrorMessage(
            'This account uses a different sign-in method. Please try signing in with Google or check your email for a verification link.'
          );
        }
      }
    } catch (err: unknown) {
      if (isClerkAPIResponseError(err)) {
        setErrorMessage(err.errors[0]?.message ?? 'Something went wrong. Please try again.');
      } else {
        setErrorMessage('Something went wrong. Please try again.');
      }
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await signIn.password({ identifier: emailAddress, password });
      if (signIn.status === 'needs_second_factor') {
        setStep('mfa');
      } else if (signIn.status === 'complete' && signIn.createdSessionId) {
        await setActive({ session: signIn.createdSessionId });
        router.push('/onboarding');
      }
    } catch (err: unknown) {
      if (isClerkAPIResponseError(err)) {
        setErrorMessage(err.errors[0]?.message ?? 'Something went wrong. Please try again.');
      } else {
        setErrorMessage('Something went wrong. Please try again.');
      }
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await signIn.mfa.verifyTOTP({ code: mfaCode });
      if (signIn.status === 'complete' && signIn.createdSessionId) {
        await setActive({ session: signIn.createdSessionId });
        router.push('/onboarding');
      }
    } catch (err: unknown) {
      if (isClerkAPIResponseError(err)) {
        setErrorMessage(err.errors[0]?.message ?? 'Something went wrong. Please try again.');
      } else {
        setErrorMessage('Something went wrong. Please try again.');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    try {
      await signIn.sso({ strategy: 'oauth_google', redirectUrl: '/onboarding', redirectCallbackUrl: '/sso-callback' });
    } catch (err: unknown) {
      setErrorMessage(isClerkAPIResponseError(err) ? err.errors[0]?.message ?? 'Please try signing in again.' : 'Please try signing in again.');
    }
  };

  const busy = fetchStatus === 'fetching';
  return <AuthShell>
    <h1>{step === 'email' ? 'Welcome back.' : step === 'password' ? 'Your password.' : 'One more check.'}</h1>
    <p className="care-auth-intro">{step === 'email' ? 'Your team. Your patients. Your next step, together.' : step === 'password' ? 'Enter your password to return to your workspace.' : 'Enter the 6-digit code from your authenticator app.'}</p>
    {errorMessage && <p className="care-form-error" role="alert">{errorMessage}</p>}
    {step === 'email' && <>
      <button type="button" className="care-google" disabled={busy} onClick={handleGoogleSignIn}><GoogleMark /> Continue with Google</button>
      <p className="care-form-divider">or sign in with your email</p>
      <form onSubmit={handleEmailSubmit} className="care-form" aria-busy={busy}>
        <div className="care-field"><label htmlFor="signin-email">Email address</label><input id="signin-email" name="email" type="email" value={emailAddress} onChange={e => setEmailAddress(e.target.value)} placeholder="you@organization.com" required autoComplete="email" spellCheck={false} aria-invalid={!!errors?.fields?.identifier} aria-describedby={errors?.fields?.identifier ? 'signin-email-error' : undefined} />{errors?.fields?.identifier && <p id="signin-email-error" className="care-field-error" role="alert">{errors.fields.identifier.message}</p>}</div>
        <button type="submit" disabled={busy} className="care-button">{busy && <Loader2 size={17} className="care-spinner" aria-hidden="true" />}{busy ? 'Checking…' : 'Sign in with email'}</button>
      </form>
    </>}
    {step === 'password' && <>
      <div className="care-email-summary"><span>{emailAddress}</span><button type="button" disabled={busy} onClick={() => { setStep('email'); setPassword(''); clearError(); }}>Change</button></div>
      <form onSubmit={handlePasswordSubmit} className="care-form" aria-busy={busy}>
        <div className="care-field"><label htmlFor="signin-password">Password</label><div className="care-password"><input id="signin-password" name="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" aria-invalid={!!errors?.fields?.password} aria-describedby={errors?.fields?.password ? 'signin-password-error' : undefined} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button></div>{errors?.fields?.password && <p id="signin-password-error" className="care-field-error" role="alert">{errors.fields.password.message}</p>}</div>
        <button type="submit" disabled={busy} className="care-button">{busy && <Loader2 size={17} className="care-spinner" aria-hidden="true" />}{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <SignInButton mode="modal" forceRedirectUrl="/onboarding"><button type="button" className="care-form-back">Forgot password?</button></SignInButton>
    </>}
    {step === 'mfa' && <form onSubmit={handleMfaSubmit} className="care-form" aria-busy={busy}>
      <div className="care-field"><label htmlFor="mfa-code">Verification code</label><input id="mfa-code" name="code" type="text" value={mfaCode} onChange={e => setMfaCode(e.target.value)} required inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" maxLength={6} spellCheck={false} placeholder="000000" aria-invalid={!!errors?.fields?.code} aria-describedby={errors?.fields?.code ? 'mfa-code-error' : undefined} />{errors?.fields?.code && <p id="mfa-code-error" className="care-field-error" role="alert">{errors.fields.code.message}</p>}</div>
      <button type="submit" disabled={busy} className="care-button">{busy && <Loader2 size={17} className="care-spinner" aria-hidden="true" />}{busy ? 'Verifying…' : 'Verify and sign in'}</button>
      <button type="button" className="care-form-back" disabled={busy} onClick={() => { setStep('password'); clearError(); }}><ArrowLeft size={16} aria-hidden="true" /> Back to password</button>
    </form>}
    <p className="care-form-help">New to CareBridge? <Link href="/sign-up">Create an account</Link></p>
  </AuthShell>;
}
