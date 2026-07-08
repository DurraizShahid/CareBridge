'use client';

import { useState } from 'react';
import { useSignIn, useAuth, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  if (isSignedIn) {
    router.push('/onboarding');
    return null;
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn.create({ identifier: emailAddress });
    if (signIn.status === 'needs_first_factor') {
      setStep('password');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn.password({ identifier: emailAddress, password });
    if (signIn.status === 'needs_second_factor') {
      setStep('mfa');
    } else if (signIn.status === 'complete' && signIn.createdSessionId) {
      await setActive({ session: signIn.createdSessionId });
      router.push('/onboarding');
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn.mfa.verifyTOTP({ code: mfaCode });
    if (signIn.status === 'complete' && signIn.createdSessionId) {
      await setActive({ session: signIn.createdSessionId });
      router.push('/onboarding');
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

          {step === 'email' && (
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
                Don't have an account?{' '}
                <Link href="/sign-up" className="text-health hover:text-health/80">
                  Sign up
                </Link>
              </p>
            </form>
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
              <Button
                type="submit"
                className="w-full"
                disabled={fetchStatus === 'fetching'}
              >
                {fetchStatus === 'fetching' && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Verify
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}