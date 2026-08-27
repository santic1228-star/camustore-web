/**
 * Tiempo — helpers compartidos por las herramientas (Gaion, Bosses, ...).
 *
 * Todo acá es puro (sin DOM, sin Supabase). Trabaja en "segundos del día"
 * en hora servidor, que en Guerra Eterna coincide con la hora de Argentina.
 */

export const DIA_SEG = 24 * 60 * 60;
export const DIA_MS = DIA_SEG * 1000;

/**
 * Hora servidor = Argentina (UTC-3 fijo; el país no tiene horario de verano
 * desde 2009). Vive acá para que `registros.ts` y `precios-config.ts` no
 * tengan dos definiciones del mismo offset.
 */
export const OFFSET_SERVIDOR_MS = -3 * 60 * 60 * 1000;

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

// =====================================================
// Formato
// =====================================================

export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Segundos del día → "HH:MM:SS". Normaliza si se pasa de 24hs o es negativo. */
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

/**
 * Duración legible para humanos: "7 h 12 min", "12 min 05 s", "45 s".
 * Muestra segundos solo cuando queda menos de una hora (ahí importan).
 */
export function formatDuracion(segTotal: number): string {
  const seg = Math.max(0, Math.floor(segTotal));
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  if (h > 0) return `${h} h ${pad2(m)} min`;
  if (m > 0) return `${m} min ${pad2(s)} s`;
  return `${s} s`;
}

/** Etiqueta corta del día relativo: "hoy" / "mañana" / "en N días". */
export function etiquetaDia(diasExtra: number): string {
  if (diasExtra === 0) return "hoy";
  if (diasExtra === 1) return "mañana";
  return `en ${diasExtra} días`;
}

// =====================================================
// Cálculo
// =====================================================

/** Un momento del día en hora servidor, con cuántos días se corrió. */
export interface MomentoDia {
  /** Segundos del día (0..86399), hora servidor. */
  seg: number;
  /** "HH:MM:SS" hora servidor. */
  hms: string;
  /** 0 = mismo día de referencia, 1 = al día siguiente, etc. */
  diasExtra: number;
}

/** Segundos totales (pueden superar un día) → MomentoDia. */
export function momentoDesde(totalSeg: number): MomentoDia {
  const diasExtra = Math.floor(totalSeg / DIA_SEG);
  const seg = totalSeg % DIA_SEG;
  return { seg, hms: formatHMS(seg), diasExtra };
}

/** hora del día + delta → momento resultante (maneja cruce de medianoche). */
export function sumarAlDia(horaSeg: number, deltaSeg: number): MomentoDia {
  return momentoDesde(horaSeg + deltaSeg);
}
