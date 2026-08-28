/**
 * Config del calendario de eventos — overrides sobre el catálogo, sin deploy.
 *
 * El catálogo en código (lib/eventos-catalogo.ts) es el DEFAULT. La tabla
 * `eventos_config` (append-only, como config_precios) guarda overrides por
 * evento: tier, visible, regla (horarios), duración y nota. La fila más
 * reciente rige; campo ausente = vale el default. Nació del rebalanceo del
 * 28/08: si el admin del server vuelve a tocar el calendario, Santi lo
 * corrige desde el tab Eventos sin redeploy.
 *
 * `aplicarConfig` es PURO (testeado); la lectura/escritura va por Supabase.
 * La lectura es pública: la timeline free también aplica los overrides.
 */

import { supabase } from "./supabase";
import type { EventosConfigRow } from "./database.types";

export {
  aplicarConfig,
  overrideVacio,
  type OverrideEvento,
  type ValoresEventosConfig,
} from "./eventos-overrides";

import { overrideVacio, type ValoresEventosConfig } from "./eventos-overrides";

// =====================================================
// Acceso a datos (mismo patrón que config-precios.ts)
// =====================================================

export interface ConfigEventosCargada {
  valores: ValoresEventosConfig;
  /** Fila vigente (la más nueva) o null si nunca se guardó nada. */
  fila: EventosConfigRow | null;
  error: string | null;
}

/** La config vigente. Sin filas o con error → valores vacíos (= catálogo puro). */
export async function cargarConfigEventos(): Promise<ConfigEventosCargada> {
  const { data, error } = await supabase
    .from("eventos_config")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { valores: {}, fila: null, error: `${error.message}${error.code ? ` (${error.code})` : ""}` };
  }
  const fila = (data as EventosConfigRow | null) ?? null;
  const valores = (fila?.valores as ValoresEventosConfig | undefined) ?? {};
  return { valores, fila, error: null };
}

export interface ResultadoGuardadoEventos {
  ok: boolean;
  error: string | null;
}

/** Guarda una config nueva (append-only: nunca pisa, siempre inserta). */
export async function guardarConfigEventos(
  valores: ValoresEventosConfig,
  creadoPorEmail: string,
  nota?: string | null,
): Promise<ResultadoGuardadoEventos> {
  // limpiar overrides vacíos para que el historial sea legible
  const limpios: ValoresEventosConfig = {};
  for (const [id, o] of Object.entries(valores)) {
    if (!overrideVacio(o)) limpios[id] = o;
  }
  const { error } = await supabase.from("eventos_config").insert({
    valores: limpios as unknown as Record<string, unknown>,
    nota: nota?.trim() || null,
    creado_por_email: creadoPorEmail.toLowerCase(),
  });
  if (error) {
    return { ok: false, error: `${error.message}${error.code ? ` (código ${error.code})` : ""}` };
  }
  return { ok: true, error: null };
}

/** Historial de configs, la más nueva primero. */
export async function listarHistorialEventos(limite = 15): Promise<{
  filas: EventosConfigRow[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("eventos_config")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limite);
  if (error) {
    return { filas: [], error: `${error.message}${error.code ? ` (${error.code})` : ""}` };
  }
  return { filas: (data as EventosConfigRow[]) ?? [], error: null };
}
