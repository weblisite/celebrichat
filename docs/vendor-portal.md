# Vendor Portal UI

This repository includes a minimal vendor portal flow implemented with Next.js App Router, focused on:
- Vendor application form
- Admin review + approval
- Vendor payment status with Paystack-style button (mocked for local/e2e)
- Event setup instructions and assets after approval + payment

## URLs
- /apply — Vendor application form
- /payments — Vendor payment status and Paystack button to complete outstanding fees
- /event-setup — Event setup instructions and asset downloads (visible after approval + payment)
- /admin/vendors — Admin view to review applications, approve vendors, and monitor payment status (gated)

## Role-based gating
- Admin area is gated for demo/dev using localStorage.
- Visit /admin/vendors?admin=1 or click "Enable Admin" on the admin page to set local admin mode.
- In a production system, this would be replaced by real authentication + authorization.

## Data model (demo)
- The portal uses an in-memory store (src/lib/vendorStore.ts) for e2e/demo.
- Applying creates a vendor record with status=pending.
- Approving a vendor sets status=active and assigns a default fee (e.g., $500). The vendor must pay before accessing Event Setup.
- Payment is mocked by POST /api/vendors/:id/pay and toggles vendor.paid=true.

## Paystack integration
- The UI uses a mocked Paystack button for local/e2e. In production, replace simulatePaystack() with a real Paystack inline integration and verify server-side callbacks.
- Env variables you may use for a real integration:
  - NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx

## Empty and error states
- Admin Applications: shows “No pending applications” if empty.
- Payments/Event Setup: shows guidance if there is no known vendor in the current browser or if approval/payment is still pending.
- All API handlers return JSON errors with HTTP status codes for missing/invalid records.

## Screens (described)
- Apply: A simple form collecting Company Name, Contact Name, and Contact Email. On success, shows links to Payments and Event Setup.
- Admin Vendors: Two panels — Applications (pending) and All Vendors. A Details drawer slides in from the right to review a vendor, approve, and monitor payment updates.
- Payments: Shows pending approval, unpaid fee with a Paystack button, or a success state if paid.
- Event Setup: Displays a checklist and downloadable assets once paid.

## E2E coverage
The Playwright spec e2e/vendor-flow.spec.ts covers the full apply → approve → pay → access instructions path.

## Notes
- The in-memory store resets on server restart. This is intentional for a frictionless demo.
- Static assets for Event Setup are placed under public/assets/.
