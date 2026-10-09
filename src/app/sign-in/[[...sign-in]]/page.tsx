'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSignIn, useAuth, useClerk } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
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

  const inputStyle: React.CSSProperties = {
    height: 42,
    width: '100%',
    borderRadius: 22,
    border: '1px solid #dedede',
    background: '#F7F7F5',
    padding: '0 13px',
    fontSize: 13,
    color: '#202020',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const focusedInputStyle: React.CSSProperties = {
    ...inputStyle,
    borderColor: '#a8a8a8',
    boxShadow: '0 0 0 3px rgba(0, 0, 0, 0.035)',
  };

  const [focusedField, setFocusedField] = useState<string | null>(null);

  return (
    <div className="brand-auth-layout" style={{
      display: 'grid',
      minHeight: '100dvh',
      background: '#F7F7F5',
    }}>
      {/* Left — Visual Panel */}
      <div className="brand-auth-visual" style={{
        position: 'relative',
        overflow: 'hidden',
        background: '#DCEBFF',
        minHeight: '100dvh',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(ellipse at 78% 15%, rgba(110,168,242,.48), transparent 53%), radial-gradient(ellipse at 16% 84%, rgba(209,226,255,.90), transparent 58%), radial-gradient(ellipse at 35% 40%, rgba(255,255,255,.62), transparent 62%), linear-gradient(145deg,#EEF4FC,#B8D4FA)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(16,43,78,.03), rgba(37,93,206,.12))',
        }} />
        {/* Logo */}
        <div style={{
          position: 'absolute',
          top: 30,
          left: 34,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 1,
        }}>
          <BrandLogo tone="navy" className="w-[196px]" priority />
        </div>
        {/* Testimonial */}
        <div style={{
          position: 'absolute',
          left: 34,
          right: 50,
          bottom: 36,
          zIndex: 1,
        }}>
          <p style={{
            fontSize: 14,
            lineHeight: 1.55,
            fontWeight: 400,
            color: '#26466C',
            margin: 0,
          }}>
            A calm place to coordinate every transition, from hospital discharge to supported care.
          </p>
          <p style={{
            fontSize: 13,
            lineHeight: 1.5,
            fontWeight: 400,
            color: '#557397',
            margin: '4px 0 0',
          }}>
            CareBridge Health · Placement coordination
          </p>
        </div>
      </div>

      {/* Right — Form Panel */}
      <div className="brand-auth-panel" style={{
        background: '#F7F7F5',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
      }}>
        {/* Top-right login link */}
        <Link
          href="/sign-up"
          style={{
            position: 'absolute',
            top: 30,
            right: 38,
            fontSize: 13,
            fontWeight: 500,
            color: '#102B4E',
            textDecoration: 'none',
          }}
        >
          Create account
        </Link>

        <div style={{
          width: '100%',
          maxWidth: 410,
        }}>
          {/* Heading */}
          <h1 style={{
            fontSize: 25,
            lineHeight: 1.2,
            fontWeight: 600,
            letterSpacing: '-0.035em',
            textAlign: 'center',
            color: '#102B4E',
            margin: 0,
          }}>
            {step === 'email' && 'Sign in'}
            {step === 'password' && 'Enter your password'}
            {step === 'mfa' && 'Two-factor authentication'}
          </h1>

          <p style={{
            marginTop: 10,
            fontSize: 13,
            lineHeight: 1.5,
            fontWeight: 400,
            textAlign: 'center',
            color: '#8d8d8d',
          }}>
            {step === 'email' && 'Enter your email below to sign in.'}
            {step === 'password' && 'Enter your password to continue.'}
            {step === 'mfa' && 'Enter the verification code from your authenticator app.'}
          </p>

          <div style={{ marginTop: 26 }}>
            {/* Error Message */}
            {errorMessage && (
              <div
                role="alert"
                style={{
                  marginBottom: 16,
                  borderRadius: 22,
                  border: '1px solid rgba(220, 38, 38, 0.2)',
                  background: 'rgba(254, 226, 226, 0.5)',
                  padding: '10px 13px',
                  fontSize: 13,
                  color: '#991b1b',
                  lineHeight: 1.5,
                }}
              >
                {errorMessage}
              </div>
            )}

            {/* Step: Email */}
            {step === 'email' && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={fetchStatus === 'fetching'}
                  className="h-[42px] w-full border-0 bg-white shadow-[0_8px_24px_rgba(16,43,78,0.055)] text-[13px] font-medium text-[#252525]"
                >
                  <svg width="16" height="16" aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M12.545,10.239v3.818h5.145c-0.204,1.125-1.032,2.067-2.398,2.667c-1.366,0.6-2.995,0.468-4.177-0.352c-1.182-0.82-1.831-2.088-1.831-3.365s0.649-2.545,1.831-3.365c1.182-0.82,2.811-0.952,4.177-0.352c0.655,0.288,1.168,0.717,1.557,1.239l2.141-2.141c-0.961-0.902-2.237-1.591-3.698-1.991C14.821,2.181,13.444,1.999,12,2c-5.523,0-10,4.477-10,10s4.477,10,10,10s10-4.477,10-10c0-0.298-0.013-0.591-0.038-0.877L12.545,10.239z" fill="#4285F4"/>
                    <path d="M3.59,7.543l2.475,1.857C7.111,5.999,9.397,4.65,12,4.65c1.444,0,2.821,0.182,4.034,0.511c1.213,0.329,2.291,0.822,3.165,1.436l2.141-2.141C19.632,2.695,16.098,1,12,1C7.306,1,3.264,3.491,1.478,7.199L3.59,7.543z" fill="#EA4335"/>
                    <path d="M12,23c4.098,0,7.632-1.695,10.198-4.445l-2.24-1.941c-1.95,1.311-4.436,2.086-7.958,2.086c-2.603,0-4.889-1.349-6.256-3.515l-2.45,1.901C3.762,20.535,7.588,23,12,23z" fill="#34A853"/>
                    <path d="M1.439,6.801C1.159,7.64,1,8.544,1,9.5s0.159,1.86,0.439,2.699l2.541-1.969c-0.178-0.533-0.279-1.087-0.279-1.669s0.101-1.136,0.279-1.669L1.439,6.801z" fill="#FBBC05"/>
                  </svg>
                  Continue with Google
                </button>

                {/* Divider */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  margin: '26px 0',
                }}>
                  <div style={{ height: 1, background: '#e7e7e7', flex: 1 }} />
                  <span style={{
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                    color: '#9a9a9a',
                    whiteSpace: 'nowrap',
                  }}>
                    OR CONTINUE WITH
                  </span>
                  <div style={{ height: 1, background: '#e7e7e7', flex: 1 }} />
                </div>

                <form onSubmit={handleEmailSubmit} noValidate>
                  <input
                    id="signin-email"
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    onFocus={() => setFocusedField('signin-email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="name@example.com"
                    required
                    autoComplete="email"
                    style={focusedField === 'signin-email' ? focusedInputStyle : inputStyle}
                    aria-describedby={errors?.fields?.identifier ? 'signin-email-error' : undefined}
                  />
                  {errors?.fields?.identifier && (
                    <p id="signin-email-error" style={{ fontSize: 12, color: '#dc2626', margin: '4px 0 0' }} role="alert">
                      {errors.fields.identifier.message}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={fetchStatus === 'fetching'}
                    className="h-[42px] w-full border-none text-[13px] font-medium text-white mt-2"
                  >
                    {fetchStatus === 'fetching' ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                        Checking...
                      </span>
                    ) : (
                      'Sign In with Email'
                    )}
                  </button>
                </form>

                <p style={{
                  marginTop: 24,
                  maxWidth: 300,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  fontSize: 12,
                  lineHeight: 1.5,
                  textAlign: 'center',
                  color: '#818181',
                }}>
                  By clicking continue, you agree to our{' '}
                  <Link href="/terms" style={{ color: '#666666', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" style={{ color: '#666666', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                    Privacy Policy
                  </Link>.
                </p>
              </>
            )}

            {/* Step: Password */}
            {step === 'password' && (
              <form onSubmit={handlePasswordSubmit} noValidate>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  borderRadius: 22,
                  border: '1px solid #e7e7e7',
                  background: '#f8f8f8',
                  padding: '10px 13px',
                  fontSize: 13,
                  marginBottom: 16,
                }}>
                  <span style={{ color: '#8d8d8d' }}>Signed in as</span>
                  <span style={{ color: '#202020', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {emailAddress}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setPassword(''); clearError(); }}
                    style={{
                      marginLeft: 'auto',
                      fontSize: 12,
                      fontWeight: 500,
                      color: '#666',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      textUnderlineOffset: 2,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Change
                  </button>
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('signin-password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    style={focusedField === 'signin-password' ? { ...focusedInputStyle, paddingRight: 38 } : { ...inputStyle, paddingRight: 38 }}
                    aria-describedby={errors?.fields?.password ? 'signin-password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      color: '#9c9c9c',
                    }}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors?.fields?.password && (
                  <p id="signin-password-error" style={{ fontSize: 12, color: '#dc2626', margin: '4px 0 0' }} role="alert">
                    {errors.fields.password.message}
                  </p>
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 12,
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    color: '#666',
                    cursor: 'pointer',
                  }}>
                    <input
                      type="checkbox"
                      checked={false}
                      readOnly
                      style={{ accentColor: '#191817' }}
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    style={{
                      fontSize: 13,
                      color: '#666',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      textUnderlineOffset: 2,
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setPassword(''); clearError(); }}
                    disabled={fetchStatus === 'fetching'}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 22,
                      border: '1px solid #dedede',
                      background: '#F7F7F5',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                    aria-label="Go back"
                  >
                    <ArrowLeft size={15} color="#252525" />
                  </button>
                  <button
                    type="submit"
                    disabled={fetchStatus === 'fetching'}
                    className="h-[42px] flex-1 border-none text-[13px] font-medium text-white"
                  >
                    {fetchStatus === 'fetching' ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                        Signing in...
                      </span>
                    ) : (
                      'Sign in'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step: MFA */}
            {step === 'mfa' && (
              <form onSubmit={handleMfaSubmit} noValidate>
                <p style={{ fontSize: 12, color: '#8d8d8d', marginBottom: 8 }}>
                  Enter the 6-digit code from your authenticator app.
                </p>
                <input
                  id="mfa-code"
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  onFocus={() => setFocusedField('mfa-code')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="000000"
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  style={{
                    ...(focusedField === 'mfa-code' ? focusedInputStyle : inputStyle),
                    textAlign: 'center',
                    fontSize: 16,
                    letterSpacing: '0.3em',
                  }}
                  aria-describedby={errors?.fields?.code ? 'mfa-code-error' : undefined}
                />
                {errors?.fields?.code && (
                  <p id="mfa-code-error" style={{ fontSize: 12, color: '#dc2626', margin: '4px 0 0' }} role="alert">
                    {errors.fields.code.message}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={() => setStep('password')}
                    disabled={fetchStatus === 'fetching'}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 22,
                      border: '1px solid #dedede',
                      background: '#F7F7F5',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                    aria-label="Go back"
                  >
                    <ArrowLeft size={15} color="#252525" />
                  </button>
                  <button
                    type="submit"
                    disabled={fetchStatus === 'fetching'}
                    className="h-[42px] flex-1 border-none text-[13px] font-medium text-white"
                  >
                    {fetchStatus === 'fetching' ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                        Verifying...
                      </span>
                    ) : (
                      'Verify'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 899px) {
          div[style*="grid-template-columns: 1fr 1fr"] > :first-child {
            display: none !important;
          }
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 479px) {
          div[style*="padding: 48px"] {
            padding: 24px !important;
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
