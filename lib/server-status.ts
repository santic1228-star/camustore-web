/**
 * Estado del server de Guerra Eterna — lógica pura.
 *
 * Sin DOM, sin Supabase, sin fetch: se puede probar en node.
 * La consume la ruta `/api/server-status` (servidor) y `components/EstadoServer.tsx`
 * (navegador), así los dos hablan del mismo formato.
 */

/** Lo que devuelve `/api/server-status`. */
export interface EstadoServer {
  /** true = la sonda llegó al server. false = no contestó (o contestó 5xx). */
  online: boolean;
  /**
   * Desde cuándo está en este estado, ISO. Ojo: es desde que **la web lo
   * detectó**, no desde el segundo exacto en que se cayó. Si Supabase falla
   * viene null y la UI muestra el estado sin el "hace X".
   */
  desde: string | null;
  /** Cuándo se hizo esta verificación, ISO. */
  verificadoEn: string;
  /** Detalle técnico ("HTTP 200", "sin respuesta (timeout)"). Para debug. */
  detalle: string;
}

/** Los tres estados que puede mostrar la UI. */
export type EstadoUI = "cargando" | "online" | "caido" | "sin_datos";

/**
 * "hace X" en castellano, redondeado a la unidad que se entiende de un vistazo.
 * Devuelve "" si no hay dato o si la fecha es futura (reloj del celu adelantado).
 */
export function haceCuanto(desdeISO: string | null, ahoraMs: number): string {
  if (!desdeISO) return "";
  const desdeMs = Date.parse(desdeISO);
  if (Number.isNaN(desdeMs)) return "";

  const seg = Math.floor((ahoraMs - desdeMs) / 1000);
  if (seg < 0) return "";
  if (seg < 60) return "recién";

  const min = Math.floor(seg / 60);
  if (min < 60) return `hace ${min} min`;

  const hs = Math.floor(min / 60);
  if (hs < 24) {
    const resto = min % 60;
    return resto === 0 ? `hace ${hs} h` : `hace ${hs} h ${resto} min`;
  }

  const dias = Math.floor(hs / 24);
  return dias === 1 ? "hace 1 día" : `hace ${dias} días`;
}

/** Texto del estado para la píldora del header. */
export function etiquetaEstado(estado: EstadoUI): string {
  switch (estado) {
    case "online":
      return "ONLINE";
    case "caido":
      return "CAÍDO";
    case "sin_datos":
      return "SIN DATOS";
    case "cargando":
      return "···";
  }
}
