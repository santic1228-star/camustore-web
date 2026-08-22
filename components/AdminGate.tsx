"use client";

import { ReactNode } from "react";
import AuthGate from "./AuthGate";
import { checkIsAdmin } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

interface Props {
  children: (user: User) => ReactNode;
}

/**
 * Protege las rutas admin. Desde el 21/08/2026 es un wrapper de AuthGate
 * (el gate genérico que también usa /miembros); el comportamiento es el mismo:
 * login email + contraseña, y el email tiene que estar en ADMIN_EMAILS (lib/auth.ts).
 */
async function verificarAdmin(user: User): Promise<true | null> {
  return (await checkIsAdmin(user)) ? true : null;
}

export default function AdminGate({ children }: Props) {
  return (
    <AuthGate<true>
      verificar={verificarAdmin}
      titulo="Acceso Admin"
      subtitulo="Ingresá tu email y contraseña de administrador."
      noAutorizadoTitulo="Sin permisos de admin"
      noAutorizadoTexto={(email) => `Tu email (${email}) no está autorizado como admin de CamuStore.`}
    >
      {(user) => children(user)}
    </AuthGate>
  );
}
