import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

/**
 * This is the _auth layout, which enables 'protected routes'
 * for all child routes under _auth (e.g. _auth/$noteId)
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
  return <Outlet />;
}
