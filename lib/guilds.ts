/**
 * Guilds (panel de la alianza, 10/09/2026).
 *
 * Decisión de Santi (10/09): UNA sola alianza, fija. No hay tabla de guilds:
 * cada miembro y cada registro llevan una columna `guild` con dos valores.
 * Si algún día hay más de una guild aliada, esto pasa a una tabla y este
 * archivo es el único lugar que cambia de forma.
 *
 * Reglas (DECISIONES §16):
 *   - Los registros de Gaion/Kundun/Cryonox son de la guild que los carga.
 *     Una guild NO ve los de la otra, salvo que el registro esté marcado
 *     "Compartir con la alianza": ahí aparece en la timeline de las dos.
 *   - Un horario compartido se puede ver Y apuntarse (es para pedir ayuda).
 *   - En los eventos públicos los apuntados se ven mezclados, con distintivo
 *     de guild.
 */

export type Guild = "propia" | "alianza";

export const GUILDS: readonly Guild[] = ["propia", "alianza"];

/**
 * Nombres para mostrar (reales desde el 14/09/2026, P12 cerrada): la guild
 * propia es FreakS y la aliada es NewLvl. Si alguna cambia de nombre, se
 * cambia ACÁ y se refleja en todos lados (admin, tarjetas, timeline).
 */
export const GUILD_LABEL: Record<Guild, string> = {
  propia: "FreakS",
  alianza: "NewLvl",
};

/** Etiqueta corta para badges (minúscula, una palabra). */
export const GUILD_TAG: Record<Guild, string> = {
  propia: "guild",
  alianza: "alianza",
};

export const GUILD_ICONO: Record<Guild, string> = {
  propia: "🛡",
  alianza: "🤝",
};

export function esGuild(v: unknown): v is Guild {
  return v === "propia" || v === "alianza";
}

/** La otra guild (para "compartido con…" / "compartido por…"). */
export function otraGuild(g: Guild): Guild {
  return g === "propia" ? "alianza" : "propia";
}

/** Normaliza lo que venga de la DB (null o basura → propia, el default histórico). */
export function guildDe(v: unknown): Guild {
  return esGuild(v) ? v : "propia";
}
