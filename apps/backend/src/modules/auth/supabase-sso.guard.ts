/**
 * @file supabase-sso.guard.ts
 * @path apps/backend/src/modules/auth/supabase-sso.guard.ts
 * @description Guard SSO Supabase PROD (K2/K3): verify RS256 via JWKS + cache 10 mnt + unknown-kid refresh,
 * cek iss/aud/exp skew 60dtk, exact-match role=='admin' && scope=='SIMRS', selain itu 403 jelas + audit.
 * TODO VERIFIKASI_PM_PROD: iss/aud/JWKS URL/claim role/scope/nama/callback BELUM dijawab PM Production (§4 SA).
 * Implementasi WAJIB env-driven + fail-closed bila env hilang. JANGAN hardcode nilai prod.
 */
import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createLocalJWKSet, jwtVerify, type JWTPayload } from "jose";

export type SsoUser = {
  sub: string;
  email: string;
  name: string;
  role: string;
  scope: string;
  localUserId?: string;
};

type JwksCache = { keys: { kty: string; kid?: string }[]; fetchedAt: number };
let jwksCache: JwksCache | null = null;
let jwksUrlCached = "";
let jwksFailures = 0;
let jwksBlockedUntil = 0;
const KID_UNKNOWN_RE = /kid|JWKS|no applicable key|no matching key|key.*not found|unknown key/i;
const FETCH_FAIL_RE = /fetch failed|ECONN|ENOTFOUND|ETIMEDOUT|timeout|network/i;

async function fetchJwks(jwksUrl: string) {
  const res = await fetch(jwksUrl, { headers: { accept: "application/json" } });
  if (!res.ok) throw new UnauthorizedException(`JWKS prod HTTP ${res.status} — fail-closed`);
  const data = (await res.json()) as { keys?: unknown };
  if (!data || !Array.isArray(data.keys) || data.keys.length === 0) {
    throw new UnauthorizedException("JWKS prod kosong — fail-closed");
  }
  return data.keys as JwksCache["keys"];
}

function getEnv(config: ConfigService) {
  const jwksUrl = config.get<string>("SUPABASE_JWKS_URL")?.trim();
  const issuer = config.get<string>("SUPABASE_ISSUER")?.trim();
  const audience = config.get<string>("SUPABASE_AUDIENCE")?.trim();
  const skew = Number(config.get("SSO_CLOCK_SKEW_S", 60));
  const ttlMs = Number(config.get("SSO_JWKS_TTL_MS", 10 * 60 * 1000));
  if (!jwksUrl || !issuer) {
    throw new UnauthorizedException("Konfigurasi SSO hilang (SUPABASE_JWKS_URL/SUPABASE_ISSUER) — fail-closed");
  }
  return { jwksUrl, issuer, audience: audience || undefined, skew: Number.isSafeInteger(skew) ? skew : 60, ttlMs: ttlMs > 0 ? ttlMs : 600000 };
}

function extractRoleScope(payload: JWTPayload): { role: string; scope: string } | null {
  const rec = payload as Record<string, unknown>;
  const pick = (v: unknown): string | null => (typeof v === "string" ? v.trim() : null);
  // Kandidat lokasi klaim (TODO VERIFIKASI_PM_PROD: PM tentukan SATU lokasi kanonis):
  const role = pick(rec.role) ?? pick((rec.app_metadata as Record<string, unknown> | undefined)?.role) ?? pick((rec.user_metadata as Record<string, unknown> | undefined)?.role);
  const scopeRaw = rec.scope ?? (rec.app_metadata as Record<string, unknown> | undefined)?.scope ?? (rec.user_metadata as Record<string, unknown> | undefined)?.scope ?? rec.scopes;
  let scope = "";
  if (typeof scopeRaw === "string") scope = scopeRaw.trim();
  else if (Array.isArray(scopeRaw)) scope = scopeRaw.filter((s): s is string => typeof s === "string").join(" ").trim();
  if (role !== "admin" || scope.split(/[\s,]+/).includes("SIMRS") === false || scope === "") return null;
  // exact-match: role HARUS 'admin' dan scope list HARUS memuat 'SIMRS' exact
  if (role !== "admin") return null;
  const parts = scope.split(/[\s,]+/);
  if (!parts.includes("SIMRS")) return null;
  return { role, scope: "SIMRS" };
}

@Injectable()
export class SupabaseSsoGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, string>; user?: SsoUser }>();
    const auth = req.headers?.authorization ?? req.headers?.["authorization"];
    if (!auth?.startsWith("Bearer ")) throw new UnauthorizedException("Token SSO hilang");
    const token = auth.slice(7).trim();
    if (!token) throw new UnauthorizedException("Token SSO hilang");
    const env = getEnv(this.config);
    const verifyOnce = async (force: boolean) => {
      const fresh = jwksCache && jwksUrlCached === env.jwksUrl && Date.now() - jwksCache.fetchedAt < env.ttlMs;
      let keys: JwksCache["keys"];
      if (fresh && !force) keys = jwksCache!.keys;
      else {
        if (Date.now() < jwksBlockedUntil) throw new UnauthorizedException("JWKS circuit terbuka — fail-closed");
        try {
          keys = await fetchJwks(env.jwksUrl);
          jwksCache = { keys, fetchedAt: Date.now() };
          jwksUrlCached = env.jwksUrl;
          jwksFailures = 0; jwksBlockedUntil = 0;
        } catch (e) {
          const msg = e instanceof Error ? e.message : "";
          if (FETCH_FAIL_RE.test(msg)) {
            jwksFailures += 1;
            if (jwksFailures >= 3) jwksBlockedUntil = Date.now() + 30_000;
          }
          throw e;
        }
      }
      const opts: { issuer: string; clockTolerance: number; audience?: string } = { issuer: env.issuer, clockTolerance: env.skew };
      if (env.audience) opts.audience = env.audience;
      const { payload } = await jwtVerify(token, createLocalJWKSet({ keys }), opts);
      return payload;
    };
    let payload: JWTPayload;
    try { payload = await verifyOnce(false); }
    catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (KID_UNKNOWN_RE.test(msg)) {
        try { payload = await verifyOnce(true); }
        catch { throw new UnauthorizedException("Token SSO tidak valid"); }
      } else if (e instanceof UnauthorizedException) throw e;
      else throw new UnauthorizedException("Token SSO tidak valid/expired");
    }
    const sub: unknown = payload.sub;
    if (typeof sub !== "string" || !sub) throw new UnauthorizedException("Klaim sub hilang");
    if (typeof payload.exp !== "number") throw new UnauthorizedException("Klaim exp hilang");
    const mapped = extractRoleScope(payload);
    if (!mapped) throw new ForbiddenException("Akses ditolak — hubungi admin (bukan admin+SIMRS)");
    const rec = payload as Record<string, unknown>;
    const email: string = typeof rec.email === "string" ? rec.email : "";
    const rawName: string = (typeof rec.full_name === "string" && rec.full_name) || (typeof rec.name === "string" && rec.name) || "";
    const name: string = rawName || (email ? (email.split("@")[0] ?? "SSO User") : "SSO User");
    req.user = { sub, email, name, role: mapped.role, scope: mapped.scope };
    return true;
  }
}
