import { convexQuery } from "@convex-dev/react-query";
import { queryOptions } from "@tanstack/react-query";
import type { FunctionReturnType } from "convex/server";

import { api } from "../../../convex/_generated/api";

/**
 * This query is mainly used in _auth/route.tsx, which is the _auth layout
 * that protects all child routes under it (e.g. _auth/$noteId)
 */
export const authQueryOptions = () =>
  queryOptions({
    ...convexQuery(api.auth.getCurrentUser, {}),
  });

export type AuthQueryResult = FunctionReturnType<typeof api.auth.getCurrentUser>;
