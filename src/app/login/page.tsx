"use client";

import { Suspense, useState, FormEvent, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [blockTimer, setBlockTimer] = useState(0);
  const searchParams = useSearchParams();

  // Comprobar si hay bloqueo activo
  useEffect(() => {
    const blockedUntil = localStorage.getItem("login_blocked_until");
    if (blockedUntil) {
      const remaining = parseInt(blockedUntil) - Date.now();
      if (remaining > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setBlocked(true);
        setBlockTimer(Math.ceil(remaining / 1000));
        const interval = setInterval(() => {
          const rem = parseInt(blockedUntil) - Date.now();
          if (rem <= 0) {
            setBlocked(false);
            localStorage.removeItem("login_blocked_until");
            clearInterval(interval);
          } else {
            setBlockTimer(Math.ceil(rem / 1000));
          }
        }, 1000);
        return () => clearInterval(interval);
      } else {
        localStorage.removeItem("login_blocked_until");
      }
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (blocked) return;

    setLoading(true);
    setError("");

    try {
      const startTime = Date.now();
      const res = await fetch("/api/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      // Forzar mínimo 1.5s de respuesta para evitar timing attacks
      const elapsed = Date.now() - startTime;
      if (elapsed < 1500) {
        await new Promise(r => setTimeout(r, 1500 - elapsed));
      }

      if (res.ok) {
        // Login exitoso → limpiar intentos
        localStorage.removeItem("login_attempts");
        localStorage.removeItem("login_blocked_until");
        const dest = searchParams.get("from") || "/";
        window.location.href = dest;
      } else if (res.status === 429) {
        // Demasiados intentos
        const data = await res.json();
        setError(data.error || "Demasiados intentos. Espera unos segundos.");
        const blockTime = (data.retryAfter || 30) * 1000;
        localStorage.setItem("login_blocked_until", String(Date.now() + blockTime));
        setBlocked(true);
        setBlockTimer(data.retryAfter || 30);
        setLoading(false);
      } else {
        // Contraseña incorrecta
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        localStorage.setItem("login_attempts", String(newAttempts));

        if (newAttempts >= 5) {
          // Bloquear localmente 30 segundos
          const blockTime = Math.min(30 * Math.pow(2, newAttempts - 5), 300) * 1000;
          localStorage.setItem("login_blocked_until", String(Date.now() + blockTime));
          setBlocked(true);
          setBlockTimer(Math.ceil(blockTime / 1000));
          setError(`Demasiados intentos. Espera ${Math.ceil(blockTime / 1000)}s.`);
        } else {
          setError(`Contraseña incorrecta. Intento ${newAttempts}/5.`);
        }
        setLoading(false);
      }
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-10">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <span className="text-white text-xl font-black tracking-tight">J</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ background: "linear-gradient(135deg,#a78bfa,#e879f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            JazzOne
          </h1>
          <p className="text-sm text-white/40 mt-2">Acceso privado al pipeline</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={blocked ? `Bloqueado ${blockTimer}s` : "Introduce la contraseña"}
              disabled={blocked}
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white/80 placeholder:text-white/25 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-40"
            />
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <p className="text-xs text-rose-300">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password || blocked}
            className="w-full py-3 rounded-xl font-semibold text-sm tracking-wider text-white transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: blockTimer > 0 ? "gray" : "linear-gradient(135deg,#a78bfa,#7c3aed)", boxShadow: blockTimer > 0 ? "none" : "0 0 30px -10px rgba(168,85,247,0.4)" }}
          >
            {loading ? "Verificando..." : blockTimer > 0 ? `Bloqueado ${blockTimer}s` : "Acceder"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-white/20">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          <span>Conexión segura · HTTPS</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
