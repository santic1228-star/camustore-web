/**
 * Herramientas — la lista única.
 *
 * La leen tres lugares: el hub (/herramientas), la sección de la home y el
 * desplegable de la Navbar. Para sumar una calculadora nueva alcanza con
 * agregar una entrada acá (y crear su página en app/herramientas/<slug>/).
 */

export interface Herramienta {
  slug: string;
  /** Ruta. Sin href = todavía no existe ("Pronto"). */
  href?: string;
  icono: string;
  /** Título largo (hub y home). */
  titulo: string;
  /** Título corto (Navbar). Si falta, se usa el largo. */
  tituloCorto?: string;
  texto: string;
  estado: "activa" | "pronto";
}

export const HERRAMIENTAS: Herramienta[] = [
  {
    slug: "gaion",
    href: "/herramientas/gaion",
    icono: "⏳",
    titulo: "Gaion time calculator",
    tituloCorto: "Gaion",
    texto: "Cargás la hora del servidor y el standby de la captura, y te dice a qué hora abre el próximo.",
    estado: "activa",
  },
  {
    slug: "bosses",
    href: "/herramientas/bosses",
    icono: "💀",
    titulo: "Kundun & Cryonox",
    texto: "Cargás la hora en que murió el boss y te dice a qué hora respawnea, con cuenta regresiva.",
    estado: "activa",
  },
  {
    slug: "timeline",
    href: "/herramientas/timeline",
    icono: "🗓",
    titulo: "Timeline de eventos",
    tituloCorto: "Timeline",
    texto:
      "Las próximas 24 hs del server: eventos, invasiones y bosses con horario, mapa y drop, en hora servidor.",
    estado: "activa",
  },
];

/** Solo las que ya se pueden abrir (home y Navbar). */
export const HERRAMIENTAS_ACTIVAS = HERRAMIENTAS.filter(
  (h): h is Herramienta & { href: string } => h.estado === "activa" && !!h.href,
);
