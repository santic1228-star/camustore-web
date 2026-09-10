/**
 * Ítems de la timeline zig-zag — LÓGICA PURA (testeable, sin React).
 *
 * Unifica las ocurrencias del calendario con los momentos privados de la
 * guild (Gaion / Kundun / Cryonox, desde los registros vigentes) en una sola
 * lista ordenada, y calcula la geometría del boceto de Santi (28/08):
 *   - lado: las ramas alternan derecha/izquierda por orden (la primera a la derecha);
 *   - espaciado vertical proporcional al tiempo real, CON TOPE (los huecos de
 *     la madrugada no hacen un chorizo infinito).
 */

import type { Ocurrencia } from "./itinerario";
import {
  EVENTOS as EVENTOS_REGISTRO,
  vistaDeRegistro,
  hmServidor,
} from "./registros";
import type { EventoRegistroRow, TipoEventoRegistro } from "./database.types";
import { guildDe, type Guild } from "./guilds";

// =====================================================
// Ítems
// =====================================================

export type ItemTimeline =
  | { clase: "calendario"; oc: Ocurrencia; clave: string }
  | {
      clase: "privado";
      tipo: TipoEventoRegistro;
      nombre: string;
      icono: string;
      inicioMs: number;
      hm: string;
      diasExtra: number;
      /** "abre a las" / "respawnea a las". */
      texto: string;
      clave: string;
      /** Id del registro vigente (para apuntarse y buscar sus apuntados). */
      registroId: string;
      /** Guild dueña del registro (alianza, 10/09). */
      guild: Guild;
      /** true si el registro está marcado "Compartir con la alianza". */
      compartido: boolean;
      /** true si es de LA OTRA guild (llegó porque lo compartieron). */
      ajeno: boolean;
    };

export function inicioDe(it: ItemTimeline): number {
  return it.clase === "calendario" ? it.oc.inicioMs : it.inicioMs;
}

export function enCursoDe(it: ItemTimeline): boolean {
  return it.clase === "calendario" && it.oc.enCurso;
}

export function diasExtraDe(it: ItemTimeline): number {
  return it.clase === "calendario" ? it.oc.diasExtra : it.diasExtra;
}

export function claveOcurrenciaTimeline(eventoId: string, inicioMs: number): string {
  return `${eventoId}@${inicioMs}`;
}

/** Ocurrencias del calendario → ítems. */
export function itemsDeCalendario(ocurrencias: Ocurrencia[]): ItemTimeline[] {
  return ocurrencias.map((oc) => ({
    clase: "calendario",
    oc,
    clave: claveOcurrenciaTimeline(oc.evento.id, oc.inicioMs),
  }));
}

/** Clave de un privado en la timeline: `priv-<tipo>` (propio) o `priv-<tipo>-<guild>` (ajeno). */
export function clavePrivado(tipo: TipoEventoRegistro, ajeno: boolean, guild: Guild): string {
  return ajeno ? `priv-${tipo}-${guild}` : `priv-${tipo}`;
}

/**
 * Suma los privados vigentes que caigan en la ventana y devuelve todo
 * ordenado por inicio. Los privados vencidos o "desconocido" (Gaion sin
 * captura fresca) no entran.
 *
 * Alianza (10/09): `compartidos` son los vigentes de LA OTRA guild marcados
 * "Compartir con la alianza". Entran igual que los propios, con `ajeno = true`,
 * y conviven con el propio del mismo tipo si lo hay (dos Gaion en la timeline,
 * cada uno con su distintivo).
 */
export function intercalarPrivados(
  items: ItemTimeline[],
  vigentes: Partial<Record<TipoEventoRegistro, EventoRegistroRow>>,
  ahoraMs: number,
  ventanaHs = 24,
  compartidos: Partial<Record<TipoEventoRegistro, EventoRegistroRow>> = {},
): ItemTimeline[] {
  const out = [...items];
  const fuentes: { regs: typeof vigentes; ajeno: boolean }[] = [
    { regs: vigentes, ajeno: false },
    { regs: compartidos, ajeno: true },
  ];
  for (const { regs, ajeno } of fuentes) {
    for (const cfg of EVENTOS_REGISTRO) {
      const reg = regs[cfg.tipo];
      if (!reg) continue;
      const v = vistaDeRegistro(cfg, reg, ahoraMs);
      if (v.desconocido || v.estado.vencido) continue;
      const ms = v.estado.resultadoMs;
      if (ms < ahoraMs - 5 * 60_000 || ms > ahoraMs + ventanaHs * 3_600_000) continue;
      const guild = guildDe(reg.guild);
      out.push({
        clase: "privado",
        tipo: cfg.tipo,
        nombre: cfg.nombre,
        icono: cfg.icono,
        inicioMs: ms,
        hm: hmServidor(ms),
        diasExtra: v.estado.diasExtra,
        texto: cfg.etiquetaResultado,
        clave: clavePrivado(cfg.tipo, ajeno, guild),
        registroId: reg.id,
        guild,
        compartido: reg.compartido_alianza === true,
        ajeno,
      });
    }
  }
  return out.sort((a, b) => inicioDe(a) - inicioDe(b));
}

// =====================================================
// Geometría del zig-zag
// =====================================================

/** Lado de la rama: la primera a la derecha (como el boceto) y alternando. */
export function ladoDe(indice: number): "der" | "izq" {
  return indice % 2 === 0 ? "der" : "izq";
}

export const GAP_MIN_PX = 14;
export const GAP_MAX_PX = 84;

/**
 * Separación vertical con el ítem anterior, proporcional a los minutos de
 * diferencia pero acotada [GAP_MIN_PX, GAP_MAX_PX]. El primer ítem mide
 * contra "ahora".
 */
export function gapPx(deltaSeg: number): number {
  const deltaMin = Math.max(0, deltaSeg) / 60;
  return Math.round(Math.min(GAP_MAX_PX, Math.max(GAP_MIN_PX, 10 + deltaMin * 1.1)));
}

/** Los gaps de toda la lista (uno por ítem, el primero contra `ahoraMs`). */
export function gapsDe(items: ItemTimeline[], ahoraMs: number): number[] {
  return items.map((it, i) => {
    const prev = i === 0 ? ahoraMs : inicioDe(items[i - 1]);
    return gapPx((inicioDe(it) - prev) / 1000);
  });
}
