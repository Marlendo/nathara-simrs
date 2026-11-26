/**
 * @file page.tsx — /auth/callback SSO (BFF code-exchange direkomendasikan agar refresh token tidak ke browser).
 * TODO VERIFIKASI_PM_PROD: URL callback allowlist di Supabase prod.
 */
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function SsoCallbackPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("Memverifikasi sesi SSO…");
  useEffect(() => {
    (async () => {
      try {
        const hash = window.location.hash;
        const m = hash.match(/access_token=([^&]+)/);
        const token = m?.[1];
        if (!token) { setMsg("Tidak ada token SSO — kembali ke /login"); router.replace("/login"); return; }
        await api.post("/auth/sso/login", {}, { headers: { Authorization: `Bearer ${decodeURIComponent(token)}` } });
        const next = new URLSearchParams(window.location.search).get("next") || "/dashboard";
        router.replace(next);
      } catch {
        setMsg("SSO ditolak (403) — hubungi admin");
        router.replace("/403");
      }
    })();
  }, [router]);
  return <div className="flex min-h-svh items-center justify-center p-6"><p className="text-sm">{msg}</p></div>;
}
