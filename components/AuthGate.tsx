"use client";

import { useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { signInWithPassword, signOut } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

// =====================================================
// Gate genérico por sesión de Supabase (email + contraseña).
//
// - Sin sesión → form de login.
// - Con sesión pero `verificar` devuelve null → "no autorizado".
// - OK → renderiza children(user, datos).
// - Si la carga tarda más de 5 s, ofrece "Cerrar sesión y reintentar".
//
// Lo usan AdminGate (verificar = ¿es admin?) y MiembroGate (¿es miembro?).
// Extraído de AdminGate el 21/08/2026 sin cambiar su comportamiento.
// =====================================================

export interface AuthGateProps<T> {
  /** Devuelve los datos del usuario autorizado, o null si no puede entrar. */
  verificar: (user: User) => Promise<T | null>;
  titulo: string;
  subtitulo: string;
  noAutorizadoTitulo: string;
  noAutorizadoTexto: (email: string) => string;
  children: (user: User, datos: T) => ReactNode;
}

export default function AuthGate<T>({
  verificar,
  titulo,
  subtitulo,
  noAutorizadoTitulo,
  noAutorizadoTexto,
  children,
}: AuthGateProps<T>) {
  const [user, setUser] = useState<User | null>(null);
  const [datos, setDatos] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [stuck, setStuck] = useState(false); // si se cuelga más de 5s

  useEffect(() => {
    let cancelled = false;
    let stuckTimer: NodeJS.Timeout;

    async function verificarConTimeout(u: User): Promise<T | null> {
      return Promise.race([
        verificar(u),
        new Promise<T | null>((res) => setTimeout(() => res(null), 8000)),
      ]).catch(() => null);
    }

    async function init() {
      try {
        stuckTimer = setTimeout(() => {
          if (!cancelled) setStuck(true);
        }, 5000);

        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 10000)),
        ]).catch(() => null);

        if (cancelled) return;

        const session = (sessionResult as any)?.data?.session;
        if (session?.user) {
          const d = await verificarConTimeout(session.user);
          if (cancelled) return;
          setUser(session.user);
          setDatos(d);
        } else {
          setUser(null);
          setDatos(null);
        }
      } catch (err) {
        console.error("Error en AuthGate init:", err);
        if (!cancelled) {
          setUser(null);
          setDatos(null);
        }
      } finally {
        if (!cancelled) {
          clearTimeout(stuckTimer);
          setLoading(false);
          setStuck(false);
        }
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (cancelled) return;
        setUser(session?.user ?? null);
        if (session?.user) {
          const d = await verificarConTimeout(session.user);
          if (!cancelled) setDatos(d);
        } else {
          setDatos(null);
        }
      }
    );

    return () => {
      cancelled = true;
      clearTimeout(stuckTimer);
      subscription.unsubscribe();
    };
    // `verificar` se pasa como función estable (definida fuera del render o con useCallback).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function limpiarSesion() {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignorar errores
    }
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
          localStorage.removeItem(key);
        }
      }
    } catch {}
    location.reload();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-4">
        <p className="font-body text-text-secondary animate-pulse">Cargando…</p>
        {stuck && (
          <div className="gamer-card rounded-lg p-5 max-w-sm text-center mt-4">
            <p className="font-body text-sm text-text-secondary mb-3">
              ¿Tarda más de lo esperado? Tu sesión puede haber expirado.
            </p>
            <button
              onClick={limpiarSesion}
              className="btn-primary w-full px-4 py-2.5 rounded font-body text-xs uppercase tracking-widest"
            >
              Cerrar sesión y reintentar
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!user) {
    return <LoginForm titulo={titulo} subtitulo={subtitulo} />;
  }

  if (datos === null) {
    return (
      <NotAuthorized
        titulo={noAutorizadoTitulo}
        texto={noAutorizadoTexto(user.email || "")}
      />
    );
  }

  return <>{children(user, datos)}</>;
}

// =====================================================
// Login (email + contraseña)
// =====================================================

function LoginForm({ titulo, subtitulo }: { titulo: string; subtitulo: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signInWithPassword(email.trim().toLowerCase(), password);
    setLoading(false);
    if (error) {
      setError(traducirError(error));
    }
    // El onAuthStateChange detecta el login y rehace el render.
  }

  function traducirError(err: string): string {
    if (err.includes("Invalid login credentials")) return "Email o contraseña incorrectos.";
    if (err.includes("Email not confirmed")) return "Email aún no confirmado.";
    return err;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="gamer-card rounded-lg p-6 sm:p-8 w-full max-w-md">
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-primary mb-2">
          {titulo}
        </h1>
        <p className="font-body text-sm text-text-secondary mb-6">{subtitulo}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-body text-xs uppercase tracking-widest text-text-secondary mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full bg-bg-card border border-border-base focus:border-neon-cyan rounded px-3 py-2.5 font-body text-text-primary placeholder:text-text-muted outline-none transition-colors"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block font-body text-xs uppercase tracking-widest text-text-secondary mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-bg-card border border-border-base focus:border-neon-cyan rounded px-3 py-2.5 font-body text-text-primary placeholder:text-text-muted outline-none transition-colors"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="font-body text-xs text-danger-red">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="btn-primary w-full px-6 py-3 rounded font-body text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}

function NotAuthorized({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="gamer-card rounded-lg p-6 sm:p-8 w-full max-w-md text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h1 className="font-display font-bold text-2xl text-text-primary mb-2">{titulo}</h1>
        <p className="font-body text-sm text-text-secondary mb-6">{texto}</p>
        <button
          onClick={() => signOut().then(() => location.reload())}
          className="px-4 py-2 rounded font-body text-xs uppercase tracking-widest border border-border-strong text-text-secondary hover:border-neon-cyan hover:text-neon-cyan transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
