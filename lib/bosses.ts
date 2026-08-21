/**
 * Bosses con timer — lógica de los calculadores de respawn.
 *
 * Puro (sin DOM, sin Supabase). La versión guild reusa estas mismas cuentas
 * y le agrega persistencia (quién cargó la muerte, avisos, etc.).
 *
 * Regla confirmada por Camus (21/08/2026):
 *   respawn = hora servidor en que murió el boss + cooldown del boss.
 *   Kundun 12hs · Cryonox 18hs. No tienen horario fijo.
 *
 * Diferencia con el Gaion: acá además mostramos "cuánto falta", para lo
 * cual necesitamos un "ahora". Lo recibe como parámetro (ms epoch) para
 * poder testearlo sin depender del reloj de la máquina.
 */

import { DIA_MS, DIA_SEG, etiquetaDia, formatDuracion, formatHMS, pad2 } from "./tiempo";

// =====================================================
// Config de bosses
// =====================================================

export type BossId = "kundun" | "cryonox";

export interface BossConfig {
  id: BossId;
  nombre: string;
  icono: string;
  /** Horas desde la muerte hasta el respawn. */
  cooldownHs: number;
  mapa: string;
  /** Qué hace falta para llegar a él. */
  requisito: string;
  drop: string;
}

export const BOSSES: BossConfig[] = [
  {
    id: "kundun",
    nombre: "Kundun",
    icono: "👁",
    cooldownHs: 12,
    mapa: "Kalima",
    requisito: "Se entra con el ítem MAP +7",
    drop: "Items ACC",
  },
  {
    id: "cryonox",
    nombre: "Cryonox",
    icono: "❄",
    cooldownHs: 18,
    mapa: "Abyssal Maze (mapa VIP)",
    requisito: "Hay que ser VIP para entrar",
    drop: "Dos items 400",
  },
];

export function bossPorId(id: BossId): BossConfig {
  const b = BOSSES.find((x) => x.id === id);
  if (!b) throw new Error(`Boss desconocido: ${id}`);
  return b;
}

// =====================================================
// Cálculo
// =====================================================

/**
 * Si la hora tipeada está "en el futuro" por menos de esto respecto del
 * reloj del celu, asumimos que el boss acaba de morir (desfase de relojes),
 * no que murió ayer. Server y local en la PC de Camus difieren ~3 seg;
 * 10 minutos cubre cualquier celu mal sincronizado.
 */
export const TOLERANCIA_FUTURO_MS = 10 * 60 * 1000;

export interface RespawnBoss {
  /** Epoch ms en que murió (reloj local, asumido ≈ hora servidor). */
  muerteMs: number;
  /** Epoch ms del respawn. */
  respawnMs: number;
  /** "HH:MM:SS" del respawn, hora servidor. */
  hms: string;
  /** Día del respawn relativo a HOY (el día del reloj, no el de la muerte): 0 hoy, 1 mañana. */
  diasExtra: number;
  /** Segundos que faltan. Negativo si ya pasó. */
  faltaSeg: number;
  /** true si el cooldown ya se cumplió. */
  listo: boolean;
}

/** Medianoche local del día que contiene `ms`. */
function medianocheDe(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * A partir de la hora servidor en que murió el boss (segundos del día),
 * el cooldown en horas y el "ahora" (epoch ms), calcula el respawn.
 *
 * La hora tipeada no trae fecha: la interpretamos como la ocurrencia más
 * reciente de ese HH:MM:SS (hoy, o ayer si todavía no llegó esa hora).
 */
export function calcularRespawn(horaMuerteSeg: number, cooldownHs: number, ahoraMs: number): RespawnBoss {
  const hoy0 = medianocheDe(ahoraMs);
  let muerteMs = hoy0 + horaMuerteSeg * 1000;
  if (muerteMs > ahoraMs + TOLERANCIA_FUTURO_MS) {
    muerteMs -= DIA_MS; // esa hora todavía no pasó hoy → fue ayer
  }

  const cooldownSeg = Math.round(cooldownHs * 3600);
  const respawnMs = muerteMs + cooldownSeg * 1000;

  // Hora del respawn en hora servidor: sumamos sobre el reloj de 24hs,
  // igual que en el Gaion (sin DST en Argentina, coincide con la fecha real).
  const hms = formatHMS((horaMuerteSeg + cooldownSeg) % DIA_SEG);

  const diasExtra = Math.round((medianocheDe(respawnMs) - hoy0) / DIA_MS);
  const faltaSeg = Math.round((respawnMs - ahoraMs) / 1000);

  return { muerteMs, respawnMs, hms, diasExtra, faltaSeg, listo: faltaSeg <= 0 };
}

// =====================================================
// Textos
// =====================================================

/** "hoy" / "mañana" / "ayer" / "en N días" relativo al día del reloj. */
export function etiquetaDiaBoss(diasExtra: number): string {
  if (diasExtra < 0) return diasExtra === -1 ? "ayer" : `hace ${-diasExtra} días`;
  return etiquetaDia(diasExtra);
}

/** "Faltan 7 h 12 min" / "Respawneó hace 23 min 10 s". */
export function textoFalta(r: RespawnBoss): string {
  if (r.listo) {
    const hace = -r.faltaSeg;
    return hace < 5 ? "Respawneando ahora" : `Respawneó hace ${formatDuracion(hace)}`;
  }
  return `Faltan ${formatDuracion(r.faltaSeg)}`;
}

/** Fecha corta "21/08" del respawn, para el mensaje compartido. */
function fechaCorta(ms: number): string {
  const d = new Date(ms);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
}

/** Texto listo para pegar en el chat de la guild. */
export function mensajeBoss(boss: BossConfig, r: RespawnBoss): string {
  const dia = r.diasExtra !== 0 ? ` ${etiquetaDiaBoss(r.diasExtra)} (${fechaCorta(r.respawnMs)})` : "";
  const falta = r.listo ? "" : ` · ${textoFalta(r).toLowerCase()}`;
  return `${boss.icono} ${boss.nombre} respawnea a las ${r.hms} hora servidor${dia}${falta}`;
}
