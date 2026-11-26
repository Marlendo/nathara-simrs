/**
 * @file page.tsx — SATU pintu SSO (K13): "Masuk dengan SSO" (PKCE via Supabase prod).
 * Login password lokal DIMATIKAN. Portal pasien/signup NON-AKTIF -> /login.
 * TODO VERIFIKASI_PM_PROD: callback allowlist + iss/aud dari PM Production.
 */
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted px-6 py-8">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-1">
            <p className="text-xl font-semibold">Nathara SIMRS</p>
            <p className="text-sm text-muted-foreground">Masuk via SSO Supabase Production (satu-satunya jalan masuk).</p>
          </div>
          <Button asChild className="w-full">
            <Link href="/auth/callback">Masuk dengan SSO</Link>
          </Button>
          <p className="text-xs text-muted-foreground">Akun harus memiliki role admin + scope SIMRS (exact-match). Selain itu 403 — hubungi admin.</p>
        </CardContent>
      </Card>
    </div>
  );
}
