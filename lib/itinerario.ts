/**
 * Itinerario — las próximas 24 hs del server, ordenadas.
 *
 * Puro (sin DOM, sin Supabase): recibe `ahoraMs` (epoch) por parámetro para
 * poder testearlo contra las capturas de la ventana Events (GUIA §5c).
 * Todo se calcula y se muestra en HORA SERVIDOR (= Argentina, UTC-3 fijo).
 *
 * Reusa los helpers de `tiempo.ts` y `registros.ts` (Convención 11).
 * La versión de miembros (Tanda B) usa estas mismas cuentas y les intercala
 * los registros privados (Gaion / Kundun / Cryonox) y el apuntarse.
 */

import { DIA_MS, etiquetaDia, formatHMS } from "./tiempo";
import { indiceDiaServidor, OFFSET_SERVIDOR_MS } from "./registros";
import {
  EVENTOS_CATALOGO,
  type EventoCatalogo,
} from "./eventos-catalogo";

// =====================================================
// Tipos
// =====================================================

export interface Ocurrencia {
  evento: EventoCatalogo;
  /** Epoch ms del inicio. */
  inicioMs: number;
  /** Segundos del día (hora servidor) del inicio. */
  horaSeg: number;
  /** "HH:MM" hora servidor. */
  hm: string;
  /** Días de diferencia con el día servidor de `ahora` (0 = hoy, 1 = mañana). */
  diasExtra: number;
  /** "hoy" / "mañana" / "en N días" — o "en curso". */
  etiqueta: string;
  /** true si `ahora` cae dentro de la duración conocida del evento. */
  enCurso: boolean;
  /** Segundos hasta el inicio (negativo si ya arrancó y sigue en curso). */
  faltanSeg: number;
}

// =====================================================
// Cuentas internas
// =====================================================

/** Epoch ms de "el día servidor `diaIdx` a los `horaSeg` segundos". */
function msDe(diaIdx: number, horaSeg: number): number {
  return diaIdx * DIA_MS + horaSeg * 1000 - OFFSET_SERVIDOR_MS;
}

/** Día de la semana (0 = domingo … 6 = sábado) de un índice de día servidor. */
export function diaSemanaDe(diaIdx: number): number {
  // El día 0 de la época (1/1/1970) fue jueves (= 4).
  return (diaIdx + 4) % 7;
}

/** Horas del evento para un día servidor concreto (según su regla). */
function horasDelDia(ev: EventoCatalogo, diaIdx: number): number[] {
  if (ev.regla.clase === "lista_diaria") return ev.regla.horasSeg;
  const dia = diaSemanaDe(diaIdx);
  return ev.regla.ocurrencias.filter((o) => o.dia === dia).map((o) => o.horaSeg);
}

function armarOcurrencia(
  ev: EventoCatalogo,
  inicioMs: number,
  horaSeg: number,
  diasExtra: number,
  ahoraMs: number,
): Ocurrencia {
  const durMs = (ev.duracionMin ?? 0) * 60_000;
  const enCurso = inicioMs <= ahoraMs && ahoraMs < inicioMs + durMs;
  return {
    evento: ev,
    inicioMs,
    horaSeg,
    hm: formatHMS(horaSeg).slice(0, 5),
    diasExtra,
    etiqueta: enCurso ? "en curso" : etiquetaDia(diasExtra),
    enCurso,
    faltanSeg: Math.round((inicioMs - ahoraMs) / 1000),
  };
}

// =====================================================
// API
// =====================================================

/**
 * Ocurrencias de UN evento dentro de la ventana [ahora, ahora + horasVentana],
 * más la que esté EN CURSO si arrancó antes y su duración conocida la alcanza.
 */
export function ocurrenciasVentana(
  ev: EventoCatalogo,
  ahoraMs: number,
  horasVentana = 24,
): Ocurrencia[] {
  const d0 = indiceDiaServidor(ahoraMs);
  const finMs = ahoraMs + horasVentana * 3_600_000;
  const out: Ocurrencia[] = [];
  const ultimoDia = d0 + Math.ceil(horasVentana / 24) + 1;
  for (let d = d0 - 1; d <= ultimoDia; d++) {
    for (const horaSeg of horasDelDia(ev, d)) {
      const inicioMs = msDe(d, horaSeg);
      const oc = armarOcurrencia(ev, inicioMs, horaSeg, d - d0, ahoraMs);
      const futuraEnVentana = inicioMs > ahoraMs && inicioMs <= finMs;
      if (oc.enCurso || futuraEnVentana) out.push(oc);
    }
  }
  return out.sort((a, b) => a.inicioMs - b.inicioMs);
}

/** La timeline: todas las ocurrencias de las próximas 24 hs, ordenadas. */
export function itinerario24h(
  ahoraMs: number,
  catalogo: EventoCatalogo[] = EVENTOS_CATALOGO,
): Ocurrencia[] {
  return catalogo
    .flatMap((ev) => ocurrenciasVentana(ev, ahoraMs))
    .sort((a, b) => a.inicioMs - b.inicioMs || a.evento.nombre.localeCompare(b.evento.nombre));
}

/**
 * Próxima ocurrencia de un evento aunque caiga fuera de las 24 hs
 * (los semanales pueden estar a días). Busca hasta 8 días; null si no hay.
 */
export function proximaOcurrencia(
  ev: EventoCatalogo,
  ahoraMs: number,
): Ocurrencia | null {
  const d0 = indiceDiaServidor(ahoraMs);
  let mejor: Ocurrencia | null = null;
  for (let d = d0 - 1; d <= d0 + 8; d++) {
    for (const horaSeg of horasDelDia(ev, d)) {
      const inicioMs = msDe(d, horaSeg);
      const oc = armarOcurrencia(ev, inicioMs, horaSeg, d - d0, ahoraMs);
      if (!oc.enCurso && inicioMs <= ahoraMs) continue;
      if (!mejor || oc.inicioMs < mejor.inicioMs) mejor = oc;
    }
    if (mejor) break; // los días siguientes solo pueden dar ocurrencias posteriores
  }
  return mejor;
}

/** Los eventos semanales con su próxima ocurrencia (para la franja "fijos de la semana"). */
export function proximosSemanales(
  ahoraMs: number,
  catalogo: EventoCatalogo[] = EVENTOS_CATALOGO,
): { evento: EventoCatalogo; proxima: Ocurrencia | null }[] {
  return catalogo
    .filter((ev) => ev.regla.clase === "semanal")
    .map((evento) => ({ evento, proxima: proximaOcurrencia(evento, ahoraMs) }))
    .sort((a, b) => (a.proxima?.inicioMs ?? Infinity) - (b.proxima?.inicioMs ?? Infinity));
}
