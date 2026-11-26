/**
 * @file middleware.ts — ditulis ulang SSO (K13/H3).
 * Publik hanya: /, /login, /auth/callback, /403, /maintenance.
 * Selain itu butuh cookie sesi SSO (simrs_sso); role-routing lama (simrs_roles) DIHAPUS,
 * diganti cek klaim server-side. Portal pasien/signup NON-AKTIF -> redirect /login.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/auth/callback", "/403", "/maintenance"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function hasSsoSession(request: NextRequest): boolean {
  return Boolean(request.cookies.get("simrs_sso")?.value);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const disabled = ["/signup", "/patient-login", "/portal", "/patient"];
  if (disabled.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isPublic(pathname)) return NextResponse.next();
  if (!hasSsoSession(request)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
