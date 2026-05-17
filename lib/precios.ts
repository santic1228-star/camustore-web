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
// Sin luck → ×0,25.

export interface ArmaduraInput {
  hpDdRef: boolean;
  nivel: number;          // 0-15
  tipo: "s3" | "380" | "400" | null;
  socket: number | null;  // 0-3
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
    baseLvl15 = 1500;       // 500 + 1000
  } else if (tipo === "380") {
    base = 800;
    baseLvl15 = 2100;       // 800 + 1300
  } else if (tipo === "400") {
    base = 1000;
    baseLvl15 = 3000;       // 1000 + 2000
    if (socket === 3) {
      base += 1000;
      baseLvl15 += 1000;
    }
  }

  const precioPorLvl = precioPorNivel(base, baseLvl15, nivel);
  const factorLuck = luck ? 1 : 0.25;
  return Math.round(precioPorLvl * factorLuck);
}

// =====================================================
// ARMAS
// =====================================================
// exe rate 10% + dmg +2% son indispensables.
// 3ra opción: dmg lvl/20 O speed +7 (cualquiera).
// +50% final al precio (después de aplicar nivel y luck).

export interface ArmaInput {
  exeRate: boolean;
  dmgLvl20: boolean;
  dmg2pct: boolean;
  speed7: boolean;
  nivel: number;
  tipo: "s3" | "380" | "400" | null;
  socket: number | null;
  luck: boolean;
}

export function precioArma(input: ArmaInput): number | null {
  const { exeRate, dmgLvl20, dmg2pct, speed7, nivel, tipo, socket, luck } = input;

  if (!tipo) return null;
  if (!exeRate || !dmg2pct) return null;
  if (!dmgLvl20 && !speed7) return null;

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
    if (socket === 3) {
      base += 1000;
      baseLvl15 += 1000;
    }
  }

  const precioPorLvl = precioPorNivel(base, baseLvl15, nivel);
  const factorLuck = luck ? 1 : 0.25;
  // +50% final por ser arma
  return Math.round(precioPorLvl * factorLuck * 1.5);
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
// Precio por bundle de 30 unidades.
// El usuario carga cuántos BUNDLES tiene (0 a 99).

export type JewelTipo = "chaos" | "creation" | "soul" | "bless";

export const JEWEL_PRECIOS: Record<JewelTipo, number> = {
  chaos: 200,
  creation: 250,
  soul: 350,
  bless: 400,
};

export const JEWEL_LABELS: Record<JewelTipo, string> = {
  chaos: "Jewel of Chaos",
  creation: "Jewel of Creation",
  soul: "Jewel of Soul",
  bless: "Jewel of Bless",
};

/**
 * Precio total por una cantidad de BUNDLES de 30 jewels.
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

