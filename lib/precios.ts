/**
 * Reglas de cálculo de precio de COMPRA al usuario.
 * Todas las funciones devuelven el precio en WC, o null si el item no se compra.
 */

// =====================================================
// HELPERS
// =====================================================
/**
 * Interpolación lineal entre el precio base (niveles 0-9) y el precio máximo (nivel 15).
 * - Niveles 0-9: precio base
 * - Nivel 10: base + 1/6 del salto a 15
 * - Nivel 11: base + 2/6 del salto a 15
 * - ... y así hasta nivel 15 = precio máximo
 */
function precioPorNivel(base: number, baseLvl15: number, nivel: number): number {
  if (nivel <= 9) return base;
  if (nivel >= 15) return baseLvl15;
  const pasos = nivel - 9; // 1, 2, 3, 4, 5
  const incrementoPorPaso = (baseLvl15 - base) / 6;
  return base + incrementoPorPaso * pasos;
}

// =====================================================
// ARMADURAS
// =====================================================
// HP + DD + REF indispensables (un solo checkbox). Sin las 3 → no se compra.
// Reglas de luck/sockets según tipo:
//   - s3:  sin luck → NO se compra.
//   - 380: sin luck → NO se compra.
//   - 400: sin luck → ×0.25. Requiere 2 o 3 sockets (1 o 0 sockets → NO se compra).
// Sockets (solo 400) → +600 WC por socket, sumado AL FINAL.

export interface ArmaduraInput {
  hpDdRef: boolean;
  nivel: number;          // 0-15
  tipo: "s3" | "380" | "400" | null;
  socket: number | null;  // 2-3 (solo tipo 400, mínimo 2). Con forzarAdmin acepta 1.
  luck: boolean;
  /** Saltea validación de sockets mínimos (uso solo desde admin para cargar items raros). */
  forzarAdmin?: boolean;
}

export function precioArmadura(input: ArmaduraInput): number | null {
  const { hpDdRef, nivel, tipo, socket, luck, forzarAdmin } = input;

  if (!tipo) return null;
  if (!hpDdRef) return null;

  // s3 y 380: sin luck no se compran
  if ((tipo === "s3" || tipo === "380") && !luck) return null;

  // 400: requiere mínimo 2 sockets (salvo carga manual desde admin)
  if (tipo === "400" && !forzarAdmin && (!socket || socket < 2)) return null;

  // Precio base (lvl 0-9) y precio a nivel 15
  let base = 0, baseLvl15 = 0;
  if (tipo === "s3") {
    base = 500;
    baseLvl15 = 1500;
  } else if (tipo === "380") {
    base = 800;
    baseLvl15 = 2100;
  } else if (tipo === "400") {
    base = 1000;
    baseLvl15 = 3000;
  }

  const precioPorLvl = precioPorNivel(base, baseLvl15, nivel);
  const factorLuck = luck ? 1 : 0.25;
  let precio = precioPorLvl * factorLuck;

  // Bonus por socket (solo aplica a 400, plano al final, máximo 3 sockets)
  if (tipo === "400" && socket && socket > 0) {
    const socketsValidos = Math.min(3, socket);
    precio += socketsValidos * 600;
  }

  return Math.round(precio);
}

// =====================================================
// ARMAS
// =====================================================
// OBLIGATORIAS SIEMPRE: exe rate 10% + dmg 2%. Sin ambas → no se compra.
// Tercera opción: speed +7 O dmg lvl/20 (mutex, una sola).
//
// Por tipo:
//   s3:  requiere las 3 opciones (rate + 2% + tercera) + luck + skill. Sin eso → no se compra. ×1.0
//   380: requiere las 3 opciones (rate + 2% + tercera) + luck + skill. Sin eso → no se compra. ×1.0
//   400: rate + 2% obligatorias siempre.
//        - 3 opciones (rate + 2% + tercera) → ×1.0. Sin skill → ×0.25 (penalidad).
//        - 2 opciones (rate + 2%, sin tercera) → ×0.60, PERO solo si tiene
//          luck + skill + mínimo 2 sockets. Si no cumple → no se compra.
//
// Modificadores:
//   Sin skill → ×0.25 (en los casos donde el arma igual se compra).
//   Sin luck → s3/380 no se compran; en 400 con 2 opciones luck es requisito.
//   +50% sobre precio base (×1.5 markup de armas).
//   Sockets (solo 400) → +1.200 WC por socket, sumado AL FINAL.

export interface ArmaInput {
  exeRate: boolean;
  dmgLvl20: boolean;
  dmg2pct: boolean;
  speed7: boolean;
  nivel: number;
  tipo: "s3" | "380" | "400" | null;
  socket: number | null;
  luck: boolean;
  skill: boolean;
  /** Saltea validación de sockets mínimos (uso solo desde admin para cargar items raros). */
  forzarAdmin?: boolean;
}

export function precioArma(input: ArmaInput): number | null {
  const { exeRate, dmgLvl20, dmg2pct, speed7, nivel, tipo, socket, luck, skill, forzarAdmin } = input;

  if (!tipo) return null;

  // Obligatorias siempre: exe rate + dmg 2%
  if (!exeRate || !dmg2pct) return null;

  // Tercera opción presente (speed7 o dmglvl20)
  const tieneTercera = speed7 || dmgLvl20;
  const socketsValidos = tipo === "400" && socket ? Math.min(3, socket) : 0;

  // Determinar factor de opciones según tipo
  let factorOpciones: number;

  if (tipo === "s3" || tipo === "380") {
    // Requieren las 3 opciones + luck + skill
    if (!tieneTercera) return null;
    if (!luck) return null;
    if (!skill) return null;
    factorOpciones = 1;
  } else {
    // tipo 400
    if (tieneTercera) {
      // 3 opciones → ×1.0
      factorOpciones = 1;
    } else {
      // 2 opciones (rate + 2%) → ×0.60 solo si luck + skill + 2 sockets (salvo admin)
      if (!luck || !skill) return null;
      if (!forzarAdmin && socketsValidos < 2) return null;
      factorOpciones = 0.6;
    }
  }

  let base = 0, baseLvl15 = 0;
  if (tipo === "s3") {
    base = 500;
    baseLvl15 = 1500;
  } else if (tipo === "380") {
    base = 800;
    baseLvl15 = 2100;
  } else if (tipo === "400") {
    base = 1000;
    baseLvl15 = 3000;
  }

  const precioPorLvl = precioPorNivel(base, baseLvl15, nivel);
  const factorLuck = luck ? 1 : 0.25;
  const factorSkill = skill ? 1 : 0.25;

  // Precio base × luck × skill × 1.5 (markup) × factor opciones
  let precio = precioPorLvl * factorLuck * factorSkill * 1.5 * factorOpciones;

  // Bonus por socket (solo 400, plano al final)
  if (socketsValidos > 0) {
    precio += socketsValidos * 1200;
  }

  return Math.round(precio);
}

// =====================================================
// ESCUDOS
// =====================================================
// Escudos: muy escasos. Solo existen en tipo 400.
// Reglas iguales a ARMADURA 400 + skill como modificador + markup de ARMA:
//   - HP + DD + REF obligatorio (sin eso → no se compra).
//   - Base lvl 0-9: 1.000 · lvl 15: 3.000 (interpolación 10-14).
//   - Sin luck → ×0.25.
//   - Sin skill → ×0.25 (modificador, como en armas).
//   - Markup ×1.5 (como armas).
//   - Mínimo 2 sockets (0 o 1 → no se compra). +1200 WC por socket (como armas).
// Venta = compra × 6 (más que armadura/arma 400 por ser escasos).
//
// Nombres (desplegable): guardian (Wizard), crimson_glory (Knight),
//   salamander (Gladiator), cross (Lord).

export type NombreEscudo = "guardian" | "crimson_glory" | "salamander" | "cross";

export const ESCUDO_NOMBRES: { value: NombreEscudo; label: string }[] = [
  { value: "guardian", label: "Guardian Shield (Wizard)" },
  { value: "crimson_glory", label: "Crimson Glory (Knight)" },
  { value: "salamander", label: "Salamander Shield (Gladiator)" },
  { value: "cross", label: "Cross Shield (Lord)" },
];

export function escudoLabel(nombre: string | null): string {
  if (!nombre) return "Escudo";
  const found = ESCUDO_NOMBRES.find((n) => n.value === nombre);
  return found ? found.label : "Escudo";
}

export const ESCUDO_MULT_VENTA = 6;

export interface EscudoInput {
  hpDdRef: boolean;
  nivel: number;          // 0-15
  socket: number | null;  // 2-3 (mínimo 2). Con forzarAdmin acepta 1.
  luck: boolean;
  skill: boolean;
  /** Saltea validación de sockets mínimos (uso solo desde admin para cargar items raros). */
  forzarAdmin?: boolean;
}

/** Precio de COMPRA de un escudo. null si no se compra. */
export function precioEscudo(input: EscudoInput): number | null {
  const { hpDdRef, nivel, socket, luck, skill, forzarAdmin } = input;
  if (!hpDdRef) return null;
  if (!socket || socket < 1) return null;  // necesita al menos 1 socket
  if (!forzarAdmin && socket < 2) return null;  // cotizador exige 2; admin acepta 1

  const precioPorLvl = precioPorNivel(1000, 3000, nivel);
  const factorLuck = luck ? 1 : 0.25;
  const factorSkill = skill ? 1 : 0.25;
  let precio = precioPorLvl * factorLuck * factorSkill * 1.5;  // markup ×1.5 igual que armas

  const socketsValidos = Math.min(3, socket);
  precio += socketsValidos * 1200;  // +1200 WC por socket (igual que armas)

  return Math.round(precio);
}

/** Precio de VENTA de un escudo (compra × 6). */
export function precioVentaEscudo(input: EscudoInput): number | null {
  const compra = precioEscudo(input);
  if (compra === null) return null;
  return Math.round(compra * ESCUDO_MULT_VENTA);
}
// Las tablas de precios definen el valor base (lvl 0-9) y el valor a lvl 15.
// Entre lvl 10 y 14 se interpola linealmente.

export interface AlasInput {
  ignore: boolean;
  returnOpc: boolean;
  lifeRecovery: boolean;
  luck: boolean;
  nivel: number;          // 0-15
}

/**
 * Devuelve [base, lvl15] según las opciones y luck.
 * Retorna null si la combinación no se compra.
 */
function alasPrecioBaseYMax(
  nOpc: number,
  luck: boolean
): [number, number] | null {
  if (nOpc === 0) return null;
  if (nOpc === 3 && luck)  return [25000, 60000];
  if (nOpc === 3 && !luck) return [20000, 40000];
  if (nOpc === 2 && luck)  return [10000, 16000];
  if (nOpc === 1 && luck)  return [ 2000,  5000];
  // <3 sin luck → no se compra
  return null;
}

export function precioAlas(input: AlasInput): number | null {
  const { ignore, returnOpc, lifeRecovery, luck, nivel } = input;
  const nOpc = [ignore, returnOpc, lifeRecovery].filter(Boolean).length;

  const baseYMax = alasPrecioBaseYMax(nOpc, luck);
  if (!baseYMax) return null;

  const [base, lvl15] = baseYMax;
  return Math.round(precioPorNivel(base, lvl15, nivel));
}

// =====================================================
// JEWELS
// =====================================================
// REGULARES: se compran en bundles de 30 unidades (campo `bundles`).
// ESPECIALES: se compran por unidad individual (campo `cantidad`).
// Tipo determina si es regular o especial.

export type JewelTipo =
  | "chaos" | "creation" | "soul" | "bless" | "harmony" | "life"  // regulares
  | "socket" | "luck_jewel" | "skill_jewel" | "additional";        // especiales

export const JEWEL_REGULARES: JewelTipo[] = ["chaos", "creation", "soul", "bless", "harmony", "life"];
export const JEWEL_ESPECIALES: JewelTipo[] = ["socket", "luck_jewel", "skill_jewel", "additional"];

export function esJewelEspecial(tipo: JewelTipo): boolean {
  return JEWEL_ESPECIALES.includes(tipo);
}

/**
 * Precio de COMPRA (lo que pagás al jugador).
 * - Regulares: precio por bundle de 30.
 * - Especiales: precio por unidad individual.
 */
export const JEWEL_PRECIOS: Record<JewelTipo, number> = {
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
};

/**
 * Multiplicador de venta por tipo.
 * - Regulares: ×2.
 * - Especiales: ×2.5.
 */
export const JEWEL_MULT_VENTA: Record<JewelTipo, number> = {
  chaos: 2, creation: 2, soul: 2, bless: 2, harmony: 2, life: 2,
  socket: 2.5, luck_jewel: 2.5, skill_jewel: 2.5, additional: 2.5,
};

export const JEWEL_LABELS: Record<JewelTipo, string> = {
  chaos: "Jewel of Chaos",
  creation: "Jewel of Creation",
  soul: "Jewel of Soul",
  bless: "Jewel of Bless",
  harmony: "Jewel of Harmony",
  life: "Jewel of Life",
  socket: "Jewel of Socket",
  luck_jewel: "Jewel of Luck",
  skill_jewel: "Jewel of Skill",
  additional: "Jewel of Additional",
};

/**
 * Precio total por una cantidad de BUNDLES de 30 jewels (regulares).
 */
export function precioJewels(tipo: JewelTipo | null, bundles: number): number | null {
  if (!tipo) return null;
  if (bundles < 1) return null;
  return JEWEL_PRECIOS[tipo] * bundles;
}

// =====================================================
// SEEDS
// =====================================================
// Max Life: 35.000 (40.000 si Penta Sphere/ensamblada)
// Damage Reduction: 40.000 (45.000 si Penta Sphere/ensamblada)
// Penta: contenedor consumible, compra 5.000 (venta ×3.5 = 17.500)
// Exc Dmg Rate: compra 500, venta HARDCODEADA 2.000
// Crit Dmg Rate: compra 500, venta HARDCODEADA 2.000

export type SeedTipo = "max_life" | "damage_reduction" | "penta" | "exc_dmg_rate" | "crit_dmg_rate";

export const SEED_LABELS: Record<SeedTipo, string> = {
  max_life: "Max Life",
  damage_reduction: "Damage Reduction",
  penta: "Penta (contenedor)",
  exc_dmg_rate: "Exc Dmg Rate",
  crit_dmg_rate: "Crit Dmg Rate",
};

/** Tipos de seed que aceptan el modificador "ensamblada en Penta" (+5.000) */
export const SEED_ACEPTA_PENTA: SeedTipo[] = ["max_life", "damage_reduction"];

/** Precio de COMPRA de la seed. */
export function precioSeed(tipo: SeedTipo | null, ensambladaPenta: boolean): number | null {
  if (!tipo) return null;
  switch (tipo) {
    case "max_life":
      return ensambladaPenta ? 40000 : 35000;
    case "damage_reduction":
      return ensambladaPenta ? 45000 : 40000;
    case "penta":
      return 5000;
    case "exc_dmg_rate":
      return 500;
    case "crit_dmg_rate":
      return 500;
  }
}

/**
 * Precio de VENTA de la seed.
 * - max_life, damage_reduction → ×3.5 (regla general de seeds)
 * - penta → ×2.1 (rompe la regla)
 * - exc_dmg_rate, crit_dmg_rate → HARDCODEADO 2.000 (rompe la regla)
 */
export function precioVentaSeed(tipo: SeedTipo | null, ensambladaPenta: boolean): number | null {
  if (!tipo) return null;
  if (tipo === "exc_dmg_rate" || tipo === "crit_dmg_rate") {
    return 2000;
  }
  const compra = precioSeed(tipo, ensambladaPenta);
  if (compra === null) return null;
  const mult = tipo === "penta" ? 2.1 : 3.5;
  return Math.round(compra * mult);
}

// =====================================================
// GEMAS Y OTROS
// =====================================================
// Categoría nueva: items varios con precio fijo de compra.
// Todos venden ×2.

export type GemaTipo =
  | "gema_item_s3" | "gema_alas_s3" | "gema_seed" | "gema_item_380" | "gema_item_400"
  | "gema_gp" | "ring_wheel" | "item_acc" | "purple_box" | "chaos_box"
  | "kundun_box_5" | "kundun_box_4";

export const GEMA_LABELS: Record<GemaTipo, string> = {
  gema_item_s3: "Gema item S3",
  gema_alas_s3: "Gema alas S3",
  gema_seed: "Gema Seed",
  gema_item_380: "Gema item 380",
  gema_item_400: "Gema item 400",
  gema_gp: "Gema GP",
  ring_wheel: "Ring Wheel",
  item_acc: "Item ACC",
  purple_box: "Purple Box",
  chaos_box: "Chaos Box",
  kundun_box_5: "Kundun Box +5",
  kundun_box_4: "Kundun Box +4",
};

/** Precio de COMPRA de cada gema/otro. */
export const GEMA_PRECIOS: Record<GemaTipo, number> = {
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
};

/** Multiplicador de venta de gemas: todas ×2. */
export const GEMA_MULT_VENTA = 2;

export function precioVentaGema(tipo: GemaTipo | null): number | null {
  if (!tipo) return null;
  return GEMA_PRECIOS[tipo] * GEMA_MULT_VENTA;
}


// =====================================================
// JOYERÍA (anillos y pendientes)
// =====================================================
// Dos tipos: anillo y pendiente. Cada uno con nombres específicos (desplegable).
//
// ANILLOS (Ring of ...):
//   - Requisito: HP + DD + REF (sin eso → no se compra).
//   - Variable: Life Recovery % (1 a 7).
//   - Nombres: poison, ice, earth, fire, wind, magic.
//   - Variantes BARATAS (-30%): poison, fire, magic.
//
// PENDIENTES (Pendant of ...):
//   - Requisitos: exe rate 10% + dmg 2% (obligatorias) Y opción variable = Life Recovery.
//   - Tercera opción de arma (speed7/dmglvl20): requisito de calidad, no afecta precio.
//   - Variable: Life Recovery % (1 a 7).
//   - Nombres: lighting, ice, water, fire, wind, ability.
//   - Variantes BARATAS (-30%): water, fire, ability.
//
// Modelo de precio (Versión 2 - "equilibrada con saltos"):
//   - Rango 5.000 (n0,1%) a 30.000 (n15,7%) para la variante CARA.
//   - % aporta 55% del rango (curva exp 1.4), nivel aporta 45%.
//   - Nivel: subida lineal suave + saltos extra al tocar +7 y +15.
//   - Variante barata: -30% sobre el precio final.
//
// Venta = compra × 4.

export type TipoJoya = "anillo" | "pendiente";

export const JOYA_LABELS: Record<TipoJoya, string> = {
  anillo: "Anillo",
  pendiente: "Pendiente",
};

/** Opción variable del pendiente. Solo "life" se compra. */
export type OpcionVariablePendiente = "life" | "mana" | "ag";

export const JOYA_MULT_VENTA = 4;

// Nombres de joyas
export type NombreAnillo = "poison" | "ice" | "earth" | "fire" | "wind" | "magic";
export type NombrePendiente = "lighting" | "ice" | "water" | "fire" | "wind" | "ability";
export type NombreJoya = NombreAnillo | NombrePendiente;

export const ANILLO_NOMBRES: { value: NombreAnillo; label: string }[] = [
  { value: "poison", label: "Ring of Poison" },
  { value: "ice", label: "Ring of Ice" },
  { value: "earth", label: "Ring of Earth" },
  { value: "fire", label: "Ring of Fire" },
  { value: "wind", label: "Ring of Wind" },
  { value: "magic", label: "Ring of Magic" },
];

export const PENDIENTE_NOMBRES: { value: NombrePendiente; label: string }[] = [
  { value: "lighting", label: "Pendant of Lighting" },
  { value: "ice", label: "Pendant of Ice" },
  { value: "water", label: "Pendant of Water" },
  { value: "fire", label: "Pendant of Fire" },
  { value: "wind", label: "Pendant of Wind" },
  { value: "ability", label: "Pendant of Ability" },
];

/** Label completo de una joya según tipo + nombre. */
export function joyaLabel(tipo: TipoJoya, nombre: string | null): string {
  if (!nombre) return JOYA_LABELS[tipo];
  const arr = tipo === "anillo" ? ANILLO_NOMBRES : PENDIENTE_NOMBRES;
  const found = arr.find((n) => n.value === nombre);
  return found ? found.label : JOYA_LABELS[tipo];
}

/** Variantes baratas (-30%) por tipo. */
const ANILLO_BARATOS: NombreAnillo[] = ["poison", "fire", "magic"];
const PENDIENTE_BARATOS: NombrePendiente[] = ["water", "fire", "ability"];

export function esJoyaBarata(tipo: TipoJoya, nombre: string | null): boolean {
  if (!nombre) return false;
  if (tipo === "anillo") return ANILLO_BARATOS.includes(nombre as NombreAnillo);
  return PENDIENTE_BARATOS.includes(nombre as NombrePendiente);
}

/**
 * Factor de nivel (0..1): subida lineal suave + saltos extra en +7 y +15.
 */
function factorNivelJoya(nivel: number): number {
  const n = Math.max(0, Math.min(15, nivel));
  const base = (n / 15) * 0.65;       // lineal suave (65% del peso del nivel)
  let bonus = 0;
  if (n >= 7) bonus += 0.15;          // salto al llegar a +7
  if (n >= 15) bonus += 0.20;         // salto mayor al llegar a +15
  return Math.min(1, base + bonus);
}

/**
 * Precio base de joyería (variante CARA), rango 5.000 - 30.000.
 * % aporta 55% (curva exp 1.4), nivel aporta 45% (con saltos).
 * Se aplica un -25% adicional sobre todo (ajuste de precios).
 */
function precioJoyaBase(nivel: number, pct: number): number {
  const MIN = 5000, MAX = 30000;
  const fPct = Math.pow((pct - 1) / 6, 1.4);
  const fNivel = factorNivelJoya(nivel);
  const rango = MAX - MIN;
  const aportePct = fPct * rango * 0.55;
  const aporteNivel = fNivel * rango * 0.45;
  const bruto = Math.min(MAX, MIN + aportePct + aporteNivel);
  return Math.round(bruto * 0.75);  // -25% adicional para todos
}

export interface JoyaInput {
  tipo: TipoJoya | null;
  nombre?: string | null;     // nombre de la joya (para -30% en variantes baratas)
  nivel: number;              // 0-15
  lifeRecovery: number;       // 1-7 (% de Life Recovery)
  tieneLife?: boolean;        // ¿tiene la opción Life Recovery? (sin esto no se compra)
  // Anillo:
  hpDdRef?: boolean;
  // Pendiente:
  exeRate?: boolean;
  dmg2pct?: boolean;
  tercera?: "" | "speed7" | "dmglvl20";  // tercera opción (obligatoria en pendientes)
}

/** Precio de COMPRA de una joya. null si no se compra. */
export function precioJoya(input: JoyaInput): number | null {
  const { tipo, nivel, lifeRecovery, nombre } = input;
  if (!tipo) return null;

  // Sin Life Recovery → no se compra (puede tener AG/Mana que no sirven)
  if (!input.tieneLife) return null;
  if (lifeRecovery < 1 || lifeRecovery > 7) return null;

  if (tipo === "anillo") {
    // Requiere HP + DD + REF
    if (!input.hpDdRef) return null;
  } else {
    // Pendiente: exe rate + 2% obligatorias + tercera opción obligatoria (speed7/dmglvl20)
    if (!input.exeRate || !input.dmg2pct) return null;
    if (input.tercera !== "speed7" && input.tercera !== "dmglvl20") return null;
  }

  let precio = precioJoyaBase(nivel, lifeRecovery);
  // Variante barata: -30% encima del -25% ya aplicado en el base
  if (esJoyaBarata(tipo, nombre ?? null)) {
    precio = Math.round(precio * 0.7);
  }
  return precio;
}

/** Precio de VENTA de una joya (compra × 4). */
export function precioVentaJoya(input: JoyaInput): number | null {
  const compra = precioJoya(input);
  if (compra === null) return null;
  return Math.round(compra * JOYA_MULT_VENTA);
}
