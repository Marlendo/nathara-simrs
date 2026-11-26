"use client";
/**
 * @file auth-store.ts — DIMATIKAN (H3/K13 migrasi SSO).
 * Token penyimpanan-lokal DIHAPUS. Sesi via httpOnly cookie SameSite=Lax Secure (JANGAN penyimpanan-lokal).
 * API client WAJIB withCredentials. Stub no-op agar import lama tidak merusak build.
 */
export const authStore = {
  getAccessToken(): null { return null; },
  getRefreshToken(): null { return null; },
  setTokens(..._args: unknown[]): void {},
  setAccessToken(..._args: unknown[]): void {},
  isAuthenticated(): boolean {
    if (typeof document === "undefined") return false;
    return document.cookie.split(";").some((c) => c.trim().startsWith("simrs_sso="));
  },
  clear(): void {},
};
