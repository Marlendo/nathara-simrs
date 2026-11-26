/**
 * @file auth-session.ts — DIMATIKAN (H3/K13 migrasi SSO).
 * Sesi via httpOnly cookie; establish/clear hanya invalidate cache.
 */
import type { QueryClient } from "@tanstack/react-query";
import { authStore } from "@/lib/auth-store";
import { roleStore } from "@/lib/role-store";
export function clearAuthSession(queryClient?: QueryClient) {
  authStore.clear();
  roleStore.clear();
  queryClient?.removeQueries({ queryKey: ["auth-me"] });
  queryClient?.removeQueries({ queryKey: ["my-profile"] });
  if (typeof document !== "undefined") document.cookie = "simrs_sso=; path=/; max-age=0";
}
export function establishAuthSession(_accessToken?: string, _refreshToken?: string, _roles: string[] = [], queryClient?: QueryClient) {
  queryClient?.removeQueries({ queryKey: ["auth-me"] });
  queryClient?.removeQueries({ queryKey: ["my-profile"] });
}
