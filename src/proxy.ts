import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Contraseña almacenada como variable de entorno en Vercel
const SITE_PASSWORD = process.env.SITE_PASSWORD || "";

export function proxy(request: NextRequest) {
  // Si no hay contraseña configurada, permitir acceso libre
  if (!SITE_PASSWORD) {
    return NextResponse.next();
  }

  // No proteger recursos estáticos ni la página de login
  const url = request.nextUrl.pathname;
  if (
    url === "/login" ||
    url.startsWith("/_next/") ||
    url.startsWith("/api/") ||
    url === "/jazzone.js" ||
    url === "/index.html" ||
    url === "/original.html" ||
    url === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Verificar cookie de autenticación
  const authCookie = request.cookies.get("jazzone_auth")?.value;
  if (authCookie === SITE_PASSWORD) {
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
