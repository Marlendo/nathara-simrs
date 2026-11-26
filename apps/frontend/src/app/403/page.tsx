export default function ForbiddenPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-semibold">403 — Akses ditolak</h1>
      <p className="max-w-md text-sm text-muted-foreground">Akun Anda tidak memiliki akses Nathara SIMRS (bukan admin + SIMRS). Hubungi admin.</p>
    </div>
  );
}
