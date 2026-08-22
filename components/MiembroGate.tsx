"use client";

import { ReactNode } from "react";
import AuthGate from "./AuthGate";
import { verificarMiembro, type SesionMiembro } from "@/lib/miembros";
import type { User } from "@supabase/supabase-js";

interface Props {
  children: (sesion: SesionMiembro) => ReactNode;
}

/**
 * Protege /miembros. Entra quien está en la tabla `miembros` (activo) o es admin.
 * Mismo login que el admin: email + contraseña que Camus crea en Supabase.
 */
async function verificar(user: User): Promise<SesionMiembro | null> {
  return verificarMiembro(user);
}

export default function MiembroGate({ children }: Props) {
  return (
    <AuthGate<SesionMiembro>
      verificar={verificar}
      titulo="Zona de miembros"
      subtitulo="Ingresá con el email y la contraseña que te pasó Camus."
      noAutorizadoTitulo="No sos miembro todavía"
      noAutorizadoTexto={(email) =>
        `Tu email (${email}) no está habilitado como miembro. Hablale a Camus para que te dé de alta.`
      }
    >
      {(_user, sesion) => children(sesion)}
    </AuthGate>
  );
}
