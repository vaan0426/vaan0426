# Планирани услуги

BookingService: create/approve/reject/move с DB transaction, slot claim и scope policy.
PackageService: idempotent activation by order item; atomic debit ledger; explicit refund policy.
CheckoutService: server price snapshots, order creation, event capacity, Stripe Checkout.
StripeWebhookService: verify signature, deduplicate event, settle order and entitlements atomically.
RegistrationService: encrypted pending draft, expiring one-use hashed token, email verification.
CmsService: page publishing, revision history, sanitized rich text and validated media.

Това е разпределение на отговорностите; PHP имплементацията предстои.
