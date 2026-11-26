/**
 * @file jwt-auth.guard.ts — K3 migrasi SSO.
 * [migrasi SSO] JwtAuthGuard lama (AuthGuard jwt + passport) DIMATIKAN — kini warisi SupabaseSsoGuard.
 * Kelas ini kini mewarisi SupabaseSsoGuard agar seluruh @UseGuards(JwtAuthGuard)
 * otomatis memakai SSO prod (admin+SIMRS exact, 403 jelas).
 */
import { Injectable } from "@nestjs/common";
import { SupabaseSsoGuard } from "../../modules/auth/supabase-sso.guard";

@Injectable()
export class JwtAuthGuard extends SupabaseSsoGuard {}
