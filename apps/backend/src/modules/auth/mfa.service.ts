/**
 * @file mfa.service.ts — DIMATIKAN (K5 migrasi SSO). MFA TOTP lokal dihapus; MFA ikut IdP prod.
 * Stub fail-closed agar pemakaian lama gagal eksplisit.
 */
import { Injectable, GoneException } from "@nestjs/common";
@Injectable()
export class MfaService {
  private gone(): never { throw new GoneException("MFA lokal dimatikan — gunakan SSO IdP prod"); }
  generateSecret(): never { return this.gone(); }
  generateOtpAuthUrl(): never { return this.gone(); }
  verifyToken(): never { return this.gone(); }
}
