/**
 * Gaion — lógica del calculador de horario.
 *
 * Todo acá es puro (sin DOM, sin Supabase) para que la versión guild
 * (persistencia, countdown, avisos) reuse exactamente las mismas cuentas.
 *
 * Regla confirmada por Camus:
 *   apertura = hora servidor de la captura + standby (MM:SS) que muestra el HUD.
 *   Después de cada apertura, la siguiente es a las 2hs (cooldown).
 */

export const GAION_COOLDOWN_SEG = 2 * 60 * 60;
const DIA_SEG = 24 * 60 * 60;

// =====================================================
// Máscaras de input (se aplican mientras el usuario tipea)
// =====================================================

export function soloDigitos(s: string): string {
  return s.replace(/\D/g, "");
}

/** Máscara HH:MM:SS — hasta 6 dígitos, anclada a la izquierda. */
export function mascaraHora(raw: string): string {
  const d = soloDigitos(raw).slice(0, 6);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}:${d.slice(2)}`;
  return `${d.slice(0, 2)}:${d.slice(2, 4)}:${d.slice(4)}`;
}

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

// =====================================================
// Parseo y validación
// =====================================================

export type EstadoCampo = "vacio" | "incompleto" | "invalido" | "ok";

export interface CampoParseado {
  estado: EstadoCampo;
  /** Segundos. Solo tiene sentido cuando estado === "ok". */
  seg: number | null;
}

/** Hora servidor: acepta HH:MM:SS (6 dígitos) o HH:MM (4 dígitos). */
export function parseHoraServidor(s: string): CampoParseado {
  const d = soloDigitos(s);
  if (d.length === 0) return { estado: "vacio", seg: null };
  if (d.length !== 4 && d.length !== 6) return { estado: "incompleto", seg: null };
  const h = Number(d.slice(0, 2));
  const m = Number(d.slice(2, 4));
  const sec = d.length === 6 ? Number(d.slice(4, 6)) : 0;
  if (h > 23 || m > 59 || sec > 59) return { estado: "invalido", seg: null };
  return { estado: "ok", seg: h * 3600 + m * 60 + sec };
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
// Formato
// =====================================================

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Segundos del día → "HH:MM:SS". */
export function formatHMS(seg: number): string {
  const s = ((seg % DIA_SEG) + DIA_SEG) % DIA_SEG;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(sec)}`;
}

/** Segundos → "MM:SS". */
export function formatMS(seg: number): string {
  const m = Math.floor(seg / 60);
  const sec = seg % 60;
  return `${pad2(m)}:${pad2(sec)}`;
}

// =====================================================
// Cálculo
// =====================================================

export interface AperturaGaion {
  /** Segundos del día (0..86399), hora servidor. */
  seg: number;
  /** "HH:MM:SS" hora servidor. */
  hms: string;
  /** 0 = mismo día de la captura, 1 = al día siguiente, etc. */
  diasExtra: number;
}

function aperturaDesde(totalSeg: number): AperturaGaion {
  const diasExtra = Math.floor(totalSeg / DIA_SEG);
  const seg = totalSeg % DIA_SEG;
  return { seg, hms: formatHMS(seg), diasExtra };
}

/** Próxima apertura: hora servidor + standby. */
export function calcularApertura(horaSeg: number, standbySeg: number): AperturaGaion {
  return aperturaDesde(horaSeg + standbySeg);
}

/**
 * Aperturas siguientes a partir de una apertura conocida, cada 2hs.
 * (Para la versión guild: lista de próximos horarios.)
 */
export function siguientesAperturas(apertura: AperturaGaion, cantidad: number): AperturaGaion[] {
  const base = apertura.diasExtra * DIA_SEG + apertura.seg;
  const out: AperturaGaion[] = [];
  for (let i = 1; i <= cantidad; i++) {
    out.push(aperturaDesde(base + i * GAION_COOLDOWN_SEG));
  }
  return out;
}

/** Etiqueta corta del día relativo: "hoy" / "mañana" / "en N días". */
export function etiquetaDia(diasExtra: number): string {
  if (diasExtra === 0) return "hoy";
  if (diasExtra === 1) return "mañana";
  return `en ${diasExtra} días`;
}

/** Texto listo para pegar en el chat de la guild. */
export function mensajeGaion(apertura: AperturaGaion): string {
  const dia = apertura.diasExtra > 0 ? ` (${etiquetaDia(apertura.diasExtra)})` : "";
  return `⏳ Gaion abre a las ${apertura.hms} hora servidor${dia}`;
}
