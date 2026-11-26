"use client";
/**
 * @file role-store.ts — DIMATIKAN (H3/K13 migrasi SSO).
 * Cookie peran client (simrs_roles) TIDAK dipercaya — diganti cek klaim server-side.
 * Stub no-op agar import lama tidak merusak build.
 */
export const roleStore = {
  setRoles(..._args: unknown[]): void {},
  getRoles(): string[] { return []; },
  clear(): void {},
};
