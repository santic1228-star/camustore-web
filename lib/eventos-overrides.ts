/**
 * Overrides del calendario — LÓGICA PURA (sin Supabase), testeable.
 * El acceso a datos vive en eventos-config.ts (mismo par que
 * precios-config.ts / config-precios.ts).
 */

import {
  EVENTOS_CATALOGO,
  type EventoCatalogo,
  type ReglaHorario,
  type Tier,
} from "./eventos-catalogo";

// =====================================================
// Tipos del override
// =====================================================

export interface OverrideEvento {
  /** 3|2|1. Se aceptan también los nombres viejos ("alto"/"medio"/"bajo"). */
  tier?: Tier | "alto" | "medio" | "bajo";
  /** Pisa el default de "se puede apuntar" (tier 3 y 2). */
  seApunta?: boolean;
  /** false = no se muestra en ninguna timeline. */
  visible?: boolean;
  regla?: ReglaHorario;
  /** null = borrar la duración del catálogo (sin "EN CURSO"). */
  duracionMin?: number | null;
  /** null = borrar la nota del catálogo. */
  nota?: string | null;
}

/** { evento_id → override }. Vacío = todo default. */
export type ValoresEventosConfig = Record<string, OverrideEvento>;

// =====================================================
// Lógica pura
// =====================================================

const LEGACY_TIER: Record<string, Tier> = { alto: 3, medio: 2, bajo: 1 };

/** Normaliza un tier que viene de la BD (número nuevo o nombre viejo). */
export function normalizarTier(v: unknown): Tier | null {
  if (v === 3 || v === 2 || v === 1) return v;
  if (typeof v === "string" && v in LEGACY_TIER) return LEGACY_TIER[v];
  return null;
}

/** Valida a grandes rasgos una regla que viene de la BD (jsonb). */
function reglaValida(r: unknown): r is ReglaHorario {
  if (!r || typeof r !== "object") return false;
  const x = r as ReglaHorario;
  if (x.clase === "lista_diaria") {
    return Array.isArray(x.horasSeg) && x.horasSeg.every((n) => typeof n === "number" && n >= 0 && n < 86400);
  }
  if (x.clase === "semanal") {
    return (
      Array.isArray(x.ocurrencias) &&
      x.ocurrencias.every(
        (o) => typeof o?.dia === "number" && o.dia >= 0 && o.dia <= 6 && typeof o?.horaSeg === "number",
      )
    );
  }
  return false;
}

/**
 * Catálogo efectivo: el catálogo en código con los overrides aplicados.
 * Los eventos con visible=false salen de la lista. Los overrides inválidos
 * (regla rota, tier desconocido, id que no existe) se ignoran sin romper.
 */
export function aplicarConfig(
  valores: ValoresEventosConfig,
  catalogo: EventoCatalogo[] = EVENTOS_CATALOGO,
): EventoCatalogo[] {
  const out: EventoCatalogo[] = [];
  for (const ev of catalogo) {
    const o = valores[ev.id];
    if (!o) {
      out.push(ev);
      continue;
    }
    if (o.visible === false) continue;
    const efectivo: EventoCatalogo = { ...ev };
    const tierNorm = normalizarTier(o.tier);
    if (tierNorm !== null) efectivo.tier = tierNorm;
    if (typeof o.seApunta === "boolean") efectivo.seApunta = o.seApunta;
    if (o.regla && reglaValida(o.regla)) {
      efectivo.regla =
        o.regla.clase === "lista_diaria"
          ? { ...o.regla, horasSeg: [...o.regla.horasSeg].sort((a, b) => a - b) }
          : o.regla;
    }
    if (o.duracionMin !== undefined) {
      if (o.duracionMin === null) delete efectivo.duracionMin;
      else if (o.duracionMin > 0) efectivo.duracionMin = o.duracionMin;
    }
    if (o.nota !== undefined) {
      if (o.nota === null || o.nota.trim() === "") delete efectivo.nota;
      else efectivo.nota = o.nota;
    }
    out.push(efectivo);
  }
  return out;
}

/** true si el override no cambia nada (para limpiar antes de guardar). */
export function overrideVacio(o: OverrideEvento): boolean {
  return (
    o.tier === undefined &&
    o.seApunta === undefined &&
    o.visible === undefined &&
    o.regla === undefined &&
    o.duracionMin === undefined &&
    o.nota === undefined
  );
}

