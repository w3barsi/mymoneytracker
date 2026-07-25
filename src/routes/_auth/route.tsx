import { createFileRoute, Navigate, Outlet, redirect } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";

/**
 * This is the _auth layout, which enables 'protected routes'
 * for all child routes under _auth (e.g. _auth/app/*)
 *
 * The returned context from beforeLoad is also available to all child routes & loaders.
 */
export const Route = createFileRoute("/_auth")({
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <>
      <AuthLoading>{null}</AuthLoading>
      <Authenticated>
        <Outlet />
      </Authenticated>
      <Unauthenticated>
        <Navigate to="/login" />
      </Unauthenticated>
    </>
  );
}
