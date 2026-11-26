/**
 * @file jwt.strategy.ts — DIMATIKAN (K2 migrasi SSO).
 * [migrasi SSO] PassportStrategy dan secret JWT lokal DIHAPUS. Jangan dipakai.
 * Pengganti: SupabaseSsoGuard (verify RS256 via JWKS prod + cache).
 * File dipertahankan sebagai stub agar import lama gagal eksplisit saat compile.
 */
export class JwtStrategy {
  constructor() {
    throw new Error("[migrasi SSO] JwtStrategy DIMATIKAN — pakai SupabaseSsoGuard");
  }
}
