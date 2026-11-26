/**
 * @file auth.service.ts — SATU pintu SSO (K7-K10 migrasi).
 * [migrasi SSO] Login password/bcrypt, refresh/blacklist lokal, register-patient, MFA lokal DIMATIKAN.
 * Alur: terima Supabase access_token → SupabaseSsoGuard sudah validasi → upsert users by supabase_sub
 * → kembalikan profil read-only. Refresh/revoke = ke IdP prod (login ulang).
 */
import { ForbiddenException, Injectable } from "@nestjs/common";
import { AuditAction, AuditModule, AuditStatus } from "@prisma/client";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import type { SsoUser } from "./supabase-sso.guard";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService
  ) {}

  /** Upsert mapping lokal dari klaim SSO terverifikasi guard. */
  async ssoLogin(sso: SsoUser) {
    if (sso.role !== "admin" || sso.scope !== "SIMRS") {
      await this.auditLogs.create({
        action: AuditAction.LOGIN_FAILED, module: AuditModule.AUTH, entity: "User",
        status: AuditStatus.FAILED, description: `SSO login ditolak: ${sso.sub}`,
        metadata: { sub: sso.sub, role: sso.role, scope: sso.scope }
      }).catch(() => undefined);
      throw new ForbiddenException("Akses ditolak — hubungi admin");
    }
    const email = (sso.email || "").trim().toLowerCase();
    const name = (sso.name || "").trim() || (email ? (email.split("@")[0] ?? "SSO User") : "SSO User");
    let user = await this.prisma.user.findUnique({ where: { supabaseSub: sso.sub } }).catch(() => null) as unknown as { id: string } | null;
    try {
      if (user) {
        user = await this.prisma.user.update({
          where: { id: (user as { id: string }).id },
          data: { ...(email ? { email } : {}), name, lastLoginAt: new Date() }
        });
      } else if (email) {
        const byEmail = await this.prisma.user.findUnique({ where: { email } }).catch(() => null);
        if (byEmail) {
          user = await this.prisma.user.update({ where: { id: (byEmail as { id: string }).id }, data: { supabaseSub: sso.sub, name, lastLoginAt: new Date() } });
        } else {
          user = await this.prisma.user.create({ data: { email, name, supabaseSub: sso.sub, status: "ACTIVE", lastLoginAt: new Date() } });
        }
      } else {
        user = await this.prisma.user.create({ data: { email: `${sso.sub}@sso.local`, name, supabaseSub: sso.sub, status: "ACTIVE", lastLoginAt: new Date() } });
      }
    } catch {
      // Fallback bila kolom supabaseSub belum termigrate: baca by email saja
      if (email) {
        const fallback = await this.prisma.user.findUnique({ where: { email } }).catch(() => null);
        if (fallback) user = fallback as unknown as { id: string };
      }
      if (!user) throw new ForbiddenException("Provisioning SSO gagal — hubungi admin");
    }
    await this.auditLogs.create({
      action: AuditAction.LOGIN, module: AuditModule.AUTH, entity: "User",
      status: AuditStatus.SUCCESS, description: `SSO login: ${email || sso.sub}`,
      metadata: { sub: sso.sub, role: sso.role, scope: sso.scope }
    }).catch(() => undefined);
    return { user: { id: (user as { id: string }).id, email, name, supabaseSub: sso.sub }, message: "Login SSO berhasil" };
  }

  /** Profil read-only dari mapping + klaim SSO (K10). Update via IdP/admin. */
  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, status: true, hospitalId: true, departmentId: true, lastLoginAt: true }
    }).catch(() => null);
    if (!user) throw new ForbiddenException("Profil tidak ditemukan — hubungi admin");
    return { ...user, readOnly: true, updateVia: "IdP SSO / admin" };
  }
}
