# Stripe live go-live runbook

Going live is configuration only; no code change is needed. Never commit key
values. They belong in Vercel only.

## 1. Vercel environment variables (Production)

Add these in Vercel → Project → Settings → Environment Variables, scoped to **Production**:

| Name | Value comes from |
| --- | --- |
| `STRIPE_SECRET_KEY` | Stripe Dashboard (live mode) → Developers → API keys → Secret key (`sk_live_…`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Same page, Publishable key (`pk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | The signing secret of the webhook endpoint from step 2 (`whsec_…`) |
| `STRIPE_ENABLE_LIVE_CHARGES` | The literal `true` |
| `MIN_DEPOSIT_CENTS` | Optional. The approved minimum deposit in cents (default 50) |

`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is inlined at build time, so **redeploy**
after adding or changing it. It is the only Stripe value the browser ever sees.

## 2. Stripe Dashboard webhook endpoint

Stripe Dashboard (live mode) → Developers → Webhooks → Add endpoint:

- Endpoint URL: `https://carebridge.health/api/webhooks/stripe`
  (use the production domain configured in Vercel if it differs)
- Events to subscribe to:
  - `payment_intent.succeeded`: marks the deposit paid and reserves the bed
  - `payment_intent.payment_failed`: marks the deposit failed so the hospital can retry
  - `charge.refunded`: a full refund marks the deposit refunded, releases the bed
    reservation, and flags the referral (`depositIssue`)

Copy the endpoint's signing secret into `STRIPE_WEBHOOK_SECRET`.

## 3. Mode rules (enforced in `src/lib/payment-mode.ts`)

| Configuration | Result |
| --- | --- |
| `STRIPE_ENABLE_LIVE_CHARGES` unset/not `true`, no secret key | Demo mode. Stripe is never called |
| Flag not `true`, `sk_test_` + `pk_test_` + `whsec_` | Stripe test mode, no real money |
| Flag not `true`, `sk_live_` key present | Fails closed with a server error, no charge |
| Flag `true`, any of the three live values missing or wrong prefix | Fails closed with a `[stripe-config]` server log naming the variable, no charge |
| Flag `true`, `sk_live_` + `pk_live_` + `whsec_` | Live charges via PaymentIntents |

## 4. Verify after deploy

1. Vercel function logs show no `[stripe-config]` lines.
2. Stripe Dashboard → the webhook endpoint → "Send test event" returns 2xx
   (an unknown PaymentIntent returns 409, which still proves the signature check passed;
   a 400 means `STRIPE_WEBHOOK_SECRET` is wrong).
3. Do one small real deposit, confirm the bed is reserved, then refund it in the
   Dashboard and confirm the reservation is released.

## Rollback

Set `STRIPE_ENABLE_LIVE_CHARGES` to anything other than `true` and remove
`STRIPE_SECRET_KEY`, then redeploy. The app returns to demo mode. Payments already
taken in live mode stay in Stripe and must be reconciled there.

PHI rule: Stripe metadata only ever holds opaque `paymentId`, `referralId`, and
`contractId`. Never add patient data.
