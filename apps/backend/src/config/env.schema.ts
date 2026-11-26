/**
 * @file env.schema.ts — migrasi SSO+R2 (K12): JWT_* + MINIO_* + SEED_* DIHAPUS dari schema.
 * Baru: SUPABASE_JWKS_URL/ISSUER/AUDIENCE, SSO_*, R2_*, DATABASE_URL sentral.
 */
import { z } from "zod";

const csvToArray = z.string().transform((value: string) =>
  value.split(",").map((v: string) => v.trim()).filter(Boolean));

// String kosong (mis. REDIS_URL: ${REDIS_URL:-} di compose saat unset) = tidak diset.
const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value), schema);

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  SWAGGER_PATH: z.string().trim().min(1).default("docs"),
  CORS_ORIGIN: z.union([z.literal("*"), csvToArray]).default("*"),
  APP_URL: z.string().trim().default("https://simrs.nathara.ac.id"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: emptyToUndefined(z.string().min(1).optional()),
  // SSO Supabase PROD (env-driven + fail-closed; JANGAN hardcode nilai prod)
  // TODO VERIFIKASI_PM_PROD: iss/aud/JWKS URL eksak dari PM Production.
  SUPABASE_URL: z.string().trim().default("https://api.nathara.ac.id"),
  SUPABASE_JWKS_URL: z.string().trim().min(1),
  SUPABASE_ISSUER: z.string().trim().min(1),
  SUPABASE_AUDIENCE: z.string().trim().optional(),
  SSO_JWKS_TTL_MS: z.coerce.number().int().positive().default(600000),
  SSO_CLOCK_SKEW_S: z.coerce.number().int().nonnegative().default(60),
  // Storage R2 PROD (bucket nathara-simrs; TANPA nilai asli di code/log)
  R2_ENDPOINT: z.string().trim().min(1),
  R2_ACCESS_KEY_ID: z.string().trim().min(1),
  R2_SECRET_ACCESS_KEY: z.string().trim().min(1),
  R2_BUCKET: z.string().trim().default("nathara-simrs"),
  R2_PUBLIC_URL: z.string().trim().optional(),
  ENCRYPTION_KEY: z.string().optional(),
  ENCRYPTION_SEARCH_KEY: z.string().optional(),
  BACKUP_ENCRYPTION_KEY: z.string().optional(),
  MAX_CONCURRENT_SESSIONS: z.coerce.number().int().positive().default(3),
  PROMETHEUS_METRICS_ENABLED: z.union([z.boolean(), z.string()]).transform((v) => String(v).toLowerCase() === "true").default(true),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug", "verbose"]).default("info")
});
export type AppEnv = z.infer<typeof envSchema>;
export function validateEnv(config: Record<string, unknown>) {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const formatted = parsed.error.issues.map((issue: { path: (string | number)[]; message: string }) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid environment configuration: ${formatted}`);
  }
  return parsed.data;
}
