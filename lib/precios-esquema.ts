/**
 * Esquema del panel de precios.
 * =============================
 *
 * Describe QUÉ coeficientes se pueden editar y cómo se muestra cada uno. El
 * panel del admin se dibuja solo a partir de esto: agregar un coeficiente
 * nuevo es sumarlo a `ConfigPrecios`, a los defaults y a esta lista — no hay
 * que tocar la UI.
 *
 * `path` es la ruta dentro de ConfigPrecios ("bases.s3.base"). Los helpers
 * `leerPath` / `escribirPath` la resuelven.
 */

import {
  CATEGORIAS_PRECIO,
  CATEGORIA_LABELS,
  type ConfigPrecios,
} from "./precios-config";

export type TipoCampo =
  | "wc"           // plata: entero, se muestra con separador de miles
  | "mult"         // multiplicador: ×3, ×2.1
  | "factor"       // factor 0..1: 0.25, 0.75
  | "entero"       // cantidad: sockets, niveles
  | "pct"          // porcentaje: 30 = 30%
  | "pct_opcional" // porcentaje que se puede dejar vacío (hereda del global)
  | "bool"
  | "texto"
  | "fecha";       // datetime-local en hora servidor

export interface CampoConfig {
  path: string;
  label: string;
  tipo: TipoCampo;
  ayuda?: string;
}

export interface GrupoConfig {
  id: string;
  titulo: string;
  icono: string;
  descripcion?: string;
  /** Cartel rojo: tocar esto es peligroso. */
  advertencia?: string;
  /**
   * true = los precios de esta categoría están guardados en la DB (snapshot),
   * así que cambiar el coeficiente NO mueve el stock ya cargado.
   */
  snapshot?: boolean;
  campos: CampoConfig[];
}

// =====================================================
// Lectura y escritura por path
// =====================================================

export function leerPath(cfg: ConfigPrecios, path: string): unknown {
  let actual: unknown = cfg;
  for (const parte of path.split(".")) {
    if (actual === null || typeof actual !== "object") return undefined;
    actual = (actual as Record<string, unknown>)[parte];
  }
  return actual;
}

/** Devuelve una copia de `cfg` con `path` seteado en `valor`. No muta. */
export function escribirPath(cfg: ConfigPrecios, path: string, valor: unknown): ConfigPrecios {
  const partes = path.split(".");
  const copia = structuredClone(cfg) as unknown as Record<string, unknown>;

  let actual: Record<string, unknown> = copia;
  for (let i = 0; i < partes.length - 1; i++) {
    const p = partes[i];
    if (typeof actual[p] !== "object" || actual[p] === null) actual[p] = {};
    actual = actual[p] as Record<string, unknown>;
  }

  const ultima = partes[partes.length - 1];
  if (valor === undefined) {
    delete actual[ultima];
  } else {
    actual[ultima] = valor;
  }
  return copia as unknown as ConfigPrecios;
}

// =====================================================
// Campos generados: un porcentaje por categoría
// =====================================================

function camposPorCategoria(prefijo: string, ayuda: string): CampoConfig[] {
  return CATEGORIAS_PRECIO.map((c) => ({
    path: `${prefijo}.${c}`,
    label: CATEGORIA_LABELS[c],
    tipo: "pct_opcional" as TipoCampo,
    ayuda,
  }));
}

// =====================================================
// LOS GRUPOS
// =====================================================

export const GRUPOS_PRECIOS: GrupoConfig[] = [
  {
    id: "promos",
    titulo: "Promos y márgenes",
    icono: "🔥",
    descripcion:
      "El hot sale no toca la base de datos: se aplica al mostrar el precio. Apagarlo devuelve todo a su valor original al instante. El ajuste de compra baja lo que le pagás al jugador SIN mover el precio de venta.",
    campos: [
      { path: "hotSale.activo", label: "Hot sale prendido", tipo: "bool", ayuda: "Interruptor maestro: en NO no hay promo, pase lo que pase." },
      { path: "hotSale.etiqueta", label: "Texto del cartel", tipo: "texto", ayuda: "Aparece en las tarjetas y en el mensaje de WhatsApp." },
      { path: "hotSale.pctGlobal", label: "Descuento general", tipo: "pct", ayuda: "30 = 30% off en todo el catálogo." },
      { path: "hotSale.desde", label: "Arranca", tipo: "fecha", ayuda: "Hora del servidor. Vacío = arranca ya." },
      { path: "hotSale.hasta", label: "Termina", tipo: "fecha", ayuda: "Hora del servidor. Vacío = no se apaga solo." },
      ...camposPorCategoria(
        "hotSale.porCategoria",
        "Vacío = usa el descuento general. 0 = esta categoría queda afuera de la promo."
      ),
    ],
  },
  {
    id: "compra",
    titulo: "Ajuste de compra",
    icono: "💸",
    descripcion:
      "Cuánto más (o menos) pagás por lo que te traen. −20 significa que pagás un 20% menos que lo que dice la fórmula. El precio de venta al público NO se mueve: sube tu margen.",
    campos: [
      { path: "ajusteCompra.globalPct", label: "Ajuste general", tipo: "pct", ayuda: "Negativo = pagás menos. 0 = precio de fórmula." },
      ...camposPorCategoria("ajusteCompra.porCategoria", "Vacío = usa el ajuste general."),
      { path: "ajusteCompra.porTipo.s3", label: "Solo tipo s3", tipo: "pct_opcional", ayuda: "Gana sobre el ajuste por categoría." },
      { path: "ajusteCompra.porTipo.380", label: "Solo tipo 380", tipo: "pct_opcional", ayuda: "Gana sobre el ajuste por categoría." },
      { path: "ajusteCompra.porTipo.400", label: "Solo tipo 400", tipo: "pct_opcional", ayuda: "Gana sobre el ajuste por categoría." },
    ],
  },
  {
    id: "bases",
    titulo: "Bases por tipo",
    icono: "📐",
    snapshot: true,
    descripcion:
      "El precio de un item entre nivel 0 y 9 es la base; a +15 es el máximo; entre 10 y 14 se interpola. Armaduras, armas y escudos parten de acá.",
    campos: [
      { path: "bases.s3.base", label: "s3 · niveles 0-9", tipo: "wc" },
      { path: "bases.s3.max", label: "s3 · nivel 15", tipo: "wc" },
      { path: "bases.t380.base", label: "380 · niveles 0-9", tipo: "wc" },
      { path: "bases.t380.max", label: "380 · nivel 15", tipo: "wc" },
      { path: "bases.t400.base", label: "400 · niveles 0-9", tipo: "wc" },
      { path: "bases.t400.max", label: "400 · nivel 15", tipo: "wc" },
      { path: "bases.escudo.base", label: "Escudo · niveles 0-9", tipo: "wc" },
      { path: "bases.escudo.max", label: "Escudo · nivel 15", tipo: "wc" },
    ],
  },
  {
    id: "modificadores",
    titulo: "Modificadores",
    icono: "⚙️",
    snapshot: true,
    descripcion: "Penalidades, markups y lo que suma cada socket.",
    campos: [
      { path: "modificadores.sinLuck", label: "Sin luck", tipo: "factor", ayuda: "0.25 = vale un cuarto." },
      { path: "modificadores.sinSkill", label: "Sin skill", tipo: "factor" },
      { path: "modificadores.markupArma", label: "Markup de armas", tipo: "mult" },
      { path: "modificadores.markupEscudo", label: "Markup de escudos", tipo: "mult" },
      { path: "modificadores.sinTercera400", label: "400 sin tercera opción", tipo: "factor" },
      { path: "modificadores.socketArmadura", label: "Socket de armadura", tipo: "wc", ayuda: "WC que suma cada socket, al final." },
      { path: "modificadores.socketArma", label: "Socket de arma", tipo: "wc" },
      { path: "modificadores.socketEscudo", label: "Socket de escudo", tipo: "wc" },
      { path: "modificadores.socketsMax", label: "Sockets que suman", tipo: "entero", ayuda: "Del cuarto en adelante no pagan más." },
    ],
  },
  {
    id: "venta",
    titulo: "Multiplicadores de venta",
    icono: "🏷️",
    snapshot: true,
    descripcion:
      "Cuántas veces el precio de referencia se cobra al cliente. Se aplican sobre la fórmula, nunca sobre lo que pagaste: si negociás un item más barato, igual se vende al mismo precio.",
    campos: [
      { path: "multVenta.armaduraArma.s3", label: "Armadura y arma s3", tipo: "mult" },
      { path: "multVenta.armaduraArma.380", label: "Armadura y arma 380", tipo: "mult" },
      { path: "multVenta.armaduraArma.400", label: "Armadura y arma 400", tipo: "mult" },
      { path: "multVenta.escudo", label: "Escudos", tipo: "mult", ayuda: "Más alto porque son escasos." },
      { path: "multVenta.ala", label: "Alas", tipo: "mult" },
      { path: "multVenta.joya", label: "Joyería", tipo: "mult" },
      { path: "multVenta.gema", label: "Gemas y otros", tipo: "mult" },
      { path: "multVenta.jewelRegular", label: "Jewels regulares", tipo: "mult" },
      { path: "multVenta.jewelEspecial", label: "Jewels especiales", tipo: "mult" },
      { path: "multVenta.seed", label: "Seeds", tipo: "mult" },
      { path: "multVenta.seedPenta", label: "Penta (contenedor)", tipo: "mult" },
    ],
  },
  {
    id: "alas",
    titulo: "Alas",
    icono: "🪽",
    snapshot: true,
    descripcion: "No tienen tipo: el precio sale de cuántas opciones tienen y si traen luck.",
    campos: [
      { path: "alas.tresConLuck.base", label: "3 opciones con luck · 0-9", tipo: "wc" },
      { path: "alas.tresConLuck.max", label: "3 opciones con luck · +15", tipo: "wc" },
      { path: "alas.tresSinLuck.base", label: "3 opciones sin luck · 0-9", tipo: "wc" },
      { path: "alas.tresSinLuck.max", label: "3 opciones sin luck · +15", tipo: "wc" },
      { path: "alas.dosConLuck.base", label: "2 opciones con luck · 0-9", tipo: "wc" },
      { path: "alas.dosConLuck.max", label: "2 opciones con luck · +15", tipo: "wc" },
      { path: "alas.unaConLuck.base", label: "1 opción con luck · 0-9", tipo: "wc" },
      { path: "alas.unaConLuck.max", label: "1 opción con luck · +15", tipo: "wc" },
    ],
  },
  {
    id: "jewels",
    titulo: "Jewels",
    icono: "💎",
    descripcion:
      "Precio de COMPRA. Las regulares se compran por bundle; las especiales, por unidad. El catálogo las calcula al vuelo: un cambio acá se ve al instante.",
    campos: [
      { path: "jewels.precios.chaos", label: "Chaos (bundle)", tipo: "wc" },
      { path: "jewels.precios.creation", label: "Creation (bundle)", tipo: "wc" },
      { path: "jewels.precios.soul", label: "Soul (bundle)", tipo: "wc" },
      { path: "jewels.precios.bless", label: "Bless (bundle)", tipo: "wc" },
      { path: "jewels.precios.harmony", label: "Harmony (bundle)", tipo: "wc" },
      { path: "jewels.precios.life", label: "Life (bundle)", tipo: "wc" },
      { path: "jewels.precios.socket", label: "Socket (unidad)", tipo: "wc" },
      { path: "jewels.precios.luck_jewel", label: "Luck (unidad)", tipo: "wc" },
      { path: "jewels.precios.skill_jewel", label: "Skill (unidad)", tipo: "wc" },
      { path: "jewels.precios.additional", label: "Additional (unidad)", tipo: "wc" },
      { path: "jewels.bundle", label: "Jewels por bundle", tipo: "entero" },
    ],
  },
  {
    id: "seeds",
    titulo: "Seeds",
    icono: "🌱",
    descripcion: "Precio de COMPRA. Se calculan al vuelo: un cambio se ve al instante en el catálogo.",
    campos: [
      { path: "seeds.maxLife", label: "Max Life", tipo: "wc" },
      { path: "seeds.maxLifePenta", label: "Max Life ensamblada", tipo: "wc" },
      { path: "seeds.dmgReduction", label: "Damage Reduction", tipo: "wc" },
      { path: "seeds.dmgReductionPenta", label: "Damage Reduction ensamblada", tipo: "wc" },
      { path: "seeds.penta", label: "Penta (contenedor)", tipo: "wc" },
      { path: "seeds.excDmgRate", label: "Exc Dmg Rate", tipo: "wc" },
      { path: "seeds.critDmgRate", label: "Crit Dmg Rate", tipo: "wc" },
      { path: "seeds.ventaFijaExcCrit", label: "Venta de Exc/Crit", tipo: "wc", ayuda: "Precio fijo: no usa multiplicador." },
    ],
  },
  {
    id: "gemas",
    titulo: "Gemas y otros",
    icono: "🔮",
    descripcion: "Precio de COMPRA. Se calculan al vuelo: un cambio se ve al instante en el catálogo.",
    campos: [
      { path: "gemas.gema_item_s3", label: "Gema item S3", tipo: "wc" },
      { path: "gemas.gema_alas_s3", label: "Gema alas S3", tipo: "wc" },
      { path: "gemas.gema_seed", label: "Gema Seed", tipo: "wc" },
      { path: "gemas.gema_item_380", label: "Gema item 380", tipo: "wc" },
      { path: "gemas.gema_item_400", label: "Gema item 400", tipo: "wc" },
      { path: "gemas.gema_gp", label: "Gema GP", tipo: "wc" },
      { path: "gemas.ring_wheel", label: "Ring Wheel", tipo: "wc" },
      { path: "gemas.item_acc", label: "Item ACC", tipo: "wc" },
      { path: "gemas.purple_box", label: "Purple Box", tipo: "wc" },
      { path: "gemas.chaos_box", label: "Chaos Box", tipo: "wc" },
      { path: "gemas.kundun_box_5", label: "Kundun Box +5", tipo: "wc" },
      { path: "gemas.kundun_box_4", label: "Kundun Box +4", tipo: "wc" },
    ],
  },
  {
    id: "joyeria",
    titulo: "Joyería",
    icono: "💍",
    snapshot: true,
    descripcion:
      "Anillos y pendientes. El precio se mueve entre un piso y un techo según el % de Life Recovery y el nivel.",
    campos: [
      { path: "joyeria.piso", label: "Piso (nivel 0, 1%)", tipo: "wc" },
      { path: "joyeria.techo", label: "Techo (nivel 15, 7%)", tipo: "wc" },
      { path: "joyeria.ajusteGlobal", label: "Ajuste general", tipo: "factor", ayuda: "0.75 = −25% sobre todo." },
      { path: "joyeria.variantesBaratas", label: "Variantes baratas", tipo: "factor", ayuda: "0.7 = −30%. Anillos poison/fire/magic y pendientes water/fire/ability." },
    ],
  },
  {
    id: "avanzado",
    titulo: "Avanzado",
    icono: "⚠️",
    snapshot: true,
    advertencia:
      "Esto cambia la FORMA de las curvas, no su altura: un valor mal puesto deforma todos los precios a la vez. Mirá la vista previa antes de guardar.",
    descripcion: "Cómo se reparte el precio entre nivel y opciones, y qué se compra y qué no.",
    campos: [
      { path: "curva.divisorInterpolacion", label: "Divisor de niveles 10-14", tipo: "entero", ayuda: "6 = un sexto del salto por nivel desde el 10." },
      { path: "joyeria.expPct", label: "Joyería · curva del %", tipo: "factor", ayuda: "Más alto = el % bajo vale menos." },
      { path: "joyeria.pesoPct", label: "Joyería · peso del %", tipo: "factor" },
      { path: "joyeria.pesoNivel", label: "Joyería · peso del nivel", tipo: "factor" },
      { path: "joyeria.lineal", label: "Joyería · componente lineal", tipo: "factor" },
      { path: "joyeria.salto7", label: "Joyería · salto al +7", tipo: "factor" },
      { path: "joyeria.salto15", label: "Joyería · salto al +15", tipo: "factor" },

      { path: "requisitos.armadura.exigeHpDdRef", label: "Armadura: exigir HP+DD+REF", tipo: "bool" },
      { path: "requisitos.armadura.s3ExigeLuck", label: "Armadura s3: exigir luck", tipo: "bool" },
      { path: "requisitos.armadura.t380ExigeLuck", label: "Armadura 380: exigir luck", tipo: "bool" },
      { path: "requisitos.armadura.t400MinSockets", label: "Armadura 400: sockets mínimos", tipo: "entero", ayuda: "0 = se compran sin sockets." },

      { path: "requisitos.arma.exigeExeRate", label: "Arma: exigir exe rate", tipo: "bool" },
      { path: "requisitos.arma.exigeDmg2", label: "Arma: exigir dmg 2%", tipo: "bool" },
      { path: "requisitos.arma.s3_380ExigeTercera", label: "Arma s3/380: exigir tercera opción", tipo: "bool" },
      { path: "requisitos.arma.s3_380ExigeLuckSkill", label: "Arma s3/380: exigir luck y skill", tipo: "bool" },
      { path: "requisitos.arma.t400SinTerceraExigeLuckSkill", label: "Arma 400 sin tercera: exigir luck y skill", tipo: "bool" },
      { path: "requisitos.arma.t400SinTerceraMinSockets", label: "Arma 400 sin tercera: sockets mínimos", tipo: "entero" },

      { path: "requisitos.escudo.exigeHpDdRef", label: "Escudo: exigir HP+DD+REF", tipo: "bool" },
      { path: "requisitos.escudo.minSockets", label: "Escudo: sockets mínimos", tipo: "entero" },

      { path: "requisitos.joya.exigeLife", label: "Joya: exigir Life Recovery", tipo: "bool" },
      { path: "requisitos.joya.lifeMin", label: "Joya: Life Recovery mínimo", tipo: "entero" },
      { path: "requisitos.joya.lifeMax", label: "Joya: Life Recovery máximo", tipo: "entero" },
      { path: "requisitos.joya.anilloExigeHpDdRef", label: "Anillo: exigir HP+DD+REF", tipo: "bool" },
      { path: "requisitos.joya.pendienteExigeExeRateDmg2", label: "Pendiente: exigir exe rate y dmg 2%", tipo: "bool" },
      { path: "requisitos.joya.pendienteExigeTercera", label: "Pendiente: exigir tercera opción", tipo: "bool" },

      { path: "requisitos.alas.minOpciones", label: "Alas: opciones mínimas", tipo: "entero" },
      { path: "requisitos.alas.exigeLuckConMenosDe3", label: "Alas: con menos de 3 opciones exigir luck", tipo: "bool" },
      { path: "requisitos.alas.compraTresSinLuck", label: "Alas: comprar 3 opciones sin luck", tipo: "bool" },
    ],
  },
];
