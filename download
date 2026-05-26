/**
 * Helper para registrar eventos de analytics custom en Supabase.
 * Los eventos se usan en el dashboard de /admin (pestaña Analytics).
 *
 * El tracking es "fire and forget": si falla, no rompe la experiencia del usuario.
 */

import { supabase } from "./supabase";

export type TipoEvento = "consultar_item" | "consultar_jewel" | "cotizar";

interface EventoInput {
  tipo: TipoEvento;
  item_categoria?: string | null;
  item_nombre?: string | null;
  item_tipo?: string | null;
  item_precio?: number | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Registra un evento. No espera la respuesta (no bloquea la UI).
 * Si falla, lo loguea en consola pero no lanza error.
 */
export function trackEvento(input: EventoInput): void {
  // Fire and forget: no usamos await para no bloquear
  supabase
    .from("eventos")
    .insert({
      tipo: input.tipo,
      item_categoria: input.item_categoria ?? null,
      item_nombre: input.item_nombre ?? null,
      item_tipo: input.item_tipo ?? null,
      item_precio: input.item_precio ?? null,
      metadata: input.metadata ?? null,
    })
    .then(({ error }) => {
      if (error) console.warn("trackEvento falló:", error.message);
    });
}
