/**
 * @file postgres-cli.util.ts
 * @path apps/backend/src/modules/backup/postgres-cli.util.ts
 * @description Util backup via TCP sentral (H1): execFileSync array-args TANPA shell, TANPA cabang docker, password via env.
 * Deploy sentral: cluster staging-postgres-18 via DATABASE_URL. Container lokal DILARANG.
 */
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";

export type PgConnection = {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
};

const MAX_BUFFER = 512 * 1024 * 1024;
const SAFE_NAME_RE = /^[A-Za-z0-9_.-]+$/;

function assertSafeLabel(value: string, name: string): void {
  if (!SAFE_NAME_RE.test(value)) throw new Error(`${name} tidak valid (allowlist ^[A-Za-z0-9_.-]+$)`);
}

export function parseDatabaseUrl(databaseUrl: string): PgConnection {
  const url = new URL(databaseUrl);
  const database = url.pathname.replace(/^\//, "");
  if (!database) throw new Error("DATABASE_URL tidak memuat nama database");
  return {
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    host: url.hostname,
    port: url.port ? Number(url.port) : 5432,
    database
  };
}

export function pgDumpConnectionUrl(databaseUrl: string): string {
  const conn = parseDatabaseUrl(databaseUrl);
  return `postgresql://${encodeURIComponent(conn.user)}:${encodeURIComponent(conn.password)}@${conn.host}:${conn.port}/${conn.database}`;
}

export function isCommandAvailable(command: string): boolean {
  assertSafeLabel(command, "command");
  try {
    execFileSync("command", ["-v", command], { stdio: "ignore" });
    return true;
  } catch { return false; }
}

/** DEPRECATED (H1): asumsi container lokal DILARANG di deploy sentral — selalu false + audit. */
export function isDockerContainerRunning(_containerName: string): boolean {
  return false;
}

export function runPgDumpToFile(databaseUrl: string, outputPath: string, _containerName?: string): "local" {
  const conn = parseDatabaseUrl(databaseUrl);
  if (!isCommandAvailable("pg_dump")) {
    throw new Error("pg_dump tidak tersedia (deploy sentral: gunakan tooling backup sentral)");
  }
  const cleanUrl = pgDumpConnectionUrl(databaseUrl);
  const output = execFileSync("pg_dump", [cleanUrl, "--no-owner", "--no-acl"], {
    encoding: "buffer",
    maxBuffer: MAX_BUFFER,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PGPASSWORD: conn.password }
  } as never);
  fs.writeFileSync(outputPath, output as unknown as Uint8Array);
  return "local";
}

export function runPsqlRestoreFromFile(databaseUrl: string, inputPath: string, _containerName?: string): "local" {
  const conn = parseDatabaseUrl(databaseUrl);
  const sql = fs.readFileSync(inputPath);
  if (!isCommandAvailable("psql")) {
    throw new Error("psql tidak tersedia (deploy sentral: gunakan tooling backup sentral)");
  }
  const cleanUrl = pgDumpConnectionUrl(databaseUrl);
  execFileSync("psql", [cleanUrl], {
    input: sql,
    stdio: ["pipe", "pipe", "pipe"],
    maxBuffer: MAX_BUFFER,
    env: { ...process.env, PGPASSWORD: conn.password }
  } as never);
  return "local";
}

export function isJsonBackupFile(filePath: string): boolean {
  const sample = fs.readFileSync(filePath, { encoding: "utf-8", flag: "r" }).trimStart();
  return sample.startsWith("{");
}

/** DEPRECATED: shellQuote tidak lagi dipakai (execFileSync array-args TANPA shell). Dipertahankan agar import lama tidak rusak. */
export function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
