/**
 * @file auth.module.ts — migrasi SSO (K1): PassportModule/JwtModule DIHAPUS.
 * Pengganti: SupabaseSsoGuard (RS256 via JWKS prod + cache). Tanpa sesi Redis/MFA lokal.
 */
import { Module } from "@nestjs/common";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { UsersModule } from "../users/users.module";
import { PrismaModule } from "../../shared/prisma/prisma.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { SupabaseSsoGuard } from "./supabase-sso.guard";

@Module({
  imports: [UsersModule, AuditLogsModule, PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, SupabaseSsoGuard],
  exports: [AuthService, SupabaseSsoGuard]
})
export class AuthModule {}
