'use client';

import { useEffect, useState } from 'react';
import { useSignIn, useAuth, useClerk } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

export default function SignInPage() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { setActive } = useClerk();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'password' | 'mfa'>('email');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      router.push('/onboarding');
    }
  }, [isSignedIn, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error') || params.get('oauth_error');
    if (error) {
      setErrorMessage(decodeURIComponent(error));
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      url.searchParams.delete('oauth_error');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

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

  return (
    <div className="flex min-h-screen">
      {/* Left — Brand Panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-[#0F1A2E] via-[#1a2d45] to-primary p-12 lg:flex">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image
              src="/carebridge.svg"
              alt="CareBridge"
              width={40}
              height={40}
              className="h-10 w-10"
            />
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

      {/* Right — Sign-In Form */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        {/* Mobile brand mark */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
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

        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to your account to continue.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
              {errorMessage}
            </div>
          )}

          {step === 'email' && (
            <div className="space-y-4">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={fetchStatus === 'fetching'}
              >
                <svg
                  className="mr-2 h-4 w-4"
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12.545,10.239v3.818h5.145c-0.204,1.125-1.032,2.067-2.398,2.667c-1.366,0.6-2.995,0.468-4.177-0.352
                    c-1.182-0.82-1.831-2.088-1.831-3.365s0.649-2.545,1.831-3.365c1.182-0.82,2.811-0.952,4.177-0.352
                    c0.655,0.288,1.168,0.717,1.557,1.239l2.141-2.141c-0.961-0.902-2.237-1.591-3.698-1.991
                    C14.821,2.181,13.444,1.999,12,2c-5.523,0-10,4.477-10,10s4.477,10,10,10s10-4.477,10-10c0-0.298-0.013-0.591-0.038-0.877
                    L12.545,10.239z"
                    fill="#4285F4"
                  />
                  <path
                    d="M3.59,7.543l2.475,1.857C7.111,5.999,9.397,4.65,12,4.65c1.444,0,2.821,0.182,4.034,0.511
                    c1.213,0.329,2.291,0.822,3.165,1.436l2.141-2.141C19.632,2.695,16.098,1,12,1C7.306,1,3.264,3.491,1.478,7.199L3.59,7.543z"
                    fill="#EA4335"
                  />
                  <path
                    d="M12,23c4.098,0,7.632-1.695,10.198-4.445l-2.24-1.941c-1.95,1.311-4.436,2.086-7.958,2.086
                    c-2.603,0-4.889-1.349-6.256-3.515l-2.45,1.901C3.762,20.535,7.588,23,12,23z"
                    fill="#34A853"
                  />
                  <path
                    d="M1.439,6.801C1.159,7.64,1,8.544,1,9.5s0.159,1.86,0.439,2.699l2.541-1.969c-0.178-0.533-0.279-1.087-0.279-1.669
                    s0.101-1.136,0.279-1.669L1.439,6.801z"
                    fill="#FBBC05"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="relative my-4">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                  or
                </span>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Email address
                  </label>
                  <Input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="name@example.com"
                    required
                  />
                  {errors?.fields?.identifier && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.fields.identifier.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={fetchStatus === 'fetching'}
                >
                  {fetchStatus === 'fetching' && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Continue
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <Link href="/sign-up" className="text-health hover:text-health/80">
                    Sign up
                  </Link>
                </p>
              </form>
            </div>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                {errors?.fields?.password && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.fields.password.message}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep('email')}
                  disabled={fetchStatus === 'fetching'}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={fetchStatus === 'fetching'}
                >
                  {fetchStatus === 'fetching' && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Sign in
                </Button>
              </div>
            </form>
          )}

          {step === 'mfa' && (
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Two-factor code
                </label>
                <Input
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="Enter your 2FA code"
                  required
                />
                {errors?.fields?.code && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.fields.code.message}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep('password')}
                  disabled={fetchStatus === 'fetching'}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={fetchStatus === 'fetching'}
                >
                  {fetchStatus === 'fetching' && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Verify
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
