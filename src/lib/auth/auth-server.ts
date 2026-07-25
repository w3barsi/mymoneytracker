import "@tanstack/react-start/server-only";
import { convexBetterAuthReactStart } from "@convex-dev/better-auth/react-start";

import { env } from "#/env/client";

export const { handler, getToken, fetchAuthQuery, fetchAuthMutation, fetchAuthAction } =
  convexBetterAuthReactStart({
    convexUrl: env.VITE_CONVEX_URL,
    convexSiteUrl: env.VITE_CONVEX_SITE_URL,
  });
