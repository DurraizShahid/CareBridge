'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSignUp, useAuth, useClerk } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthShell, GoogleMark } from '@/components/public-brand';
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function SignUpPage() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { setActive } = useClerk();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'info' | 'verify'>('info');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      router.push('/onboarding');
    }
  }, [isSignedIn, router]);

  const clearError = useCallback(() => setErrorMessage(null), []);

  if (isSignedIn) {
    return null;
  }

  const handleGoogleSignUp = async () => {
    setErrorMessage(null);
    try {
      await signUp.sso({
        strategy: 'oauth_google',
        redirectUrl: '/onboarding',
        redirectCallbackUrl: '/sign-up',
      });
    } catch (err: unknown) {
      if (isClerkAPIResponseError(err)) {
        setErrorMessage(
          err.errors[0]?.message ?? 'Something went wrong. Please try again.'
        );
      } else {
        setErrorMessage('Something went wrong. Please try again.');
      }
    }
  };

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await signUp.create({
        firstName,
        lastName,
        emailAddress,
        password,
      });
      if (
        signUp.status === 'missing_requirements' &&
        signUp.unverifiedFields.includes('email_address')
      ) {
        await signUp.verifications.sendEmailCode();
        setStep('verify');
      }
    } catch (err: unknown) {
      if (isClerkAPIResponseError(err)) {
        const clerkErr = err.errors[0];
        if (clerkErr?.code === 'form_identifier_exists') {
          setErrorMessage(
            'An account with this email already exists. Please sign in instead.'
          );
        } else {
          setErrorMessage(
            clerkErr?.message ?? 'Something went wrong. Please try again.'
          );
        }
      } else {
        setErrorMessage('Something went wrong. Please try again.');
      }
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await signUp.verifications.verifyEmailCode({ code: verifyCode });
      if (signUp.status === 'complete' && signUp.createdSessionId) {
        await setActive({ session: signUp.createdSessionId });
        router.push('/onboarding');
      }
    } catch (err: unknown) {
      if (isClerkAPIResponseError(err)) {
        setErrorMessage(
          err.errors[0]?.message ?? 'Something went wrong. Please try again.'
        );
      } else {
        setErrorMessage('Something went wrong. Please try again.');
      }
    }
  };

  const busy = fetchStatus === 'fetching';
  return <AuthShell signUp>
    <h1>{step === 'info' ? 'A better handoff starts here.' : 'Check your inbox.'}</h1>
    <p className="care-auth-intro">{step === 'info' ? 'Create your account. Bring your care team together.' : `We sent a 6-digit verification code to ${emailAddress}.`}</p>
    {errorMessage && <p className="care-form-error" role="alert">{errorMessage}</p>}
    {step === 'info' && <>
      <button type="button" className="care-google" disabled={busy} onClick={handleGoogleSignUp}><GoogleMark /> Continue with Google</button>
      <p className="care-form-divider">or create an account with email</p>
      <form onSubmit={handleInfoSubmit} className="care-form" aria-busy={busy}>
        <div className="care-form-row">
          <div className="care-field"><label htmlFor="signup-first-name">First name</label><input id="signup-first-name" name="given-name" value={firstName} onChange={e => setFirstName(e.target.value)} required autoComplete="given-name" aria-invalid={!!errors?.fields?.firstName} aria-describedby={errors?.fields?.firstName ? 'first-name-error' : undefined} />{errors?.fields?.firstName && <p id="first-name-error" className="care-field-error" role="alert">{errors.fields.firstName.message}</p>}</div>
          <div className="care-field"><label htmlFor="signup-last-name">Last name</label><input id="signup-last-name" name="family-name" value={lastName} onChange={e => setLastName(e.target.value)} required autoComplete="family-name" aria-invalid={!!errors?.fields?.lastName} aria-describedby={errors?.fields?.lastName ? 'last-name-error' : undefined} />{errors?.fields?.lastName && <p id="last-name-error" className="care-field-error" role="alert">{errors.fields.lastName.message}</p>}</div>
        </div>
        <div className="care-field"><label htmlFor="signup-email">Email address</label><input id="signup-email" name="email" type="email" value={emailAddress} onChange={e => setEmailAddress(e.target.value)} required autoComplete="email" spellCheck={false} placeholder="you@organization.com" aria-invalid={!!errors?.fields?.emailAddress} aria-describedby={errors?.fields?.emailAddress ? 'signup-email-error' : undefined} />{errors?.fields?.emailAddress && <p id="signup-email-error" className="care-field-error" role="alert">{errors.fields.emailAddress.message}</p>}</div>
        <div className="care-field"><label htmlFor="signup-password">Password</label><div className="care-password"><input id="signup-password" name="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" aria-invalid={!!errors?.fields?.password} aria-describedby={errors?.fields?.password ? 'signup-password-error' : undefined} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button></div>{errors?.fields?.password && <p id="signup-password-error" className="care-field-error" role="alert">{errors.fields.password.message}</p>}</div>
        <div id="clerk-captcha" />
        <button type="submit" disabled={busy} className="care-button">{busy && <Loader2 size={17} className="care-spinner" aria-hidden="true" />}{busy ? 'Creating account…' : 'Sign up with email'}</button>
      </form>
    </>}
    {step === 'verify' && <form onSubmit={handleVerifySubmit} className="care-form" aria-busy={busy}>
      <div className="care-field"><label htmlFor="verify-code">Email verification code</label><input id="verify-code" name="code" value={verifyCode} onChange={e => setVerifyCode(e.target.value)} required inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" maxLength={6} spellCheck={false} placeholder="000000" aria-invalid={!!errors?.fields?.code} aria-describedby={errors?.fields?.code ? 'verify-code-error' : undefined} />{errors?.fields?.code && <p id="verify-code-error" className="care-field-error" role="alert">{errors.fields.code.message}</p>}</div>
      <button type="submit" disabled={busy} className="care-button">{busy && <Loader2 size={17} className="care-spinner" aria-hidden="true" />}{busy ? 'Verifying…' : 'Verify email'}</button>
      <button type="button" className="care-button care-button-secondary" disabled={busy} onClick={async () => { clearError(); try { await signUp.verifications.sendEmailCode(); } catch (err: unknown) { setErrorMessage(isClerkAPIResponseError(err) ? err.errors[0]?.message ?? 'Please try resending the code.' : 'Please try resending the code.'); } }}>Resend code</button>
      <button type="button" className="care-form-back" disabled={busy} onClick={() => { setStep('info'); clearError(); }}><ArrowLeft size={16} aria-hidden="true" /> Back to account details</button>
    </form>}
    <p className="care-form-help">Already part of a care team? <Link href="/sign-in">Sign in</Link></p>
  </AuthShell>;
}
