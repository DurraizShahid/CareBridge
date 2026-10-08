# Stripe deposit modes and deployment

## Environment configuration

| Variable | Demo (default) | Stripe test | Production (after approval) |
| --- | --- | --- | --- |
| STRIPE_SECRET_KEY | blank, unset, or placeholder | sk_test_... | sk_live_... |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | unset | pk_test_... | pk_live_... |
| STRIPE_WEBHOOK_SECRET | unset | whsec_... | whsec_... |
| STRIPE_ENABLE_LIVE_CHARGES | unset | unset | true (explicit opt-in) |
| MIN_DEPOSIT_CENTS | 50 default | 50 default | approved minimum |

**Demo:** Omitting STRIPE_SECRET_KEY activates demo. All demo flows avoid Stripe.
A malformed key fails closed. Both tests and demo charge no real money.

**Test:** Set the three Stripe variables using a Stripe *test-mode* account.
Set Stripe's webhook endpoint to POST /api/webhooks/stripe and subscribe to
payment_intent.succeeded and payment_intent.payment_failed. Stripe CLI forwarding
can be used locally. Use test cards with Stripe Elements.

**Production later:** After finance, legal, privacy, and payments approvals, use
matching live keys and deliberately set STRIPE_ENABLE_LIVE_CHARGES=true. No code
changes are needed. Never enable live charges during Slice 3. Changing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY requires a new client build/deployment.

MIN_DEPOSIT_CENTS configures the minimum. The actual deposit is a hospital-
entered amount fixed in the signed contract; the checkout uses its server
snapshot and does not trust client-side totals. USD only for this slice.

## Demo flow

1. Send and accept a referral.
2. Hospital sends the terms/deposit, then both parties sign.
3. Hospital visits /contracts/[id], selects Continue to deposit, then
   Simulate successful payment under the conspicuous DEMO MODE banner.
4. The demo-only action feeds the same idempotent capacity/reservation
   settlement logic as the verified Stripe webhook.

## Payment consistency

The server persists Payment.isDemo (column named demo) and opaque references.
No name, DOB, MRN, diagnosis, or other PHI is stored in Stripe metadata.
The signed contract fixes the payable amount. Payment is locked before
checking and row-locking the facility via Phase 1's capacity helper. Existing
approved/in-progress placements and paid referral reservations share capacity.
If a bed is unavailable when payment succeeds, no reservation is written,
the referral is flagged, and a Stripe test-mode refund (or demo refund)
is recorded. Pending refunds remain marked refund_pending and retry safely
using Stripe idempotency keys.

The existing Clerk webhook /api/webhooks is unaffected.

## Release gates

Apply the Prisma migration to a development database; perform authenticated
hospital/facility checkout, webhook and refund integration tests, reconcile
Stripe deposits, and verify PHI/HIPAA, PCI, consent, retention, and legal
policies before production. The app's unit tests and build are not a substitute
for running real Stripe test webhooks against a migrated database.