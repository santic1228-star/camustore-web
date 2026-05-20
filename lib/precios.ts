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
// HP + DD + REF son indispensables (un solo checkbox).
// Sin las 3 opciones → no se compra.
// Sin luck → ×0,25 (no afecta el bonus de socket).
// Sockets (solo tipo 400) → +600 WC por socket, sumado AL FINAL.

export interface ArmaduraInput {
  hpDdRef: boolean;
  nivel: number;          // 0-15
  tipo: "s3" | "380" | "400" | null;
  socket: number | null;  // 0-3 (solo tipo 400)
  luck: boolean;
}

export function precioArmadura(input: ArmaduraInput): number | null {
  const { hpDdRef, nivel, tipo, socket, luck } = input;

  if (!tipo) return null;
  if (!hpDdRef) return null;

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
// =====================================================
// ARMAS
// =====================================================
// exe rate 10% es OBLIGATORIA. Sin esto, no se compra.
// Opciones útiles extra: dmg +2%, speed +7, dmg lvl/20 (las 3 son combinables).
// Total opciones útiles = exe rate (siempre 1) + cuántas extras tenga.
//
// Multiplicador por cantidad de opciones útiles totales:
//   1 (solo exe rate)       → no se compra (null)
//   2 (exe rate + 1 extra)  → × 0.30 (30% del precio)
//   3 (exe rate + 2 extras) → × 1.00 (100% del precio)
//
// UI debe bloquear seleccionar la 4ta opción (máximo 3 totales).
//
// Sin luck → ×0,25.
// Sin skill → ×0,25.
// +50% sobre precio base (×1.5 markup de armas).
// Sockets (solo tipo 400) → +1.200 WC por socket, sumado AL FINAL.

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
}

export function precioArma(input: ArmaInput): number | null {
  const { exeRate, dmgLvl20, dmg2pct, speed7, nivel, tipo, socket, luck, skill } = input;

  if (!tipo) return null;
  if (!exeRate) return null;  // exe rate es obligatoria

  // Cantidad total de opciones útiles
  const totalOpciones = 1 + [dmg2pct, speed7, dmgLvl20].filter(Boolean).length;

  // Multiplicador según cantidad de opciones
  let factorOpciones = 0;
  if (totalOpciones === 2) factorOpciones = 0.3;
  else if (totalOpciones === 3) factorOpciones = 1;
  else return null;  // 1 opción (solo exe rate) → no se compra

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

  // Precio base × luck × skill × 1.5 (markup de armas) × factor opciones
  let precio = precioPorLvl * factorLuck * factorSkill * 1.5 * factorOpciones;

  // Bonus por socket (solo aplica a 400, plano al final, máximo 3 sockets)
  if (tipo === "400" && socket && socket > 0) {
    const socketsValidos = Math.min(3, socket);
    precio += socketsValidos * 1200;
  }

  return Math.round(precio);
}

// =====================================================
// ALAS
// =====================================================
// Las alas ahora SÍ tienen progresión por nivel (0-15).
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
  soul: 350,
  bless: 1000,
  harmony: 350,
  life: 250,
  socket: 6000,
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
// Max Life: 35.000 (40.000 si Penta Sphere)
// Damage Reduction: 40.000 (45.000 si Penta Sphere)

export type SeedTipo = "max_life" | "damage_reduction";

export const SEED_LABELS: Record<SeedTipo, string> = {
  max_life: "Max Life",
  damage_reduction: "Damage Reduction",
};

export function precioSeed(tipo: SeedTipo | null, ensambladaPenta: boolean): number | null {
  if (!tipo) return null;
  const base = tipo === "max_life" ? 35000 : 40000;
  return ensambladaPenta ? base + 5000 : base;
}

