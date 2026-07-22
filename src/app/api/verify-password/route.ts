import { NextRequest, NextResponse } from "next/server";

const SITE_PASSWORD = process.env.SITE_PASSWORD || "";

// Misma función hash que en proxy.ts para generar el session token
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

// Rate limiting por IP
const attempts = new Map<string, { count: number; blockUntil: number }>();

function getRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = attempts.get(ip);

  // Limpiar entradas expiradas
  if (attempts.size > 1000) {
    for (const [key, val] of attempts) {
      if (val.blockUntil < now) attempts.delete(key);
    }
  }

  if (record && record.blockUntil > now) {
    return { allowed: false, retryAfter: Math.ceil((record.blockUntil - now) / 1000) };
  }

  if (record) {
    record.count++;
    if (record.count >= 5) {
      const blockSeconds = Math.min(30 * Math.pow(2, record.count - 5), 300);
      record.blockUntil = now + blockSeconds * 1000;
      return { allowed: false, retryAfter: blockSeconds };
    }
  } else {
    attempts.set(ip, { count: 1, blockUntil: 0 });
  }

  return { allowed: true };
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";

    const { allowed, retryAfter } = getRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: `Demasiados intentos. Espera ${retryAfter}s.`, retryAfter },
        { status: 429 }
      );
    }

    if (!SITE_PASSWORD) {
      return NextResponse.json({ error: "Servicio no configurado" }, { status: 500 });
    }

    const { password } = await request.json();

    if (password === SITE_PASSWORD) {
      attempts.delete(ip); // Resetear intentos

      const response = NextResponse.json({ success: true });

      // Usar session token, NO la contraseña directamente
      response.cookies.set("jazzone_auth", SESSION_TOKEN, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 días
      });

      return response;
    }

    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 400 });
  }
}
