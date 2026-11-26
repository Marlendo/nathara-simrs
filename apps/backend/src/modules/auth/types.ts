/**
 * @file types.ts — migrasi SSO (K1-K14).
 * JwtPayload lokal (roles/permissions/jti) dipertahankan untuk otorisasi lapis-2,
 * diisi dari mapping SSO (req.user). JANGAN jadikan penentu identitas login.
 */
export type JwtPayload = {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  hospitalId?: string | null;
  departmentId?: string | null;
  jti?: string;
  supabaseSub?: string;
  ssoRole?: string;
  ssoScope?: string;
};

export type SsoLoginResult = {
  user: { id: string; email: string; name: string; supabaseSub: string };
  message: string;
};
