/**
 * @file session.service.ts — DIMATIKAN (K6 migrasi SSO).
 * Sesi Redis lokal (refresh:/blacklist:) dihapus. Sesi app = stateless per-request via JWT prod
 * (+ cache JWKS saja, BUKAN cache decision). Redis sentral BOLEH untuk rate-limit/cache non-auth.
 * Stub fail-closed agar pemakaian auth lama gagal eksplisit.
 */
import { Injectable, GoneException } from "@nestjs/common";
@Injectable()
export class SessionService {
  private gone(): never { throw new GoneException("Sesi Redis lokal dimatikan — gunakan sesi SSO"); }
  generateRefreshToken(): never { return this.gone(); }
  generateJti(): never { return this.gone(); }
  async createSession(): Promise<never> { return this.gone(); }
  async validateRefreshToken(): Promise<never> { return this.gone(); }
  async revokeSession(): Promise<never> { return this.gone(); }
  async isJtiBlacklisted(): Promise<never> { return this.gone(); }
}
