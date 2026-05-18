"use client";

import { useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { sendMagicLink, checkIsAdmin, signOut } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

interface Props {
  children: (user: User) => ReactNode;
}

/**
 * Wrapper que protege rutas admin.
 * - Si no hay sesión, muestra el form de magic link.
 * - Si hay sesión pero el email no está en `admins`, muestra mensaje de "no autorizado".
 * - Si todo OK, renderiza children pasándole el user.
 */
export default function AdminGate({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Estado inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkIsAdmin(session.user).then((ok) => {
          setIsAdmin(ok);
          setLoading(false);
        });
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const ok = await checkIsAdmin(session.user);
          setIsAdmin(ok);
        } else {
          setIsAdmin(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-body text-text-secondary animate-pulse">Cargando…</p>
      </div>
    );
  }

  // No hay sesión → form de login
  if (!user) {
    return <LoginForm />;
  }

  // Sesión sí, pero no es admin
  if (!isAdmin) {
    return <NotAuthorized email={user.email || ""} />;
  }

  // Es admin → render children
  return <>{children(user)}</>;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await sendMagicLink(email.trim().toLowerCase());
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="gamer-card rounded-lg p-6 sm:p-8 w-full max-w-md">
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-primary mb-2">
          Acceso Admin
        </h1>
        <p className="font-body text-sm text-text-secondary mb-6">
          Ingresá tu email. Te mandamos un link para entrar sin contraseña.
        </p>

        {sent ? (
          <div className="border border-neon-cyan/50 bg-neon-cyan/5 rounded p-4">
            <p className="font-body text-sm text-neon-cyan">
              ✉ Listo, revisá tu casilla. El link expira en 1 hora.
            </p>
            <p className="font-body text-xs text-text-muted mt-2">
              ¿No te llega? Verificá la carpeta de spam.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-body text-xs uppercase tracking-widest text-text-secondary mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-bg-card border border-border-base focus:border-neon-cyan rounded px-3 py-2.5 font-body text-text-primary placeholder:text-text-muted outline-none transition-colors"
                disabled={loading}
              />
            </div>

            {error && (
              <p className="font-body text-xs text-danger-red">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="btn-primary w-full px-6 py-3 rounded font-body text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Enviando..." : "Enviar link"}
            </button>
          </form>
        )}
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
