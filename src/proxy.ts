import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SITE_PASSWORD = process.env.SITE_PASSWORD || "";

// Generar un session token aleatorio cuando se valida la contraseña
// Esto evita almacenar la contraseña directamente en la cookie
function hashPassword(pwd: string): string {
  let hash = 0;
  for (let i = 0; i < pwd.length; i++) {
    const char = pwd.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return "s_" + Math.abs(hash).toString(36);
}

const SESSION_TOKEN = SITE_PASSWORD ? hashPassword(SITE_PASSWORD) : "";

export function proxy(request: NextRequest) {
  // Si no hay contraseña configurada, acceso libre
  if (!SITE_PASSWORD) {
    return NextResponse.next();
  }

  const url = request.nextUrl.pathname;

  // Recursos que no necesitan autenticación
  const publicPaths = [
    "/login",
    "/_next/",
    "/api/verify-password",
    "/jazzone.js",
    "/index.html",
    "/original.html",
    "/favicon.ico",
  ];

  if (publicPaths.some(p => url === p || url.startsWith(p + "/") || (p.endsWith("/") && url.startsWith(p)))) {
    return NextResponse.next();
  }

  // Verificar cookie de autenticación
  const authCookie = request.cookies.get("jazzone_auth")?.value;

  // Comparar contra el session token (no la contraseña directa)
  if (authCookie === SESSION_TOKEN) {
    return NextResponse.next();
  }

  // No autenticado → redirigir al login
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
