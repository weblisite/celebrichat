# Auth + RBAC

This project integrates a simple Neon-backed auth flow with cookie-based sessions, email verification, and role-based access control (RBAC) enforced on both server and client.

Terminology note: The database uses `customer` as the default user role. In the application and docs we refer to this role as `fan`. The mapping is:
- DB `customer` <-> App `fan`

## Roles

- fan (DB: customer) — default on sign up; can browse public content
- celebrity — can access `/celebrity/*` area
- vendor — can access `/vendor/*` area
- admin — superuser; can access everything and elevate other users' roles

## Role matrix

Route/policy vs role:

- Public pages: anyone
- /celebrity/*: celebrity, admin
- /vendor/*: vendor, admin
- /admin/*: admin only

Additionally, protected routes require the user's email to be verified. If the user is not verified, they will be redirected to `/verify-email`.

## Server-side enforcement

- Middleware: `src/middleware.ts` guards `/admin/*`, `/celebrity/*`, and `/vendor/*` using helpers in `src/lib/auth.ts`.
- Helpers: `src/lib/auth.ts` exposes:
  - `getSessionFromRequest(req)` to read the session from the `session` cookie
  - `hasRole(session, role | role[])`
  - `requireRole(session, ...)` and `requireVerified(session, ...)` assertions
  - `guardRoute(pathname, session)` used by middleware

## Client-side enforcement

- Hook: `src/hooks/useSession.ts` fetches `/api/auth/session` and returns `{ data, status }`.
- Components: `src/components/RoleGate.tsx`
  - `<RoleGate allow={["vendor", "admin"]}>...</RoleGate>` renders `children` only when the user has one of the allowed roles and is email-verified (admins always pass).
  - `<RequireVerified>...</RequireVerified>` ensures the user is verified.

## Auth routes

NextAuth-style API routes live under `src/app/api/auth/*`:
- `POST /api/auth/signup` — creates/ensures a user (default role: fan/customer) and sets a session with `emailVerified=false`. Sends a verification email in a real implementation.
- `POST /api/auth/login` — logs in an existing user and sets a session with `emailVerified=false`.
- `POST /api/auth/verify` — marks current session as `emailVerified=true`.
- `GET /api/auth/session` — returns the current session JSON.

Admin role management:
- `POST /api/admin/role` — admin-only endpoint to update a user's role; expects JSON `{ userId, role }` where `role` is one of `fan | celebrity | vendor | admin`.

## Email verification UX

- After sign up or login, if the user's email is not verified, attempts to access protected areas will redirect to `/verify-email`.
- The `/verify-email` page provides a simple button to confirm after the user completes verification. In production, this would be triggered by a magic-link flow.

## Tests

- Unit tests for guards and utilities are in `src/lib/__tests__/auth.test.ts`.
- Client-side RoleGate behavior is tested in `src/components/__tests__/RoleGate.test.tsx` using React Testing Library.

## Notes

- This implementation focuses on the RBAC and verification flow surfaces. Replace the cookie/session utilities with a production-grade auth provider or SDK as needed (e.g., JWT cookies, database-backed sessions, or a hosted auth service). The database role column remains the source of truth for user roles; the `session.role` reflects that state.
