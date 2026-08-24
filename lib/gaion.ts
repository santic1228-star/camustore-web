/**
 * Gaion — lógica del calculador de horario.
 *
 * Todo acá es puro (sin DOM, sin Supabase) para que la versión guild
 * (persistencia, countdown, avisos) reuse exactamente las mismas cuentas.
 *
 * Regla confirmada por Camus:
 *   apertura = hora servidor de la captura + standby (MM:SS) que muestra el HUD.
 *   La SIGUIENTE apertura no se puede calcular: el cooldown de 2 hs corre desde
 *   que el evento TERMINA (3 stages, duración desconocida), no desde que abre.
 *   Pasada la apertura conocida, el horario es desconocido hasta la próxima captura.
 *
 * Lo genérico (máscara y parseo de hora servidor, formato, cruce de medianoche)
 * vive en lib/tiempo.ts y se re-exporta acá para no romper imports existentes.
 */

import {
  etiquetaDia,
  soloDigitos,
  sumarAlDia,
  type CampoParseado,
  type MomentoDia,
} from "./tiempo";

export {
  soloDigitos,
  mascaraHora,
  parseHoraServidor,
  formatHMS,
  formatMS,
  etiquetaDia,
  type EstadoCampo,
  type CampoParseado,
} from "./tiempo";

/**
 * Cooldown del Gaion: 2 hs desde que el evento TERMINA (no desde que abre).
 * Como la duración del evento no se conoce, este valor NO alcanza para
 * calcular la próxima apertura; queda como dato de dominio (y explica por
 * qué el standby del HUD puede superar los 99 minutos).
 */
export const GAION_COOLDOWN_SEG = 2 * 60 * 60;

// =====================================================
// Máscara y parseo del Standby (específico del HUD del Gaion)
// =====================================================

/**
 * Máscara M:SS / MM:SS / MMM:SS — hasta 5 dígitos, anclada a la DERECHA:
 * los últimos dos dígitos siempre son segundos. Así "305" → 3:05,
 * "3030" → 30:30 y "11943" → 119:43 (el cooldown de 2hs permite >99 min).
 */
export function mascaraStandby(raw: string): string {
  const d = soloDigitos(raw).slice(0, 5);
  if (d.length <= 2) return d;
  return `${d.slice(0, -2)}:${d.slice(-2)}`;
}

/**
 * Standby: M:SS, MM:SS o MMM:SS (3 a 5 dígitos). Segundos 00–59.
 * Con 3 o 4 dígitos y segundos > 59 lo tratamos como "incompleto" porque
 * el usuario puede estar a mitad de tipear un valor más largo
 * ("1194" es el paso previo a "11943" → 119:43).
 */
export function parseStandby(s: string): CampoParseado {
  const d = soloDigitos(s);
  if (d.length === 0) return { estado: "vacio", seg: null };
  if (d.length < 3) return { estado: "incompleto", seg: null };
  const m = Number(d.slice(0, -2));
  const sec = Number(d.slice(-2));
  if (sec > 59) return { estado: d.length >= 5 ? "invalido" : "incompleto", seg: null };
  return { estado: "ok", seg: m * 60 + sec };
}

// =====================================================
// Cálculo
// =====================================================

/** Alias: una apertura del Gaion es un momento del día en hora servidor. */
export type AperturaGaion = MomentoDia;

/** Próxima apertura: hora servidor + standby. */
export function calcularApertura(horaSeg: number, standbySeg: number): AperturaGaion {
  return sumarAlDia(horaSeg, standbySeg);
}

/** Texto listo para pegar en el chat de la guild. */
export function mensajeGaion(apertura: AperturaGaion): string {
  const dia = apertura.diasExtra > 0 ? ` (${etiquetaDia(apertura.diasExtra)})` : "";
  return `⏳ Gaion abre a las ${apertura.hms} hora servidor${dia}`;
}
