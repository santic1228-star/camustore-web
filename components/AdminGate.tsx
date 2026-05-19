"use client";

import { useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { signInWithPassword, checkIsAdmin, signOut } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

interface Props {
  children: (user: User) => ReactNode;
}

/**
 * Wrapper que protege rutas admin.
 * - Si no hay sesión, muestra el form de login (email + password).
 * - Si hay sesión pero el email no está en `admins`, muestra mensaje de "no autorizado".
 * - Si todo OK, renderiza children pasándole el user.
 * - Si la carga tarda más de 5s, ofrece botón "Reintentar / Cerrar sesión" para no quedar colgado.
 */
export default function AdminGate({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [stuck, setStuck] = useState(false);  // si se cuelga más de 5s

  useEffect(() => {
    let cancelled = false;
    let stuckTimer: NodeJS.Timeout;

    async function init() {
      try {
        // Si tarda más de 5s, mostramos opciones de recuperación
        stuckTimer = setTimeout(() => {
          if (!cancelled) setStuck(true);
        }, 5000);

        // Timeout global de 10s a las llamadas, para no quedar colgado infinitamente
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 10000)),
        ]).catch(() => null);

        if (cancelled) return;

        const session = (sessionResult as any)?.data?.session;
        if (session?.user) {
          const ok = await Promise.race([
            checkIsAdmin(session.user),
            new Promise<boolean>((res) => setTimeout(() => res(false), 5000)),
          ]).catch(() => false);
          if (cancelled) return;
          setUser(session.user);
          setIsAdmin(ok);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("Error en AdminGate init:", err);
        if (!cancelled) {
          setUser(null);
          setIsAdmin(false);
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

    // Escuchar cambios de auth (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (cancelled) return;
        setUser(session?.user ?? null);
        if (session?.user) {
          const ok = await checkIsAdmin(session.user).catch(() => false);
          if (!cancelled) setIsAdmin(ok);
        } else {
          setIsAdmin(false);
        }
      }
    );

    return () => {
      cancelled = true;
      clearTimeout(stuckTimer);
      subscription.unsubscribe();
    };
  }, []);

  async function limpiarSesion() {
    // Limpia todo: cierra sesión Supabase + localStorage del proyecto
    try {
      await supabase.auth.signOut();
    } catch {
      // ignorar errores
    }
    // Borro todas las claves de localStorage que use Supabase
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
    return <LoginForm />;
  }

  if (!isAdmin) {
    return <NotAuthorized email={user.email || ""} />;
  }

  return <>{children(user)}</>;
}

function LoginForm() {
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
    // No hace falta más: el onAuthStateChange detecta el login y rehace el render.
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
          Acceso Admin
        </h1>
        <p className="font-body text-sm text-text-secondary mb-6">
          Ingresá tu email y contraseña de administrador.
        </p>

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

function NotAuthorized({ email }: { email: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="gamer-card rounded-lg p-6 sm:p-8 w-full max-w-md text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h1 className="font-display font-bold text-2xl text-text-primary mb-2">
          Sin permisos de admin
        </h1>
        <p className="font-body text-sm text-text-secondary mb-6">
          Tu email ({email}) no está autorizado como admin de CamuStore.
        </p>
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
