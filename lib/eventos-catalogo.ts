/**
 * Catálogo de eventos, invasiones y bosses con horario — datos, sin cálculo.
 *
 * FUENTE PRINCIPAL (28/08/2026): la planilla del admin del server ("Horarios
 * Boss", última columna = esquema vigente), VALIDADA contra la tanda de
 * capturas de las 12:51 del 28/08 — los 13 countdowns visibles caen exactos,
 * más White Wizard Online (arrancó 12:30) y Golden DS Online (12:35).
 *
 * ⚠ El calendario se REBALANCEÓ el 28/08 a la mañana (entre las 04:51 y las
 * 12:51): las capturas anteriores a ese mediodía corresponden al esquema viejo
 * y NO sirven para validar este catálogo (ej.: Battle 14:45 en la madrugada
 * vs 10:45 en el esquema nuevo). El server usa LISTAS de horarios, no
 * períodos uniformes (Hydra "cada 4" resultó tener un agujero en las 04:00).
 *
 * Lo que la planilla NO lista (Lotería, Golden DS, Illusion Temple, Pregunta
 * Seria, los semanales) sigue saliendo de nuestras capturas y queda con la
 * marca "±" cuando puede estar incompleto.
 *
 * NO están acá (a propósito):
 *   - Gaion: no tiene horario fijo (cooldown desde que TERMINA, duración desconocida).
 *   - Kundun y Cryonox: respawn desde la muerte, dato privado de quien lo mató.
 *   Esos viven en /herramientas/gaion, /herramientas/bosses y la zona de miembros.
 *
 * El `tier` es el DEFAULT del catálogo; en la Tanda B lo pisa `eventos_config`
 * desde el admin (DECISIONES §11).
 */

export type TipoEvento = "boss" | "evento" | "invasion";
/** 3 = el más importante (así lo habla la guild), 1 = el menos. */
export type Tier = 3 | 2 | 1;

export const TIER_LABEL: Record<Tier, string> = { 3: "Tier 3", 2: "Tier 2", 1: "Tier 1" };

/** Santi (29/08): "todo tiene una duración de 20 min". Es el default;
 *  `duracionMin` en el evento (o desde el admin) lo pisa para las excepciones
 *  conocidas: Golden Invasion ~52 · White Wizard ~22 · Castle Siege y Rey del Mu 60. */
export const DURACION_DEFAULT_MIN = 20;

export function duracionMinDe(ev: EventoCatalogo): number {
  return ev.duracionMin ?? DURACION_DEFAULT_MIN;
}

export const DIAS_SEMANA = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
] as const;

/** Una ocurrencia fija de la semana: día (0 = domingo … 6 = sábado) + hora servidor. */
export interface OcurrenciaSemanal {
  dia: number;
  horaSeg: number;
}

export type ReglaHorario =
  | {
      clase: "lista_diaria";
      /** Ocurrencias del día en segundos (hora servidor), ordenadas. */
      horasSeg: number[];
      /** true = lista completa (planilla del admin o período revalidado). */
      listaCompleta: boolean;
    }
  | {
      clase: "semanal";
      ocurrencias: OcurrenciaSemanal[];
      /** false = puede haber más días/horas que todavía no relevamos. */
      listaCompleta: boolean;
    };

export interface EventoCatalogo {
  id: string;
  nombre: string;
  tipo: TipoEvento;
  /** Peso por defecto; el admin lo pisa desde el tab Eventos. */
  tier: Tier;
  /** ¿Tiene "Me apunto" en la timeline de miembros? Default: tier 3 y 2 sí. */
  seApunta?: boolean;
  regla: ReglaHorario;
  mapa?: string;
  /** Números tipo "210,030" de la web del server. Parecen coordenadas (Q7). */
  coords?: string;
  requisito?: string;
  drop?: string;
  descripcion?: string;
  /** Minutos que dura SI difiere del default de 20 (DURACION_DEFAULT_MIN). */
  duracionMin?: number;
  /** Aclaración visible en la tarjeta (horarios sin confirmar, dudas abiertas). */
  nota?: string;
}

// =====================================================
// Helpers para armar las listas (solo se usan acá)
// =====================================================

/** "HH:MM" → segundos del día. */
function h(hhmm: string): number {
  const [hh, mm] = hhmm.split(":").map(Number);
  return hh * 3600 + mm * 60;
}

/** Lista completa de un período confirmado: cada `periodoHs` horas a los `anclaMin`. */
function cada(periodoHs: number, anclaMin: number): number[] {
  const out: number[] = [];
  for (let hh = 0; hh < 24; hh += periodoHs) out.push(hh * 3600 + anclaMin * 60);
  return out;
}

const lista = (completa: boolean, ...hhmm: string[]): ReglaHorario => ({
  clase: "lista_diaria",
  horasSeg: hhmm.map(h).sort((a, b) => a - b),
  listaCompleta: completa,
});

/** Lista completa según la planilla del admin. */
const planilla = (...hhmm: string[]) => lista(true, ...hhmm);
/** Lista parcial: puede haber horarios sin relevar (marca "±"). */
const parcial = (...hhmm: string[]) => lista(false, ...hhmm);

const cadaLista = (completa: boolean, periodoHs: number, anclaMin: number): ReglaHorario => ({
  clase: "lista_diaria",
  horasSeg: cada(periodoHs, anclaMin),
  listaCompleta: completa,
});

// =====================================================
// El catálogo (al 28/08/2026, GUIA v1.4)
// =====================================================

export const EVENTOS_CATALOGO: EventoCatalogo[] = [
  // ---------- Bosses con spawn fijo (§2) ----------
  {
    id: "erohim",
    nombre: "Erohim",
    tipo: "boss",
    tier: 3,
    regla: planilla("09:00", "15:00", "21:00"),
    mapa: "Arena Común",
    drop: "Items s3 / 380 / 400",
  },
  {
    id: "medusa",
    nombre: "Medusa",
    tipo: "boss",
    tier: 3,
    regla: planilla("02:00", "11:00", "17:00", "23:00"),
    mapa: "Devias",
    drop: "Items s3 / 380 / 400",
  },
  {
    id: "dark_sorcer",
    nombre: "Dark Sorcer",
    tipo: "boss",
    tier: 2,
    regla: planilla("01:00", "13:00", "19:00"),
    mapa: "Arena VIP",
    requisito: "Ser VIP",
    drop: "Items s3 / 380 / 400",
  },
  {
    id: "hydra",
    nombre: "Hydra",
    tipo: "boss",
    tier: 2,
    regla: planilla("00:00", "08:00", "12:00", "16:00", "20:00"),
    descripcion: "Son varias por spawn.",
    nota: "No hay a las 04:00.",
  },
  {
    id: "ice_queen",
    nombre: "Ice Queen",
    tipo: "boss",
    tier: 2,
    regla: {
      clase: "semanal",
      ocurrencias: [
        { dia: 1, horaSeg: h("10:30") }, // lunes (captura 30/08: 19:49:11 desde dom 14:40)
        { dia: 3, horaSeg: h("23:30") }, // miércoles
        { dia: 5, horaSeg: h("18:30") }, // viernes
        { dia: 6, horaSeg: h("23:30") }, // sábado (capturas 29/08)
      ],
      listaCompleta: false,
    },
    mapa: "Lacleon",
    drop: "Tricolor · Ring Wheel",
    nota: "Martes y jueves sin relevar; domingo no tiene.",
  },

  // ---------- Eventos (§3) ----------
  {
    id: "blood_castle",
    nombre: "Blood Castle",
    tipo: "evento",
    tier: 2,
    regla: planilla("01:45", "05:45", "09:45", "13:45", "17:45", "21:45"),
    mapa: "Devias",
    coords: "210,030",
    drop: "Cajas Kundun",
    descripcion:
      "Castillo lleno de monstruos: eliminar hordas, destruir la puerta, cruzar el puente y romper la estatua.",
  },
  {
    id: "devil_square",
    nombre: "Devil Square",
    tipo: "evento",
    tier: 2,
    regla: cadaLista(true, 4, 30),
    mapa: "Noria",
    coords: "171,104",
    drop: "Cajas Kundun",
    descripcion:
      "Supervivencia hasta 10 jugadores, oleadas cada vez más fuertes; gana el que más puntos hace.",
  },
  {
    id: "chaos_castle",
    nombre: "Chaos Castle",
    tipo: "evento",
    tier: 2,
    regla: planilla("03:30", "07:30", "11:30", "15:30", "19:30", "23:30"),
    mapa: "Lorencia Bar",
    drop: "Joyas · Sphere",
    descripcion:
      "PVP con skin igual para todos, monstruos mezclados y trampas que empujan afuera. Último en pie gana.",
  },
  {
    id: "pandora",
    nombre: "Pandora",
    tipo: "evento",
    tier: 2,
    regla: planilla("01:15", "11:15", "22:15"),
    mapa: "Coliseum",
    coords: "093,240",
    drop: "Joyas · Cajas Kundun · Sphere",
    descripcion:
      "Capturar el baúl que te convierte en «El Maldecido»; el que termina siéndolo gana.",
  },
  {
    id: "event_drop",
    nombre: "Event Drop",
    tipo: "evento",
    tier: 1,
    regla: cadaLista(true, 4, 45),
    mapa: "Lorencia",
    coords: "145,136",
    drop: "Joyas · Cajas Kundun",
    descripcion: "Entre el ring y las rejas se dropean joyas y cajas Kundun automáticamente.",
  },
  {
    id: "loteria",
    nombre: "Lotería Online",
    tipo: "evento",
    tier: 1,
    regla: cadaLista(false, 2, 45),
    mapa: "Lorencia",
    drop: "Joyas",
    descripcion:
      "Ir a Lorencia antes de que terminen los 5 minutos del anuncio; gana un jugador al azar.",
  },
  {
    id: "illusion_temple",
    nombre: "Illusion Temple",
    tipo: "evento",
    tier: 1,
    regla: parcial("13:40", "21:40"),
  },
  {
    id: "pregunta_seria",
    nombre: "Pregunta Seria",
    tipo: "evento",
    tier: 1,
    regla: parcial("00:15", "06:15", "15:15", "18:15", "21:15"),
    nota: "Compatible con «cada 3 hs a las :15»; faltan ver 03:15, 09:15 y 12:15.",
  },
  {
    id: "battle_royale",
    nombre: "Battle Royale",
    tipo: "evento",
    tier: 1,
    regla: planilla("02:45", "10:45", "14:45", "22:45"),
  },
  {
    id: "golden_ds",
    nombre: "Golden Devil Square",
    tipo: "evento",
    tier: 1,
    regla: cadaLista(false, 4, 35),
  },
  {
    id: "rey_del_mu",
    nombre: "Rey del Mu",
    tipo: "evento",
    tier: 3,
    regla: {
      clase: "semanal",
      ocurrencias: [
        { dia: 2, horaSeg: h("21:00") }, // martes
        { dia: 4, horaSeg: h("21:00") }, // jueves
      ],
      listaCompleta: true,
    },
    duracionMin: 60,
    descripcion: "PvP, de 21 a 22. Sin inscripción.",
    nota: "El countdown del cliente marcó 22:00; puede apuntar al final.",
  },
  {
    id: "castle_siege",
    nombre: "Castle Siege",
    tipo: "evento",
    tier: 3,
    regla: {
      clase: "semanal",
      ocurrencias: [{ dia: 0, horaSeg: h("21:00") }], // domingo
      listaCompleta: true,
    },
    mapa: "Castillo",
    duracionMin: 60,
    descripcion: "Guerra de castillo, de 21 a 22.",
  },

  // ---------- Invasiones (§4) ----------
  {
    id: "red_dragon",
    nombre: "Red Dragon",
    tipo: "invasion",
    tier: 2,
    regla: planilla("03:00", "05:00", "10:00", "14:00", "18:00", "22:00"),
    mapa: "Lorencia / Noria",
    drop: "Items s3 · Pendientes · Anillos · ACC",
    descripcion: "Aparecen 4.",
  },
  {
    id: "skeleton_king",
    nombre: "Skeleton King",
    tipo: "invasion",
    tier: 1,
    regla: planilla("02:30", "06:00", "08:30", "11:30", "14:30", "17:30", "20:30", "23:30"),
    mapa: "Lorencia / Noria / Devias",
    drop: "Anillos",
    descripcion: "Aparecen 3.",
  },
  {
    id: "white_wizard",
    nombre: "White Wizard",
    tipo: "invasion",
    tier: 1,
    regla: planilla("03:30", "07:00", "09:30", "12:30", "15:30", "18:30", "21:30"),
    mapa: "Lorencia / Noria / Devias",
    drop: "Pendientes",
    duracionMin: 22,
    descripcion: "Aparecen 3.",
    nota: "Dura al menos ~21 min.",
  },
  {
    id: "rabbits",
    nombre: "Lunar Rabbits",
    tipo: "invasion",
    tier: 1,
    regla: planilla("01:30", "08:15", "13:45", "17:15", "21:15", "23:45"),
    mapa: "Atlans",
    drop: "Joyas",
    descripcion: "Aparecen 20.",
  },
  {
    id: "pouch",
    nombre: "Pouch of Blessing",
    tipo: "invasion",
    tier: 2,
    regla: planilla("00:45", "02:45", "09:15", "12:15", "15:45", "18:45"),
    mapa: "Losttower",
    drop: "Joyas · Silver Key · Golden Key",
    descripcion: "Aparecen 20.",
  },
  {
    id: "fire_sphere",
    nombre: "Fire Sphere",
    tipo: "invasion",
    tier: 2,
    regla: planilla("01:45", "10:45", "14:45", "19:45", "22:45"),
    mapa: "Abyssal Maze",
    drop: "Sphere",
    descripcion: "Aparecen 10.",
  },
  {
    id: "golden_invasion",
    nombre: "Golden Invasion",
    tipo: "invasion",
    tier: 3,
    regla: planilla("00:30", "04:00", "10:30", "13:30", "16:30", "19:30", "22:30"),
    duracionMin: 52,
    nota: "Vista todavía activa ~51 min después de arrancar.",
  },
];

export function eventoPorId(id: string): EventoCatalogo | null {
  return EVENTOS_CATALOGO.find((e) => e.id === id) ?? null;
}

/** true si al evento le pueden faltar horarios por relevar (marca "±"). */
export function horariosParciales(ev: EventoCatalogo): boolean {
  return !ev.regla.listaCompleta;
}

/** ¿Se puede apuntar la guild a este evento? (override del admin o default por tier) */
export function esApuntable(ev: EventoCatalogo): boolean {
  return ev.seApunta ?? ev.tier >= 2;
}

export const TIPO_LABEL: Record<TipoEvento, string> = {
  boss: "Boss",
  evento: "Evento",
  invasion: "Invasión",
};
