/**
 * Registros compartidos (versión de miembros) — lógica pura.
 *
 * Diferencia con las herramientas free: acá los registros viven en la DB con
 * fecha completa (timestamptz), así que todo se calcula sobre epoch ms y se
 * muestra en HORA SERVIDOR, que en Guerra Eterna es la hora de Argentina.
 * No dependemos de la zona horaria del celu del miembro.
 *
 * Sin DOM, sin Supabase. Recibe `ahoraMs` por parámetro para poder testear.
 *
 * Decisiones (DECISIONES §3, §3b, §8 y 3ª sesión del 21/08):
 *   gaion  → apertura = captura + standby; siguientes cada 2 hs.
 *   kundun → respawn = muerte + 12 hs. cryonox → muerte + 18 hs.
 *   avisos → 15 y 5 minutos antes.
 */

import { BOSSES } from "./bosses";
import { GAION_COOLDOWN_SEG } from "./gaion";
import { DIA_MS, DIA_SEG, etiquetaDia, formatDuracion, formatHMS, pad2 } from "./tiempo";
import type { EventoRegistroRow, TipoEventoRegistro } from "./database.types";

// =====================================================
// Hora servidor = Argentina (UTC-3 fijo, sin horario de verano desde 2009)
// =====================================================

export const OFFSET_SERVIDOR_MS = -3 * 60 * 60 * 1000;

/** Segundos del día (0..86399) en hora servidor para un epoch ms. */
export function segDelDiaServidor(ms: number): number {
  const local = ms + OFFSET_SERVIDOR_MS;
  return Math.floor((((local % DIA_MS) + DIA_MS) % DIA_MS) / 1000);
}

/** Índice de día (días desde epoch) en hora servidor. Sirve para "hoy/mañana". */
export function indiceDiaServidor(ms: number): number {
  return Math.floor((ms + OFFSET_SERVIDOR_MS) / DIA_MS);
}

/** "HH:MM:SS" en hora servidor. */
export function hmsServidor(ms: number): string {
  return formatHMS(segDelDiaServidor(ms));
}

/** "HH:MM" en hora servidor. */
export function hmServidor(ms: number): string {
  return hmsServidor(ms).slice(0, 5);
}

/** "21/08" en hora servidor. */
export function fechaCortaServidor(ms: number): string {
  const d = new Date(ms + OFFSET_SERVIDOR_MS);
  return `${pad2(d.getUTCDate())}/${pad2(d.getUTCMonth() + 1)}`;
}

/**
 * Si la hora tipeada está "en el futuro" por menos de esto respecto del reloj,
 * asumimos que acaba de pasar (desfase de relojes), no que fue ayer.
 */
export const TOLERANCIA_FUTURO_SEG = 10 * 60;

/**
 * Hora servidor tipeada (segundos del día, sin fecha) → epoch ms de la
 * ocurrencia más reciente de esa hora: hoy, o ayer si todavía no llegó.
 */
export function epochDesdeHoraServidor(horaSeg: number, ahoraMs: number): number {
  const medianoche = indiceDiaServidor(ahoraMs) * DIA_MS - OFFSET_SERVIDOR_MS;
  let ms = medianoche + horaSeg * 1000;
  if (ms > ahoraMs + TOLERANCIA_FUTURO_SEG * 1000) ms -= DIA_MS;
  return ms;
}

// =====================================================
// Config por evento
// =====================================================

export const AVISOS_MIN: readonly number[] = [15, 5];

export interface EventoConfig {
  tipo: TipoEventoRegistro;
  nombre: string;
  icono: string;
  /** Segundos desde el hecho hasta el resultado. null = lo define el standby (Gaion). */
  cooldownSeg: number | null;
  /** Texto del dato que carga el miembro. */
  etiquetaHecho: string;
  /** Texto del resultado. */
  etiquetaResultado: string;
  /** Verbo para el botón "ahora". null = no tiene (Gaion necesita el standby). */
  botonAhora: string | null;
  detalle: string;
}

const kundun = BOSSES.find((b) => b.id === "kundun")!;
const cryonox = BOSSES.find((b) => b.id === "cryonox")!;

export const EVENTOS: EventoConfig[] = [
  {
    tipo: "gaion",
    nombre: "Gaion",
    icono: "⏳",
    cooldownSeg: null,
    etiquetaHecho: "Captura del HUD",
    etiquetaResultado: "abre a las",
    botonAhora: null,
    detalle: "Hora Server + Standby Time de la captura. Después, cada 2 hs.",
  },
  {
    tipo: "kundun",
    nombre: kundun.nombre,
    icono: kundun.icono,
    cooldownSeg: kundun.cooldownHs * 3600,
    etiquetaHecho: "Murió a las",
    etiquetaResultado: "respawnea a las",
    botonAhora: "Lo acabo de matar",
    detalle: `${kundun.mapa} · ${kundun.requisito} · respawn ${kundun.cooldownHs} hs`,
  },
  {
    tipo: "cryonox",
    nombre: cryonox.nombre,
    icono: cryonox.icono,
    cooldownSeg: cryonox.cooldownHs * 3600,
    etiquetaHecho: "Murió a las",
    etiquetaResultado: "respawnea a las",
    botonAhora: "Lo acabo de matar",
    detalle: `${cryonox.mapa} · ${cryonox.requisito} · respawn ${cryonox.cooldownHs} hs`,
  },
];

export function eventoPorTipo(tipo: TipoEventoRegistro): EventoConfig {
  const e = EVENTOS.find((x) => x.tipo === tipo);
  if (!e) throw new Error(`Evento desconocido: ${tipo}`);
  return e;
}

// =====================================================
// Armar un registro nuevo
// =====================================================

export interface RegistroNuevo {
  horaEventoMs: number;
  standbySeg: number | null;
  resultadoMs: number;
}

/** Boss: muerte (epoch ms) + cooldown del boss. */
export function nuevoRegistroBoss(config: EventoConfig, muerteMs: number): RegistroNuevo {
  if (config.cooldownSeg === null) throw new Error("Este evento no usa cooldown fijo");
  return { horaEventoMs: muerteMs, standbySeg: null, resultadoMs: muerteMs + config.cooldownSeg * 1000 };
}

/** Gaion: captura (epoch ms) + standby (seg). */
export function nuevoRegistroGaion(capturaMs: number, standbySeg: number): RegistroNuevo {
  return { horaEventoMs: capturaMs, standbySeg, resultadoMs: capturaMs + standbySeg * 1000 };
}

// =====================================================
// Estado en vivo
// =====================================================

export interface EstadoRegistro {
  resultadoMs: number;
  /** "HH:MM:SS" hora servidor del resultado. */
  hms: string;
  /** Día del resultado relativo a HOY (hora servidor): 0 hoy, 1 mañana, -1 ayer. */
  diasExtra: number;
  /** Segundos que faltan. Negativo si ya pasó. */
  faltaSeg: number;
  listo: boolean;
  /** Umbral de aviso activo (15 o 5) o null si falta más de 15 min o ya pasó. */
  aviso: number | null;
  /** true cuando el resultado pasó hace más de un día: el dato quedó viejo. */
  vencido: boolean;
}

export const VENCIDO_SEG = DIA_SEG;

export function estadoDe(resultadoMs: number, ahoraMs: number): EstadoRegistro {
  const faltaSeg = Math.round((resultadoMs - ahoraMs) / 1000);
  const listo = faltaSeg <= 0;
  let aviso: number | null = null;
  if (!listo) {
    for (const m of AVISOS_MIN) {
      if (faltaSeg <= m * 60) aviso = m; // el más chico que aplique gana
    }
  }
  return {
    resultadoMs,
    hms: hmsServidor(resultadoMs),
    diasExtra: indiceDiaServidor(resultadoMs) - indiceDiaServidor(ahoraMs),
    faltaSeg,
    listo,
    aviso,
    vencido: -faltaSeg > VENCIDO_SEG,
  };
}

export function estadoDeRegistro(r: Pick<EventoRegistroRow, "resultado_at">, ahoraMs: number): EstadoRegistro {
  return estadoDe(Date.parse(r.resultado_at), ahoraMs);
}

/** Próximas aperturas del Gaion después de la última conocida, cada 2 hs. */
export function siguientesGaionMs(resultadoMs: number, cantidad: number): number[] {
  const out: number[] = [];
  for (let i = 1; i <= cantidad; i++) out.push(resultadoMs + i * GAION_COOLDOWN_SEG * 1000);
  return out;
}

/** Después de abrir, la tarjeta sigue mostrando esa apertura ("¡Abrió!") este rato antes de pasar a la siguiente. */
export const GRACIA_GAION_SEG = 5 * 60;

/**
 * Para el Gaion: la apertura "vigente" es la primera que todavía no pasó
 * (con unos minutos de gracia), avanzando de a 2 hs desde la cargada.
 * Devuelve esa y cuántos saltos dio.
 */
export function aperturaVigenteGaion(resultadoMs: number, ahoraMs: number): { ms: number; saltos: number } {
  const paso = GAION_COOLDOWN_SEG * 1000;
  const limite = ahoraMs - GRACIA_GAION_SEG * 1000;
  if (resultadoMs >= limite) return { ms: resultadoMs, saltos: 0 };
  const saltos = Math.floor((limite - resultadoMs) / paso) + 1;
  return { ms: resultadoMs + saltos * paso, saltos };
}

// =====================================================
// Textos
// =====================================================

export function etiquetaDiaServidor(diasExtra: number): string {
  if (diasExtra < 0) return diasExtra === -1 ? "ayer" : `hace ${-diasExtra} días`;
  return etiquetaDia(diasExtra);
}

/** "Faltan 7 h 12 min" / "Pasó hace 23 min 10 s". */
export function textoFaltaRegistro(e: EstadoRegistro, verboPasado = "Pasó"): string {
  if (e.listo) {
    const hace = -e.faltaSeg;
    return hace < 5 ? "¡Ahora!" : `${verboPasado} hace ${formatDuracion(hace)}`;
  }
  return `Faltan ${formatDuracion(e.faltaSeg)}`;
}

/** "hace 12 min" / "hace 3 h 05 min" / "recién". */
export function textoHace(ms: number, ahoraMs: number): string {
  const seg = Math.round((ahoraMs - ms) / 1000);
  if (seg < 30) return "recién";
  return `hace ${formatDuracion(seg)}`;
}

/** Texto para compartir en el chat de la guild. */
export function mensajeRegistro(config: EventoConfig, e: EstadoRegistro): string {
  const dia = e.diasExtra !== 0 ? ` ${etiquetaDiaServidor(e.diasExtra)} (${fechaCortaServidor(e.resultadoMs)})` : "";
  const falta = e.listo ? "" : ` · ${textoFaltaRegistro(e).toLowerCase()}`;
  return `${config.icono} ${config.nombre} ${config.etiquetaResultado} ${e.hms} hora servidor${dia}${falta}`;
}
