'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSignIn, useAuth, useClerk } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Eye, EyeOff, Shield, ArrowLeft, Mail, Lock, KeyRound } from 'lucide-react';

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
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error') || params.get('oauth_error');
    return error ? decodeURIComponent(error) : null;
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    try {
      await signIn.sso({
        strategy: 'oauth_google',
        redirectUrl: '/onboarding',
        redirectCallbackUrl: '/sign-in',
      });
    } catch (err: unknown) {
      if (isClerkAPIResponseError(err)) {
        setErrorMessage(err.errors[0]?.message ?? 'Something went wrong. Please try again.');
      } else {
        setErrorMessage('Something went wrong. Please try again.');
      }
    }
  };

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

  const authCardClasses =
    'w-full max-w-md card-enter rounded-2xl border border-border/50 bg-card/80 p-8 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.08)] backdrop-blur-xl transition-shadow duration-300 hover:shadow-[0_8px_48px_-8px_rgba(0,0,0,0.12)] sm:p-10';

  const inputClasses =
    'h-11 rounded-xl border-border/60 bg-background/50 pl-10 text-sm transition-all duration-200 placeholder:text-muted-foreground/50 focus-visible:border-health/50 focus-visible:ring-2 focus-visible:ring-health/20';

  const iconWrapperClasses =
    'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors duration-200';

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-[#F6F5FA] via-white to-blue-50/60 dark:from-background dark:via-background dark:to-blue-950/10">
      {/* Decorative background blobs */}
      <div className="pointer-events-none fixed -right-48 -top-48 h-[36rem] w-[36rem] opacity-[0.06] dark:opacity-[0.10]">
        <div className="h-full w-full" style={{
          background: 'radial-gradient(circle, oklch(0.55 0.15 215), transparent 70%)',
          borderRadius: '50%',
        }} />
      </div>
      <div className="pointer-events-none fixed -bottom-48 -left-48 h-[36rem] w-[36rem] opacity-[0.04] dark:opacity-[0.08]">
        <div className="h-full w-full" style={{
          background: 'radial-gradient(circle, oklch(0.6 0.15 280), transparent 70%)',
          borderRadius: '50%',
        }} />
      </div>

      {/* Left — Brand Panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0B1A2E] via-[#0F2937] to-[#163838] p-12 lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96">
          <div className="gradient-blob h-full w-full" />
        </div>
        <div className="absolute -bottom-40 -left-20 h-[30rem] w-[30rem]">
          <div className="gradient-blob h-full w-full" style={{ animationDelay: '-6s' }} />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.03),transparent_50%)]" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <Image
              src="/carebridge.svg"
              alt="CareBridge"
              width={40}
              height={40}
              className="h-10 w-10"
              priority
            />
            <span className="font-heading text-xl font-bold text-white">
              CareBridge
            </span>
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-health/20 backdrop-blur-sm">
              <Shield className="h-5 w-5 text-health" />
            </div>
            <div>
              <p className="text-base font-medium text-white">
                Trusted Healthcare Platform
              </p>
              <p className="text-sm text-blue-200/60">
                Secure &amp; HIPAA-compliant
              </p>
            </div>
          </div>

          <blockquote className="space-y-3 border-l-2 border-health/50 pl-5">
            <p className="text-lg leading-relaxed text-blue-100/90">
              &ldquo;CareBridge has transformed how we place patients. What
              used to take days now takes hours.&rdquo;
            </p>
            <footer className="text-sm text-blue-200/60">
              — Sarah Johnson, Senior Social Worker
              <br />
              Metropolitan General Hospital
            </footer>
          </blockquote>

          <div className="flex items-center gap-8">
            {[
              { stat: '85%', label: 'Faster placements' },
              { stat: '1,200+', label: 'Facilities onboarded' },
              { stat: '92%', label: 'Satisfaction rate' },
            ].map((item) => (
              <div key={item.label} className="group">
                <div className="font-heading text-2xl font-bold text-health transition-transform duration-300 group-hover:translate-y-[-2px]">
                  {item.stat}
                </div>
                <div className="mt-0.5 text-xs text-blue-200/60">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-blue-200/40">
          &copy; {new Date().getFullYear()} CareBridge Health, Inc.
        </div>
      </div>

      {/* Right — Sign-In Form */}
      <div className="flex w-full flex-col items-center justify-center px-5 py-8 lg:w-1/2">
        {/* Mobile brand mark */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <Image
            src="/carebridge.svg"
            alt="CareBridge"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="font-heading text-lg font-bold text-primary">
            CareBridge
          </span>
        </div>

        <div className={authCardClasses}>
          {/* Card Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-health to-teal-400 shadow-lg shadow-health/20 ring-1 ring-white/10 ring-inset transition-transform duration-300 hover:scale-105">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              {step === 'email' && 'Welcome back'}
              {step === 'password' && 'Enter your password'}
              {step === 'mfa' && 'Two-factor authentication'}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {step === 'email' && 'Sign in to your account to continue.'}
              {step === 'password' && 'Enter your password to continue.'}
              {step === 'mfa' && 'Enter the verification code from your authenticator app.'}
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-6 animate-in fade-in-0 slide-in-from-top-2 duration-200 rounded-xl border border-red-200/80 bg-red-50/80 p-4 text-sm text-red-700 backdrop-blur-sm dark:border-red-800/40 dark:bg-red-950/40 dark:text-red-400"
            >
              <div className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Step: Email */}
          {step === 'email' && (
            <div className="animate-in fade-in-0 slide-in-from-bottom-3 duration-300 space-y-5">
              <Button
                type="button"
                variant="outline"
                className="group relative h-11 w-full gap-2.5 overflow-hidden rounded-xl border-border/60 text-sm font-medium transition-all duration-200 hover:border-health/30 hover:bg-health/[0.03]"
                onClick={handleGoogleSignIn}
                disabled={fetchStatus === 'fetching'}
              >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-health/[0.03] to-transparent transition-transform duration-500 group-hover:translate-x-0" />
                <svg
                  className="relative h-4 w-4 shrink-0"
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12.545,10.239v3.818h5.145c-0.204,1.125-1.032,2.067-2.398,2.667c-1.366,0.6-2.995,0.468-4.177-0.352c-1.182-0.82-1.831-2.088-1.831-3.365s0.649-2.545,1.831-3.365c1.182-0.82,2.811-0.952,4.177-0.352c0.655,0.288,1.168,0.717,1.557,1.239l2.141-2.141c-0.961-0.902-2.237-1.591-3.698-1.991C14.821,2.181,13.444,1.999,12,2c-5.523,0-10,4.477-10,10s4.477,10,10,10s10-4.477,10-10c0-0.298-0.013-0.591-0.038-0.877L12.545,10.239z"
                    fill="#4285F4"
                  />
                  <path
                    d="M3.59,7.543l2.475,1.857C7.111,5.999,9.397,4.65,12,4.65c1.444,0,2.821,0.182,4.034,0.511c1.213,0.329,2.291,0.822,3.165,1.436l2.141-2.141C19.632,2.695,16.098,1,12,1C7.306,1,3.264,3.491,1.478,7.199L3.59,7.543z"
                    fill="#EA4335"
                  />
                  <path
                    d="M12,23c4.098,0,7.632-1.695,10.198-4.445l-2.24-1.941c-1.95,1.311-4.436,2.086-7.958,2.086c-2.603,0-4.889-1.349-6.256-3.515l-2.45,1.901C3.762,20.535,7.588,23,12,23z"
                    fill="#34A853"
                  />
                  <path
                    d="M1.439,6.801C1.159,7.64,1,8.544,1,9.5s0.159,1.86,0.439,2.699l2.541-1.969c-0.178-0.533-0.279-1.087-0.279-1.669s0.101-1.136,0.279-1.669L1.439,6.801z"
                    fill="#FBBC05"
                  />
                </svg>
                <span className="relative">Continue with Google</span>
              </Button>

              <div className="relative">
                <Separator className="bg-border/40" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground/60">
                  or continue with email
                </span>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email" className="text-sm font-medium">
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className={iconWrapperClasses + (focusedField === 'signin-email' ? ' text-health' : '')} size={16} />
                    <Input
                      id="signin-email"
                      type="email"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      onFocus={() => setFocusedField('signin-email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="name@example.com"
                      required
                      autoComplete="email"
                      className={inputClasses}
                      aria-describedby={errors?.fields?.identifier ? 'signin-email-error' : undefined}
                    />
                  </div>
                  {errors?.fields?.identifier && (
                    <p id="signin-email-error" className="text-xs text-red-500" role="alert">
                      {errors.fields.identifier.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="group relative h-11 w-full overflow-hidden rounded-xl bg-gradient-to-r from-health to-teal-500 text-sm font-semibold text-white shadow-lg shadow-health/20 transition-all duration-300 hover:shadow-xl hover:shadow-health/30 active:scale-[0.98] disabled:opacity-60"
                  disabled={fetchStatus === 'fetching'}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full transition-transform duration-500 group-hover:translate-x-full" />
                  {fetchStatus === 'fetching' ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Checking...
                    </span>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground/80">
                Don&apos;t have an account?{' '}
                <Link
                  href="/sign-up"
                  className="font-medium text-health transition-colors duration-200 hover:text-health/80"
                >
                  Sign up
                </Link>
              </p>
            </div>
          )}

          {/* Step: Password */}
          {step === 'password' && (
            <form
              onSubmit={handlePasswordSubmit}
              className="animate-in fade-in-0 slide-in-from-bottom-3 duration-300 space-y-5"
              noValidate
            >
              <div className="flex items-center gap-2.5 rounded-xl border border-border/40 bg-muted/30 p-3.5 text-sm">
                <Mail size={14} className="shrink-0 text-muted-foreground/60" />
                <span className="text-muted-foreground/80">Signed in as </span>
                <span className="truncate font-medium text-foreground">
                  {emailAddress}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setPassword('');
                    clearError();
                  }}
                  className="ml-auto shrink-0 text-xs font-medium text-health transition-colors duration-200 hover:text-health/80"
                >
                  Change
                </button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signin-password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className={iconWrapperClasses + (focusedField === 'signin-password' ? ' text-health' : '')} size={16} />
                  <Input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('signin-password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className={inputClasses + ' pr-10'}
                    aria-describedby={errors?.fields?.password ? 'signin-password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors duration-200 hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors?.fields?.password && (
                  <p id="signin-password-error" className="text-xs text-red-500" role="alert">
                    {errors.fields.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    className="border-border/60 data-[state=checked]:bg-health data-[state=checked]:border-health"
                  />
                  <Label htmlFor="remember-me" className="text-sm text-muted-foreground/80 cursor-pointer select-none">
                    Remember me
                  </Label>
                </div>
                <button
                  type="button"
                  className="text-sm font-medium text-health transition-colors duration-200 hover:text-health/80"
                >
                  Forgot password?
                </button>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep('email');
                    setPassword('');
                    clearError();
                  }}
                  disabled={fetchStatus === 'fetching'}
                  className="h-11 w-11 shrink-0 rounded-xl border-border/60 transition-all duration-200 hover:border-health/30 hover:bg-health/[0.03]"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="submit"
                  className="group relative flex-1 overflow-hidden rounded-xl bg-gradient-to-r from-health to-teal-500 text-sm font-semibold text-white shadow-lg shadow-health/20 transition-all duration-300 hover:shadow-xl hover:shadow-health/30 active:scale-[0.98] disabled:opacity-60"
                  disabled={fetchStatus === 'fetching'}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full transition-transform duration-500 group-hover:translate-x-full" />
                  {fetchStatus === 'fetching' ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Step: MFA */}
          {step === 'mfa' && (
            <form
              onSubmit={handleMfaSubmit}
              className="animate-in fade-in-0 slide-in-from-bottom-3 duration-300 space-y-5"
              noValidate
            >
              <div className="space-y-1.5">
                <Label htmlFor="mfa-code" className="text-sm font-medium">
                  Authentication code
                </Label>
                <p className="text-xs text-muted-foreground/70">
                  Enter the 6-digit code from your authenticator app.
                </p>
                <div className="relative">
                  <KeyRound className={iconWrapperClasses + (focusedField === 'mfa-code' ? ' text-health' : '')} size={16} />
                  <Input
                    id="mfa-code"
                    type="text"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    onFocus={() => setFocusedField('mfa-code')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter 6-digit code"
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    className={inputClasses + ' text-center text-lg tracking-[0.3em]'}
                    aria-describedby={errors?.fields?.code ? 'mfa-code-error' : undefined}
                  />
                </div>
                {errors?.fields?.code && (
                  <p id="mfa-code-error" className="text-xs text-red-500" role="alert">
                    {errors.fields.code.message}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('password')}
                  disabled={fetchStatus === 'fetching'}
                  className="h-11 w-11 shrink-0 rounded-xl border-border/60 transition-all duration-200 hover:border-health/30 hover:bg-health/[0.03]"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="submit"
                  className="group relative flex-1 overflow-hidden rounded-xl bg-gradient-to-r from-health to-teal-500 text-sm font-semibold text-white shadow-lg shadow-health/20 transition-all duration-300 hover:shadow-xl hover:shadow-health/30 active:scale-[0.98] disabled:opacity-60"
                  disabled={fetchStatus === 'fetching'}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full transition-transform duration-500 group-hover:translate-x-full" />
                  {fetchStatus === 'fetching' ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    'Verify'
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
