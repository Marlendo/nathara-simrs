/**
 * @file system-settings.module.ts — migrasi SSO: JwtModule lokal DIHAPUS.
 */
import { Global, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { MaintenanceGuard } from "./maintenance.guard";
import { SystemSettingsController } from "./system-settings.controller";
import { SystemSettingsService } from "./system-settings.service";

@Global()
@Module({
  imports: [AuditLogsModule],
  controllers: [SystemSettingsController],
  providers: [SystemSettingsService, MaintenanceGuard, { provide: APP_GUARD, useClass: MaintenanceGuard }],
  exports: [SystemSettingsService]
})
export class SystemSettingsModule {}
