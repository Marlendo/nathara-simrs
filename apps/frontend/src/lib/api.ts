"use client";


/**
 * @file api.ts
 * @path apps/frontend/src/lib/api.ts
 * @description Klien HTTP Axios: base URL dinamis, interceptor JWT, refresh token.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import axios from "axios";

// [migrasi SSO] authStore penyimpanan-lokal DIHAPUS — withCredentials cookie.

const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1"]);

function resolveApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (typeof window !== "undefined") {
    const pageHost = window.location.hostname;
    let apiHost = "localhost";
    let configuredPort = "";

    if (configured) {
      try {
        const parsed = new URL(configured);
        apiHost = parsed.hostname;
        configuredPort = parsed.port;
      } catch {
        apiHost = "127.0.0.1";
      }
    }

    // Akses via IP/domain LAN sementara build memakai localhost (nginx gateway :80/:443)
    if (!LOCALHOST_HOSTS.has(pageHost) && LOCALHOST_HOSTS.has(apiHost)) {
      if (!configuredPort || configuredPort === "80" || configuredPort === "443") {
        return `${window.location.origin}/v1`;
      }
      const protocol = window.location.protocol === "https:" ? "https" : "http";
      const apiPort = configuredPort || "4000";
      return `${protocol}://${pageHost}:${apiPort}/v1`;
    }
  }

  if (configured) {
    const normalized = configured.replace(/\/+$/, "");
    return normalized.endsWith("/v1") ? normalized : `${normalized}/v1`;
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:4000/v1";
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/v1`;
  }

  return "http://localhost:4000/v1";
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 30_000,
  withCredentials: true
});

// [migrasi SSO H3] JANGAN kirim token dari penyimpanan-lokal; sesi via httpOnly cookie (withCredentials).
api.interceptors.request.use((config) => {
  config.withCredentials = true;
  return config;
});

// [migrasi SSO] refresh token lokal DIMATIKAN — 401 => sesi SSO habis/ditolak, arahkan ke /login SSO.
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err?.response?.status;
    const original = err?.config;
    if (status === 401 && typeof window !== "undefined") {
      if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/auth/callback")) {
        window.location.href = "/login";
        return new Promise(() => {});
      }
    }

    if (status === 503 && typeof window !== "undefined") {
      const requestUrl = String(original?.url ?? "");
      const isSettingsRequest = requestUrl.includes("/system/settings");
      const code = (err?.response?.data as { error?: { code?: string } })?.error?.code;
      if (
        code === "MAINTENANCE_MODE" &&
        !isSettingsRequest &&
        !window.location.pathname.startsWith("/maintenance") &&
        !window.location.pathname.startsWith("/system-admin/settings")
      ) {
        window.location.href = "/maintenance";
        return new Promise(() => {});
      }
    }

    throw err;
  }
);

