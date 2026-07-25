# Auth Conventions

## Auth Architecture

- Better Auth runs in Convex and is configured in `convex/auth.ts`.
- The Convex Better Auth component stores users, accounts, and sessions.
- TanStack Start proxies `/api/auth/*` through `src/lib/auth/auth-server.ts`.
- The browser auth client lives in `src/lib/auth/auth-client.ts`.
- Use Convex's `Authenticated`, `Unauthenticated`, `AuthLoading`, or
  `useConvexAuth()` for live authentication state.
- Use `authComponent.safeGetAuthUser()` or `authComponent.getAuthUser()` inside
  Convex functions that need the current session-validated user.

## Route Guards

- Protected route layout is `src/routes/_auth/route.tsx`.
  - It enforces auth in `beforeLoad` using the root route's SSR token state.
  - Its component also responds to live Convex auth state changes.
- Guest-only route layout is `src/routes/_guest/route.tsx`.
  - It redirects authenticated users away from the login route.

## Convex Functions

- Route guards protect navigation, not Convex data.
- Every public Convex query or mutation that touches private data must validate
  the current user inside its handler.
- Never accept an owner ID from the client. Derive it from the validated Better
  Auth user.
- Keep deployment secrets in Convex environment variables, not local Vite
  variables or committed files.
