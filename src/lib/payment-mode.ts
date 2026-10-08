export type PaymentMode = "demo" | "test" | "live";

/** Live charges require an explicit deployment gate; disabled for this phase. */
export function getPaymentMode(env: NodeJS.ProcessEnv = process.env): PaymentMode {
  const key = (env.STRIPE_SECRET_KEY ?? "").trim();
  const low = key.toLowerCase();
  if (!key || /placeholder|changeme|replace|dummy|fake|your[_-]|example|xxx|<|>/.test(low))
    return "demo";
  if (key.startsWith("sk_live_"))
    throw new Error("Live Stripe charges are disabled for this phase");
  if (!key.startsWith("sk_test_") || key.length < 16)
    throw new Error("Invalid STRIPE_SECRET_KEY; expected Stripe test secret key");
  if (!(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "").startsWith("pk_test_"))
    throw new Error("Stripe test mode requires NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  if (!(env.STRIPE_WEBHOOK_SECRET ?? "").startsWith("whsec_"))
    throw new Error("Stripe test mode requires STRIPE_WEBHOOK_SECRET");
  return "test";
}

export function demoClientSecret(paymentId: string) {
  return "demo_pi_" + paymentId + "_secret_simulated";
}