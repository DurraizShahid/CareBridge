'use client';

import { useState } from 'react';
import { useSignUp, useAuth, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  if (isSignedIn) {
    router.push('/onboarding');
    return null;
  }

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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