/**
 * @file maintenance.guard.ts
 * @path apps/backend/src/modules/system-settings/maintenance.guard.ts
 * @description Guard system-settings: proteksi route berdasarkan kondisi bisnis.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
// [migrasi SSO] JwtService lokal DIHAPUS — peran dari req.user SSO.
import type { Request } from "express";

import type { JwtPayload } from "../auth/types";

import { SystemSettingsService } from "./system-settings.service";

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(
    private readonly settings: SystemSettingsService,
    private readonly config: ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const path = req.path ?? req.url ?? "";
    const method = (req.method ?? "GET").toUpperCase();

    if (this.isExemptPath(path, method)) {
      return true;
    }

    const status = await this.settings.getMaintenanceStatus();
    if (!status.active) {
      return true;
    }

    const roles = await this.resolveRoles(req);
    if (this.settings.evaluateApiAccess(status, roles, path)) {
      return true;
    }

    throw new ServiceUnavailableException({
      message: status.message,
      code: "MAINTENANCE_MODE",
      scope: status.scope,
      endsAt: status.endsAt
    });
  }

  private isExemptPath(path: string, method: string): boolean {
    const exempt = [
      "/health",
      "/metrics",
      "/system/settings",
      "/auth/sso/login",
      "/auth/sso/logout",
      "/captcha"
    ];

    if (exempt.some((segment) => path.includes(segment))) {
      return true;
    }

    if (method === "GET" && path.includes("/docs")) {
      return true;
    }

    return false;
  }

  private async resolveRoles(req: Request & { user?: JwtPayload }): Promise<string[]> {
    if (req.user?.roles?.length) {
      return req.user.roles;
    }

    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return [];
    }

    // [migrasi SSO] JANGAN verifikasi JWT lokal; peran hanya dari req.user SSO (guard).
    return [];
  }
}
