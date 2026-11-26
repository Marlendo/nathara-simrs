/**
 * @file auth.controller.ts — SATU pintu SSO (K7-K10 migrasi).
 * Route lokal DIMATIKAN: /login, /login/staff, /login/patient, /refresh, /logout blacklist,
 * /register-patient, /enable-mfa, /verify-mfa, /sessions*, /users/:id/force-logout lokal.
 * Aktif: POST /v1/auth/sso/login (Bearer Supabase access_token → upsert + set httpOnly cookie),
 * GET /v1/auth/me (profil read-only), POST /v1/auth/sso/logout (hapus cookie sesi app).
 */
import { Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";

import { CurrentUser } from "../../common/auth/current-user.decorator";

import { AuthService } from "./auth.service";
import { SupabaseSsoGuard, type SsoUser } from "./supabase-sso.guard";

function ssoCookieFlags(): string {
  const secure = (process.env.APP_URL ?? "").startsWith("https://") || process.env.NODE_ENV === "production";
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${12 * 60 * 60}${secure ? "; Secure" : ""}`;
}

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("sso/login")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(SupabaseSsoGuard)
  @ApiBearerAuth()
  async ssoLogin(@Req() req: Request & { user: SsoUser }, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.ssoLogin(req.user);
    res.setHeader("Set-Cookie", `simrs_sso=${encodeURIComponent(result.user.id)}; ${ssoCookieFlags()}`);
    return result;
  }

  @Get("me")
  @UseGuards(SupabaseSsoGuard)
  @ApiBearerAuth()
  me(@CurrentUser("sub") _sub: string, @Req() req: Request & { user: SsoUser }) {
    return this.auth.me((req.user as unknown as { localUserId?: string }).localUserId ?? req.user.sub);
  }

  @Post("sso/logout")
  async ssoLogout(@Res({ passthrough: true }) res: Response) {
    const secure = (process.env.APP_URL ?? "").startsWith("https://") || process.env.NODE_ENV === "production";
    res.setHeader("Set-Cookie", `simrs_sso=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`);
    return { message: "Logout sesi app berhasil — selesaikan logout di IdP bila perlu" };
  }
}
