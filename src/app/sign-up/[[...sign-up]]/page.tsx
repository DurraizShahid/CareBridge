'use client';

import { useState } from 'react';
import { useSignUp, useAuth, useClerk } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

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
  const [verifyCode, setVerifyCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (isSignedIn) {
    router.push('/onboarding');
    return null;
  }

  const handleGoogleSignUp = async () => {
    await signUp.sso({
      strategy: 'oauth_google',
      redirectUrl: '/onboarding',
      redirectCallbackUrl: '/sign-up',
    });
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
      if (signUp.status === 'missing_requirements' && signUp.unverifiedFields.includes('email_address')) {
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
          setErrorMessage(clerkErr?.message ?? 'Something went wrong. Please try again.');
        }
      } else {
        setErrorMessage('Something went wrong. Please try again.');
      }
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signUp.verifications.verifyEmailCode({ code: verifyCode });
    if (signUp.status === 'complete' && signUp.createdSessionId) {
      await setActive({ session: signUp.createdSessionId });
      router.push('/onboarding');
    }
  };

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

          {step === 'info' && (
            <div className="space-y-4">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={handleGoogleSignUp}
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

              {errorMessage && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                  {errorMessage.includes('sign in') ? (
                    <>
                      {errorMessage.split('sign in')[0]}
                      <Link href="/sign-in" className="font-medium underline underline-offset-2">
                        sign in
                      </Link>
                      {errorMessage.split('sign in')[1] ?? '.'}
                    </>
                  ) : (
                    errorMessage
                  )}
                </div>
              )}

              <form onSubmit={handleInfoSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      First name
                    </label>
                    <Input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      required
                    />
                    {errors?.fields?.firstName && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.fields.firstName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Last name
                    </label>
                    <Input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      required
                    />
                    {errors?.fields?.lastName && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.fields.lastName.message}
                      </p>
                    )}
                  </div>
                </div>
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
                  {errors?.fields?.emailAddress && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.fields.emailAddress.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    required
                  />
                  {errors?.fields?.password && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.fields.password.message}
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
                  Already have an account?{' '}
                  <Link href="/sign-in" className="text-health hover:text-health/80">
                    Sign in
                  </Link>
                </p>
              </form>
            </div>
          )}

          {step === 'verify' && (
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Verification code
                </label>
                <Input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="Enter 6-digit code"
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
                  onClick={() => setStep('info')}
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
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  await signUp.verifications.sendEmailCode();
                }}
                disabled={fetchStatus === 'fetching'}
              >
                Resend code
              </Button>
            </form>
          )}
        </div>
        {/* Required for sign-up flows */}
        <div id="clerk-captcha" />
      </div>
    </div>
  );
}