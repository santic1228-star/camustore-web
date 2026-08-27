/**
 * CONFIGURACIÓN DE PRECIOS — la biblia, editable desde el admin.
 * =============================================================
 *
 * Este módulo define TODOS los coeficientes que gobiernan los precios y sus
 * valores por defecto (que son, exactamente, los que estaban hardcodeados en
 * `lib/precios.ts` hasta el 24/08/2026).
 *
 * MODELO DE TRES NÚMEROS (DECISIONES §9):
 *   1. REFERENCIA — la fórmula pura sobre los atributos del item.
 *   2. COMPRA     — referencia × ajuste de compra (lo que le pagás al jugador).
 *   3. VENTA      — referencia × multiplicador (NUNCA se calcula desde compra).
 *
 * Gracias a eso, bajar lo que pagás no arrastra el precio de venta.
 *
 * El HOT SALE no vive acá adentro de las fórmulas: es una capa de
 * visualización que se aplica sobre el precio de venta ya calculado o ya
 * guardado en la DB. Ver `aplicarHotSale`.
 *
 * Sin DOM, sin Supabase, sin React. Puro y testeable.
 */

import { OFFSET_SERVIDOR_MS } from "./tiempo";

// =====================================================
// TIPOS DE DOMINIO
// (viven acá para que `precios.ts` los importe sin ciclo; `precios.ts` los
//  re-exporta, así los imports viejos `from "@/lib/precios"` siguen andando)
// =====================================================

export type TipoEquipo3 = "s3" | "380" | "400";

export type CategoriaPrecio =
  | "armadura" | "arma" | "escudo" | "ala"
  | "joya" | "jewel" | "seed" | "gema";

export const CATEGORIAS_PRECIO: CategoriaPrecio[] = [
  "armadura", "arma", "escudo", "ala", "joya", "jewel", "seed", "gema",
];

export const CATEGORIA_LABELS: Record<CategoriaPrecio, string> = {
  armadura: "Armaduras",
  arma: "Armas",
  escudo: "Escudos",
  ala: "Alas",
  joya: "Joyería",
  jewel: "Jewels",
  seed: "Seeds",
  gema: "Gemas y otros",
};

export type JewelTipo =
  | "chaos" | "creation" | "soul" | "bless" | "harmony" | "life"  // regulares
  | "socket" | "luck_jewel" | "skill_jewel" | "additional";       // especiales

export type SeedTipo =
  | "max_life" | "damage_reduction" | "penta" | "exc_dmg_rate" | "crit_dmg_rate";

export type GemaTipo =
  | "gema_item_s3" | "gema_alas_s3" | "gema_seed" | "gema_item_380" | "gema_item_400"
  | "gema_gp" | "ring_wheel" | "item_acc" | "purple_box" | "chaos_box"
  | "kundun_box_5" | "kundun_box_4";

export type TipoJoya = "anillo" | "pendiente";
export type NombreEscudo = "guardian" | "crimson_glory" | "salamander" | "cross";

/** Par base (niveles 0-9) / máximo (nivel 15). */
export interface RangoNivel {
  base: number;
  max: number;
}

// =====================================================
// LA INTERFAZ COMPLETA
// =====================================================

export interface ConfigPrecios {
  /** Bases de interpolación por tipo de item. */
  bases: {
    s3: RangoNivel;
    t380: RangoNivel;
    t400: RangoNivel;
    escudo: RangoNivel;
  };

  /** Penalidades, markups y bonus planos. */
  modificadores: {
    /** Factor cuando el item NO tiene luck (0.25 = vale un cuarto). */
    sinLuck: number;
    /** Factor cuando el item NO tiene skill. */
    sinSkill: number;
    /** Markup de armas (×1.5). */
    markupArma: number;
    /** Markup de escudos (×1.5, igual que armas). */
    markupEscudo: number;
    /** Factor de un arma 400 sin la tercera opción (×0.6). */
    sinTercera400: number;
    /** WC planos por socket en armaduras. */
    socketArmadura: number;
    /** WC planos por socket en armas. */
    socketArma: number;
    /** WC planos por socket en escudos. */
    socketEscudo: number;
    /** Tope de sockets que suman precio. */
    socketsMax: number;
  };

  /** Multiplicadores compra→venta. Se aplican sobre la REFERENCIA. */
  multVenta: {
    armaduraArma: Record<TipoEquipo3, number>;
    escudo: number;
    ala: number;
    joya: number;
    gema: number;
    jewelRegular: number;
    jewelEspecial: number;
    seed: number;
    /** Penta rompe la regla general de seeds. */
    seedPenta: number;
  };

  /** Alas: no tienen tipo; el precio depende de cuántas opciones y si hay luck. */
  alas: {
    tresConLuck: RangoNivel;
    tresSinLuck: RangoNivel;
    dosConLuck: RangoNivel;
    unaConLuck: RangoNivel;
  };

  jewels: {
    /** Precio de COMPRA: por bundle (regulares) o por unidad (especiales). */
    precios: Record<JewelTipo, number>;
    /** Cuántas jewels trae un bundle (solo informativo/labels). */
    bundle: number;
  };

  seeds: {
    maxLife: number;
    maxLifePenta: number;
    dmgReduction: number;
    dmgReductionPenta: number;
    penta: number;
    excDmgRate: number;
    critDmgRate: number;
    /** Venta fija de exc/crit dmg rate (rompe el multiplicador). */
    ventaFijaExcCrit: number;
  };

  gemas: Record<GemaTipo, number>;

  joyeria: {
    /** Piso del rango (nivel 0, 1%). */
    piso: number;
    /** Techo del rango (nivel 15, 7%). */
    techo: number;
    /** Ajuste global sobre el resultado (0.75 = −25%). */
    ajusteGlobal: number;
    /** Factor de las variantes baratas (0.7 = −30%). */
    variantesBaratas: number;
    /** Exponente de la curva del % de Life Recovery. */
    expPct: number;
    /** Cuánto del rango aporta el % (0.55 = 55%). */
    pesoPct: number;
    /** Cuánto del rango aporta el nivel (0.45 = 45%). */
    pesoNivel: number;
    /** Componente lineal del factor de nivel. */
    lineal: number;
    /** Salto extra al llegar a +7. */
    salto7: number;
    /** Salto extra al llegar a +15. */
    salto15: number;
  };

  /** Forma de la curva de interpolación entre nivel 9 y 15. */
  curva: {
    /** Divisor del salto (6 = un sexto por nivel desde el 10). */
    divisorInterpolacion: number;
  };

  /** QUÉ SE COMPRA Y QUÉ NO. Tocar con cuidado: apagan o encienden ventas. */
  requisitos: {
    armadura: {
      exigeHpDdRef: boolean;
      s3ExigeLuck: boolean;
      t380ExigeLuck: boolean;
      /** Mínimo de sockets para comprar una armadura 400. */
      t400MinSockets: number;
    };
    arma: {
      exigeExeRate: boolean;
      exigeDmg2: boolean;
      s3_380ExigeTercera: boolean;
      s3_380ExigeLuckSkill: boolean;
      t400SinTerceraExigeLuckSkill: boolean;
      t400SinTerceraMinSockets: number;
    };
    escudo: {
      exigeHpDdRef: boolean;
      minSockets: number;
    };
    joya: {
      exigeLife: boolean;
      lifeMin: number;
      lifeMax: number;
      anilloExigeHpDdRef: boolean;
      pendienteExigeExeRateDmg2: boolean;
      pendienteExigeTercera: boolean;
    };
    alas: {
      /** Mínimo de opciones para que se compren. */
      minOpciones: number;
      /** Con menos de 3 opciones, ¿exige luck? */
      exigeLuckConMenosDe3: boolean;
      /** Con 3 opciones, ¿se compran sin luck? */
      compraTresSinLuck: boolean;
    };
  };

  /**
   * AJUSTE DE COMPRA — baja (o sube) lo que le pagás al jugador SIN tocar el
   * precio de venta. Porcentaje: −20 significa "pagá un 20% menos".
   * Resolución de más específico a más general: tipo → categoría → global.
   * Se pisan, no se suman.
   */
  ajusteCompra: {
    globalPct: number;
    porCategoria: Partial<Record<CategoriaPrecio, number>>;
    porTipo: Partial<Record<TipoEquipo3, number>>;
  };

  /**
   * HOT SALE — descuento sobre el precio de VENTA al público.
   * Capa de visualización: no toca una sola fila de la DB.
   * Porcentaje positivo: 30 significa "30% off".
   */
  hotSale: {
    /** Interruptor maestro. En false no hay promo, pase lo que pase. */
    activo: boolean;
    /** ISO timestamptz. null = sin fecha de inicio (arranca ya). */
    desde: string | null;
    /** ISO timestamptz. null = sin fecha de fin (no se apaga solo). */
    hasta: string | null;
    pctGlobal: number;
    /** Pisa el global para esa categoría. 0 = esa categoría no entra en la promo. */
    porCategoria: Partial<Record<CategoriaPrecio, number>>;
    /** Texto del badge en las tarjetas. */
    etiqueta: string;
  };
}

// =====================================================
// DEFAULTS — exactamente los valores vigentes al 24/08/2026
// Si la tabla `config_precios` está vacía, la tienda funciona con esto.
// =====================================================

export const CONFIG_PRECIOS_DEFAULT: ConfigPrecios = {
  bases: {
    s3: { base: 500, max: 1500 },
    t380: { base: 800, max: 2400 },
    t400: { base: 1000, max: 3000 },
    escudo: { base: 1000, max: 3000 },
  },
  modificadores: {
    sinLuck: 0.25,
    sinSkill: 0.25,
    markupArma: 1.5,
    markupEscudo: 1.5,
    sinTercera400: 0.6,
    socketArmadura: 600,
    socketArma: 1200,
    socketEscudo: 1200,
    socketsMax: 3,
  },
  multVenta: {
    armaduraArma: { s3: 3, "380": 3, "400": 4 },
    escudo: 6,
    ala: 2.1,
    joya: 4,
    gema: 2,
    jewelRegular: 2,
    jewelEspecial: 2.5,
    seed: 3.5,
    seedPenta: 2.1,
  },
  alas: {
    tresConLuck: { base: 25000, max: 60000 },
    tresSinLuck: { base: 20000, max: 40000 },
    dosConLuck: { base: 10000, max: 16000 },
    unaConLuck: { base: 2000, max: 5000 },
  },
  jewels: {
    precios: {
      chaos: 200,
      creation: 250,
      soul: 1000,
      bless: 1000,
      harmony: 350,
      life: 250,
      socket: 8000,
      luck_jewel: 6000,
      skill_jewel: 6000,
      additional: 6000,
    },
    bundle: 30,
  },
  seeds: {
    maxLife: 35000,
    maxLifePenta: 40000,
    dmgReduction: 40000,
    dmgReductionPenta: 45000,
    penta: 5000,
    excDmgRate: 500,
    critDmgRate: 500,
    ventaFijaExcCrit: 2000,
  },
  gemas: {
    gema_item_s3: 5000,
    gema_alas_s3: 5000,
    gema_seed: 40000,
    gema_item_380: 4000,
    gema_item_400: 7000,
    gema_gp: 4000,
    ring_wheel: 5500,
    item_acc: 1000,
    purple_box: 1000,
    chaos_box: 800,
    kundun_box_5: 100,
    kundun_box_4: 80,
  },
  joyeria: {
    piso: 5000,
    techo: 30000,
    ajusteGlobal: 0.75,
    variantesBaratas: 0.7,
    expPct: 1.4,
    pesoPct: 0.55,
    pesoNivel: 0.45,
    lineal: 0.65,
    salto7: 0.15,
    salto15: 0.2,
  },
  curva: {
    divisorInterpolacion: 6,
  },
  requisitos: {
    armadura: {
      exigeHpDdRef: true,
      s3ExigeLuck: true,
      t380ExigeLuck: true,
      t400MinSockets: 2,
    },
    arma: {
      exigeExeRate: true,
      exigeDmg2: true,
      s3_380ExigeTercera: true,
      s3_380ExigeLuckSkill: true,
      t400SinTerceraExigeLuckSkill: true,
      t400SinTerceraMinSockets: 2,
    },
    escudo: {
      exigeHpDdRef: true,
      minSockets: 2,
    },
    joya: {
      exigeLife: true,
      lifeMin: 1,
      lifeMax: 7,
      anilloExigeHpDdRef: true,
      pendienteExigeExeRateDmg2: true,
      pendienteExigeTercera: true,
    },
    alas: {
      minOpciones: 1,
      exigeLuckConMenosDe3: true,
      compraTresSinLuck: true,
    },
  },
  ajusteCompra: {
    globalPct: 0,
    porCategoria: {},
    porTipo: {},
  },
  hotSale: {
    activo: false,
    desde: null,
    hasta: null,
    pctGlobal: 0,
    porCategoria: {},
    etiqueta: "HOT SALE",
  },
};

// =====================================================
// MERGE DEFENSIVO
// El JSONB de la DB puede venir de una versión anterior del panel (le falta
// un coeficiente que agregamos después). Completamos con los defaults en vez
// de romper: un precio faltante sería `NaN` en toda la tienda.
// =====================================================

function esObjetoPlano(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Merge profundo de `guardado` sobre `base`. Los valores de `guardado` ganan. */
export function fusionarConfig(base: ConfigPrecios, guardado: unknown): ConfigPrecios {
  if (!esObjetoPlano(guardado)) return base;

  function merge(b: unknown, g: unknown): unknown {
    if (!esObjetoPlano(b) || !esObjetoPlano(g)) {
      return g === undefined || g === null ? b : g;
    }
    const salida: Record<string, unknown> = { ...b };
    for (const clave of Object.keys(g)) {
      salida[clave] = clave in b ? merge(b[clave], g[clave]) : g[clave];
    }
    return salida;
  }

  return merge(base, guardado) as ConfigPrecios;
}

// =====================================================
// HOT SALE — resolución y aplicación
// =====================================================

export interface EstadoHotSale {
  /** ¿Hay promo corriendo AHORA? */
  vigente: boolean;
  /** Por qué no está vigente (para el cartel del admin). */
  motivo: "apagado" | "todavia_no" | "ya_termino" | "sin_descuento" | null;
  etiqueta: string;
}

/** ¿La ventana de fechas del hot sale incluye este momento? */
export function estadoHotSale(cfg: ConfigPrecios, ahoraMs: number): EstadoHotSale {
  const hs = cfg.hotSale;
  const etiqueta = hs.etiqueta || "HOT SALE";

  if (!hs.activo) return { vigente: false, motivo: "apagado", etiqueta };

  if (hs.desde) {
    const desdeMs = Date.parse(hs.desde);
    if (!Number.isNaN(desdeMs) && ahoraMs < desdeMs) {
      return { vigente: false, motivo: "todavia_no", etiqueta };
    }
  }
  if (hs.hasta) {
    const hastaMs = Date.parse(hs.hasta);
    if (!Number.isNaN(hastaMs) && ahoraMs > hastaMs) {
      return { vigente: false, motivo: "ya_termino", etiqueta };
    }
  }

  // ¿Algún porcentaje distinto de cero en algún lado?
  const hayAlgo =
    hs.pctGlobal > 0 ||
    Object.values(hs.porCategoria).some((p) => (p ?? 0) > 0);
  if (!hayAlgo) return { vigente: false, motivo: "sin_descuento", etiqueta };

  return { vigente: true, motivo: null, etiqueta };
}

/** Porcentaje de descuento que le toca a una categoría (0 si no hay promo). */
export function pctHotSale(
  cfg: ConfigPrecios,
  categoria: CategoriaPrecio,
  ahoraMs: number
): number {
  if (!estadoHotSale(cfg, ahoraMs).vigente) return 0;
  const especifico = cfg.hotSale.porCategoria[categoria];
  const pct = especifico !== undefined ? especifico : cfg.hotSale.pctGlobal;
  return Math.max(0, Math.min(100, pct));
}

export interface PrecioConPromo {
  /** Precio de lista (el de siempre). */
  original: number;
  /** Lo que efectivamente paga el cliente. */
  final: number;
  /** 0 si no hay promo. */
  pct: number;
  /** true si `final < original`. */
  enPromo: boolean;
  etiqueta: string;
}

/**
 * Aplica el hot sale sobre un precio de venta ya calculado o ya guardado.
 * Es la ÚNICA forma en que la promo toca un precio: nunca se recalcula ni se
 * reescribe nada en la DB.
 */
export function aplicarHotSale(
  precioVenta: number,
  cfg: ConfigPrecios,
  categoria: CategoriaPrecio,
  ahoraMs: number
): PrecioConPromo {
  const pct = pctHotSale(cfg, categoria, ahoraMs);
  const etiqueta = cfg.hotSale.etiqueta || "HOT SALE";
  if (pct <= 0) {
    return { original: precioVenta, final: precioVenta, pct: 0, enPromo: false, etiqueta };
  }
  const final = Math.round(precioVenta * (1 - pct / 100));
  return { original: precioVenta, final, pct, enPromo: final < precioVenta, etiqueta };
}

// =====================================================
// AJUSTE DE COMPRA
// =====================================================

/**
 * Porcentaje de ajuste que le toca a una compra.
 * Más específico gana: tipo (s3/380/400) → categoría → global. Se pisan.
 * Negativo = pagás menos. Positivo = pagás más.
 */
export function pctAjusteCompra(
  cfg: ConfigPrecios,
  categoria: CategoriaPrecio,
  tipo?: TipoEquipo3 | null
): number {
  const a = cfg.ajusteCompra;
  if (tipo && a.porTipo[tipo] !== undefined) return a.porTipo[tipo] as number;
  if (a.porCategoria[categoria] !== undefined) return a.porCategoria[categoria] as number;
  return a.globalPct;
}

/** Factor multiplicativo del ajuste (−20% → 0.8). Nunca negativo. */
export function factorAjusteCompra(
  cfg: ConfigPrecios,
  categoria: CategoriaPrecio,
  tipo?: TipoEquipo3 | null
): number {
  const pct = pctAjusteCompra(cfg, categoria, tipo);
  return Math.max(0, 1 + pct / 100);
}

/** Aplica el ajuste a un precio de referencia. Devuelve null si entra null. */
export function aplicarAjusteCompra(
  referencia: number | null,
  cfg: ConfigPrecios,
  categoria: CategoriaPrecio,
  tipo?: TipoEquipo3 | null
): number | null {
  if (referencia === null) return null;
  return Math.round(referencia * factorAjusteCompra(cfg, categoria, tipo));
}

// =====================================================
// FECHAS EN HORA SERVIDOR (para los inputs del panel)
// El admin piensa en hora del server (= hora de Argentina, UTC-3 fijo);
// la DB guarda ISO UTC.
// =====================================================

/** ISO UTC → "YYYY-MM-DDTHH:MM" para un <input type="datetime-local">. */
export function isoAInputServidor(iso: string | null): string {
  if (!iso) return "";
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";
  const d = new Date(ms + OFFSET_SERVIDOR_MS);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

/** "YYYY-MM-DDTHH:MM" (hora servidor) → ISO UTC. "" → null. */
export function inputServidorAIso(valor: string): string | null {
  if (!valor.trim()) return null;
  const m = valor.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, a, mes, dia, hh, mm] = m;
  const comoUtc = Date.UTC(+a, +mes - 1, +dia, +hh, +mm, 0, 0);
  return new Date(comoUtc - OFFSET_SERVIDOR_MS).toISOString();
}
