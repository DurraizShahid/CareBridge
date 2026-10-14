export type PaymentMode = "demo" | "test" | "live";

/** Fail closed with a server-log line naming the variable; never logs values. */
function fail(message: string): never {
  console.error("[stripe-config] " + message);
  throw new Error(message);
}

const PLACEHOLDER = /placeholder|changeme|replace|dummy|fake|your[_-]|example|xxx|<|>/;

/**
 * Live charges require STRIPE_ENABLE_LIVE_CHARGES=true plus a complete set of
 * live keys. Any misconfiguration throws (fails closed) instead of charging.
 */
export function getPaymentMode(env: NodeJS.ProcessEnv = process.env): PaymentMode {
  const key = (env.STRIPE_SECRET_KEY ?? "").trim();
  const publishable = (env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "").trim();
  const webhookSecret = (env.STRIPE_WEBHOOK_SECRET ?? "").trim();
  if ((env.STRIPE_ENABLE_LIVE_CHARGES ?? "").trim().toLowerCase() === "true") {
    if (!key.startsWith("sk_live_") || key.length < 16 || PLACEHOLDER.test(key.toLowerCase()))
      fail("STRIPE_ENABLE_LIVE_CHARGES=true requires a live STRIPE_SECRET_KEY (sk_live_)");
    if (!publishable.startsWith("pk_live_"))
      fail("STRIPE_ENABLE_LIVE_CHARGES=true requires NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_live_)");
    if (!webhookSecret.startsWith("whsec_"))
      fail("STRIPE_ENABLE_LIVE_CHARGES=true requires STRIPE_WEBHOOK_SECRET (whsec_)");
    return "live";
  }
  if (!key || PLACEHOLDER.test(key.toLowerCase()))
    return "demo";
  if (key.startsWith("sk_live_"))
    fail("Live Stripe charges are disabled; set STRIPE_ENABLE_LIVE_CHARGES=true to enable");
  if (!key.startsWith("sk_test_") || key.length < 16)
    fail("Invalid STRIPE_SECRET_KEY; expected Stripe test secret key");
  if (!publishable.startsWith("pk_test_"))
    fail("Stripe test mode requires NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  if (!webhookSecret.startsWith("whsec_"))
    fail("Stripe test mode requires STRIPE_WEBHOOK_SECRET");
  return "test";
}

export function demoClientSecret(paymentId: string) {
  return "demo_pi_" + paymentId + "_secret_simulated";
}
