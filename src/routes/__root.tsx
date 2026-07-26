import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import { a11yDevtoolsPlugin } from "@tanstack/devtools-a11y/react";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { createServerFn } from "@tanstack/react-start";

import { ThemeProvider } from "#/components/theme-provider";
import { Toaster } from "#/components/ui/sonner";
import { authClient } from "#/lib/auth/auth-client";
import { getToken } from "#/lib/auth/auth-server";

import appCss from "#/styles.css?url";

interface MyRouterContext {
  queryClient: QueryClient;
  convexQueryClient: ConvexQueryClient;
}

const $getAuthToken = createServerFn({ method: "GET" }).handler(async () => {
  const token = await getToken();
  return token ?? null;
});
const authTokenQueryOptions = queryOptions({
  queryKey: ["auth", "token"],
  queryFn: () => $getAuthToken(),
  gcTime: Infinity,
  staleTime: Infinity,
});

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async ({ context }) => {
    const token = await context.queryClient.ensureQueryData(authTokenQueryOptions);

    if (token) {
      context.convexQueryClient.serverHttpClient?.setAuth(token);
    }

    return {
      isAuthenticated: Boolean(token),
      token,
    };
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "MoneyTracker",
      },
      {
        name: "description",
        content: "A simple note-based money tracker with automatic totals.",
      },
      {
        name: "theme-color",
        content: "#18181b",
      },
      {
        name: "mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "apple-mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent",
      },
      {
        name: "apple-mobile-web-app-title",
        content: "MoneyTracker",
      },
    ],
    links: [
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
      {
        rel: "icon",
        type: "image/x-icon",
        href: "/favicon.ico",
      },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "manifest",
        href: "/manifest.webmanifest",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
});

function RootComponent() {
  const { convexQueryClient, token } = Route.useRouteContext();

  return (
    <ConvexBetterAuthProvider
      client={convexQueryClient.convexClient}
      authClient={authClient}
      initialToken={token}
    >
      <Outlet />
    </ConvexBetterAuthProvider>
  );
}

function RootDocument({ children }: { readonly children: React.ReactNode }) {
  return (
    // suppress since we're updating the "dark" class in ThemeProvider
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <Toaster richColors />
        </ThemeProvider>

        <TanStackDevtools
          plugins={[
            {
              name: "TanStack Query",
              render: <ReactQueryDevtoolsPanel />,
            },
            {
              name: "TanStack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
            a11yDevtoolsPlugin(),
          ]}
        />

        <Scripts />
      </body>
    </html>
  );
}
