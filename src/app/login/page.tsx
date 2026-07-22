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

      const elapsed = Date.now() - startTime;
      if (elapsed < 1500) {
        await new Promise(r => setTimeout(r, 1500 - elapsed));
      }

      if (res.ok) {
        localStorage.removeItem("login_attempts");
        localStorage.removeItem("login_blocked_until");
        const dest = searchParams.get("from") || "/";
        window.location.href = dest;
      } else if (res.status === 429) {
        const data = await res.json();
        setError(data.error || "Demasiados intentos. Espera unos segundos.");
        const blockTime = (data.retryAfter || 30) * 1000;
        localStorage.setItem("login_blocked_until", String(Date.now() + blockTime));
        setBlocked(true);
        setBlockTimer(data.retryAfter || 30);
        setLoading(false);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        localStorage.setItem("login_attempts", String(newAttempts));

        if (newAttempts >= 5) {
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
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0a0a0f",
      margin: 0,
      padding: 0,
      fontFamily: "'JetBrains Mono', 'Courier New', monospace"
    }}>
      <div style={{ width: "100%", maxWidth: "360px", margin: "0 16px" }}>
        {/* Logo y título */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            width: "56px",
            height: "56px",
            margin: "0 auto 16px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 30px -8px rgba(168,85,247,0.4)"
          }}>
            <span style={{ color: "#fff", fontSize: "20px", fontWeight: 900, letterSpacing: "-0.05em" }}>J</span>
          </div>
          <h1 style={{
            fontSize: "24px",
            fontWeight: 700,
            letterSpacing: "-0.025em",
            margin: "0 0 8px",
            background: "linear-gradient(135deg, #a78bfa, #e879f9)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            JazzOne
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", margin: 0 }}>
            Acceso privado al pipeline
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{
          borderRadius: "16px",
          padding: "24px",
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.08)"
        }}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{
              display: "block",
              fontSize: "10px",
              fontWeight: 700,
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "8px"
            }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={blocked ? `Bloqueado ${blockTimer}s` : "Introduce la contraseña"}
              disabled={blocked}
              autoFocus
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                padding: "12px 16px",
                fontSize: "14px",
                color: "rgba(255,255,255,0.8)",
                outline: "none",
                boxSizing: "border-box",
                transition: "all 0.2s",
                opacity: blocked ? 0.4 : 1,
                fontFamily: "inherit"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(168,85,247,0.5)";
                e.target.style.boxShadow = "0 0 0 2px rgba(168,85,247,0.2)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255,255,255,0.1)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {error && (
            <div style={{
              marginBottom: "16px",
              padding: "12px 16px",
              borderRadius: "12px",
              background: "rgba(244,63,94,0.1)",
              border: "1px solid rgba(244,63,94,0.2)"
            }}>
              <p style={{ margin: 0, fontSize: "12px", color: "rgba(251,113,133,0.9)" }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password || blocked}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: "12px",
              fontWeight: 600,
              fontSize: "14px",
              letterSpacing: "0.025em",
              color: "#fff",
              border: "none",
              cursor: blocked ? "not-allowed" : (loading || !password) ? "not-allowed" : "pointer",
              opacity: (loading || !password || blocked) ? 0.3 : 1,
              background: blockTimer > 0
                ? "#666"
                : "linear-gradient(135deg, #a78bfa, #7c3aed)",
              boxShadow: blockTimer > 0
                ? "none"
                : "0 0 30px -10px rgba(168,85,247,0.4)",
              transition: "all 0.3s",
              fontFamily: "inherit"
            }}
          >
            {loading ? "Verificando..." : blockTimer > 0 ? `Bloqueado ${blockTimer}s` : "Acceder"}
          </button>
        </form>

        {/* HTTPS badge */}
        <div style={{
          marginTop: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          fontSize: "10px",
          color: "rgba(255,255,255,0.2)"
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Conexión segura · HTTPS</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0f"
      }}>
        <div style={{
          width: "32px",
          height: "32px",
          border: "2px solid rgba(168,85,247,0.3)",
          borderTopColor: "#a78bfa",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
