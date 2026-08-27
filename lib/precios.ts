/**
 * Reglas de cálculo de precio — CamuStore.
 * =======================================
 *
 * MODELO DE TRES NÚMEROS (DECISIONES §9, 24/08/2026):
 *
 *   1. REFERENCIA  `precioReferencia*()`  — la fórmula pura sobre los atributos.
 *   2. COMPRA      `precio*()`            — referencia × ajuste de compra.
 *   3. VENTA       `precioVenta*()`       — referencia × multiplicador.
 *
 * La venta se calcula SIEMPRE desde la referencia, NUNCA desde la compra. Por
 * eso bajar lo que le pagás al jugador (globalmente con el ajuste, o a mano con
 * el override del admin) no arrastra el precio de venta hacia abajo.
 *
 * Todos los coeficientes viven en `lib/precios-config.ts` y son editables desde
 * el admin. Cada función recibe la config; si no se le pasa, usa los defaults
 * (que son los valores históricos, así nada se rompe si la DB está vacía).
 *
 * Todas las funciones devuelven el precio en WC, o null si el item no se compra.
 */

import {
  CONFIG_PRECIOS_DEFAULT,
  aplicarAjusteCompra,
  type ConfigPrecios,
  type GemaTipo,
  type JewelTipo,
  type NombreEscudo,
  type SeedTipo,
  type TipoEquipo3,
  type TipoJoya,
} from "./precios-config";

// Re-exports para que los imports viejos (`from "@/lib/precios"`) sigan andando.
export type { JewelTipo, SeedTipo, GemaTipo, TipoJoya, NombreEscudo, TipoEquipo3 };
export type { ConfigPrecios };
export { CONFIG_PRECIOS_DEFAULT };

// =====================================================
// HELPERS
// =====================================================

/**
 * Interpolación lineal entre el precio base (niveles 0-9) y el máximo (nivel 15).
 * - Niveles 0-9: precio base
 * - Nivel 10: base + 1/6 del salto a 15 (el divisor es configurable)
 * - ... y así hasta nivel 15 = precio máximo
 */
export function precioPorNivel(
  base: number,
  baseLvl15: number,
  nivel: number,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number {
  if (nivel <= 9) return base;
  if (nivel >= 15) return baseLvl15;
  const pasos = nivel - 9; // 1, 2, 3, 4, 5
  const divisor = cfg.curva.divisorInterpolacion || 6;
  const incrementoPorPaso = (baseLvl15 - base) / divisor;
  return base + incrementoPorPaso * pasos;
}

/** Base y máximo de un tipo de equipo, según la config. */
function rangoDeTipo(tipo: TipoEquipo3, cfg: ConfigPrecios): { base: number; max: number } {
  if (tipo === "s3") return cfg.bases.s3;
  if (tipo === "380") return cfg.bases.t380;
  return cfg.bases.t400;
}

/** Sockets que efectivamente suman precio (tope configurable). */
function socketsComputables(socket: number | null | undefined, cfg: ConfigPrecios): number {
  if (!socket || socket <= 0) return 0;
  return Math.min(cfg.modificadores.socketsMax, socket);
}

// =====================================================
// ARMADURAS
// =====================================================
// HP + DD + REF indispensables (un solo checkbox). Sin las 3 → no se compra.
// s3 / 380: sin luck → NO se compra. 400: sin luck → penalidad configurable
// y mínimo de sockets configurable. Sockets (solo 400) suman plano al final.

export interface ArmaduraInput {
  hpDdRef: boolean;
  nivel: number;          // 0-15
  tipo: TipoEquipo3 | null;
  socket: number | null;  // solo tipo 400. Con forzarAdmin se saltea el mínimo.
  luck: boolean;
  /** Saltea validación de sockets mínimos (uso solo desde admin para items raros). */
  forzarAdmin?: boolean;
}

/** Precio de REFERENCIA de una armadura (fórmula pura, sin ajuste de compra). */
export function precioReferenciaArmadura(
  input: ArmaduraInput,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number | null {
  const { hpDdRef, nivel, tipo, socket, luck, forzarAdmin } = input;
  const req = cfg.requisitos.armadura;

  if (!tipo) return null;
  if (req.exigeHpDdRef && !hpDdRef) return null;

  if (tipo === "s3" && req.s3ExigeLuck && !luck) return null;
  if (tipo === "380" && req.t380ExigeLuck && !luck) return null;

  if (tipo === "400" && !forzarAdmin) {
    const min = req.t400MinSockets;
    if (min > 0 && (!socket || socket < min)) return null;
  }

  const { base, max } = rangoDeTipo(tipo, cfg);
  const precioPorLvl = precioPorNivel(base, max, nivel, cfg);
  const factorLuck = luck ? 1 : cfg.modificadores.sinLuck;
  let precio = precioPorLvl * factorLuck;

  // Bonus por socket: solo 400, plano al final
  if (tipo === "400") {
    precio += socketsComputables(socket, cfg) * cfg.modificadores.socketArmadura;
  }

  return Math.round(precio);
}

/** Precio de COMPRA de una armadura (referencia × ajuste de compra). */
export function precioArmadura(
  input: ArmaduraInput,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number | null {
  return aplicarAjusteCompra(precioReferenciaArmadura(input, cfg), cfg, "armadura", input.tipo);
}

/** Precio de VENTA de una armadura (referencia × multiplicador del tipo). */
export function precioVentaArmadura(
  input: ArmaduraInput,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number | null {
  const ref = precioReferenciaArmadura(input, cfg);
  if (ref === null || !input.tipo) return null;
  return Math.round(ref * cfg.multVenta.armaduraArma[input.tipo]);
}

// =====================================================
// ARMAS
// =====================================================
// OBLIGATORIAS SIEMPRE: exe rate 10% + dmg 2%.
// Tercera opción: speed +7 O dmg lvl/20 (mutex, una sola).
//   s3 / 380: exigen las 3 opciones + luck + skill.
//   400 con tercera → factor 1. Sin tercera → factor configurable (0.6),
//        y exige luck + skill + mínimo de sockets.
// Markup de armas y bonus por socket configurables.

export interface ArmaInput {
  exeRate: boolean;
  dmgLvl20: boolean;
  dmg2pct: boolean;
  speed7: boolean;
  nivel: number;
  tipo: TipoEquipo3 | null;
  socket: number | null;
  luck: boolean;
  skill: boolean;
  /** Saltea validación de sockets mínimos (uso solo desde admin para items raros). */
  forzarAdmin?: boolean;
}

/** Precio de REFERENCIA de un arma (fórmula pura, sin ajuste de compra). */
export function precioReferenciaArma(
  input: ArmaInput,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number | null {
  const { exeRate, dmgLvl20, dmg2pct, speed7, nivel, tipo, socket, luck, skill, forzarAdmin } = input;
  const req = cfg.requisitos.arma;

  if (!tipo) return null;
  if (req.exigeExeRate && !exeRate) return null;
  if (req.exigeDmg2 && !dmg2pct) return null;

  const tieneTercera = speed7 || dmgLvl20;
  const sockets = tipo === "400" ? socketsComputables(socket, cfg) : 0;

  let factorOpciones: number;

  if (tipo === "s3" || tipo === "380") {
    if (req.s3_380ExigeTercera && !tieneTercera) return null;
    if (req.s3_380ExigeLuckSkill && (!luck || !skill)) return null;
    factorOpciones = 1;
  } else {
    // tipo 400
    if (tieneTercera) {
      factorOpciones = 1;
    } else {
      if (req.t400SinTerceraExigeLuckSkill && (!luck || !skill)) return null;
      if (!forzarAdmin && sockets < req.t400SinTerceraMinSockets) return null;
      factorOpciones = cfg.modificadores.sinTercera400;
    }
  }

  const { base, max } = rangoDeTipo(tipo, cfg);
  const precioPorLvl = precioPorNivel(base, max, nivel, cfg);
  const factorLuck = luck ? 1 : cfg.modificadores.sinLuck;
  const factorSkill = skill ? 1 : cfg.modificadores.sinSkill;

  let precio = precioPorLvl * factorLuck * factorSkill * cfg.modificadores.markupArma * factorOpciones;

  if (sockets > 0) {
    precio += sockets * cfg.modificadores.socketArma;
  }

  return Math.round(precio);
}

/** Precio de COMPRA de un arma (referencia × ajuste de compra). */
export function precioArma(
  input: ArmaInput,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number | null {
  return aplicarAjusteCompra(precioReferenciaArma(input, cfg), cfg, "arma", input.tipo);
}

/** Precio de VENTA de un arma (referencia × multiplicador del tipo). */
export function precioVentaArma(
  input: ArmaInput,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number | null {
  const ref = precioReferenciaArma(input, cfg);
  if (ref === null || !input.tipo) return null;
  return Math.round(ref * cfg.multVenta.armaduraArma[input.tipo]);
}

// =====================================================
// ESCUDOS
// =====================================================
// Muy escasos. Solo existen en tipo 400. Reglas de armadura 400 + skill como
// modificador + markup de arma. Venta con su propio multiplicador (×6).

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

export interface EscudoInput {
  hpDdRef: boolean;
  nivel: number;          // 0-15
  socket: number | null;
  luck: boolean;
  skill: boolean;
  /** Saltea validación de sockets mínimos (uso solo desde admin para items raros). */
  forzarAdmin?: boolean;
}

/** Precio de REFERENCIA de un escudo (fórmula pura, sin ajuste de compra). */
export function precioReferenciaEscudo(
  input: EscudoInput,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number | null {
  const { hpDdRef, nivel, socket, luck, skill, forzarAdmin } = input;
  const req = cfg.requisitos.escudo;

  if (req.exigeHpDdRef && !hpDdRef) return null;
  if (!socket || socket < 1) return null;                       // necesita al menos 1 socket
  if (!forzarAdmin && socket < req.minSockets) return null;     // el cotizador exige el mínimo

  const { base, max } = cfg.bases.escudo;
  const precioPorLvl = precioPorNivel(base, max, nivel, cfg);
  const factorLuck = luck ? 1 : cfg.modificadores.sinLuck;
  const factorSkill = skill ? 1 : cfg.modificadores.sinSkill;

  let precio = precioPorLvl * factorLuck * factorSkill * cfg.modificadores.markupEscudo;
  precio += socketsComputables(socket, cfg) * cfg.modificadores.socketEscudo;

  return Math.round(precio);
}

/** Precio de COMPRA de un escudo. null si no se compra. */
export function precioEscudo(
  input: EscudoInput,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number | null {
  return aplicarAjusteCompra(precioReferenciaEscudo(input, cfg), cfg, "escudo", "400");
}

/** Precio de VENTA de un escudo (referencia × multiplicador de escudos). */
export function precioVentaEscudo(
  input: EscudoInput,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number | null {
  const ref = precioReferenciaEscudo(input, cfg);
  if (ref === null) return null;
  return Math.round(ref * cfg.multVenta.escudo);
}

// =====================================================
// ALAS
// =====================================================
// No tienen tipo s3/380/400. El precio depende de cuántas opciones y del luck.

export interface AlasInput {
  ignore: boolean;
  returnOpc: boolean;
  lifeRecovery: boolean;
  luck: boolean;
  nivel: number;          // 0-15
}

/**
 * Devuelve base y máximo según las opciones y luck.
 * null si la combinación no se compra.
 */
function alasRango(
  nOpc: number,
  luck: boolean,
  cfg: ConfigPrecios
): { base: number; max: number } | null {
  const req = cfg.requisitos.alas;
  if (nOpc < req.minOpciones) return null;

  if (nOpc >= 3) {
    if (luck) return cfg.alas.tresConLuck;
    return req.compraTresSinLuck ? cfg.alas.tresSinLuck : null;
  }
  // 1 o 2 opciones
  if (!luck && req.exigeLuckConMenosDe3) return null;
  if (nOpc === 2) return cfg.alas.dosConLuck;
  return cfg.alas.unaConLuck;
}

/** Precio de REFERENCIA de unas alas (fórmula pura, sin ajuste de compra). */
export function precioReferenciaAlas(
  input: AlasInput,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number | null {
  const { ignore, returnOpc, lifeRecovery, luck, nivel } = input;
  const nOpc = [ignore, returnOpc, lifeRecovery].filter(Boolean).length;

  const rango = alasRango(nOpc, luck, cfg);
  if (!rango) return null;

  return Math.round(precioPorNivel(rango.base, rango.max, nivel, cfg));
}

/** Precio de COMPRA de unas alas. */
export function precioAlas(
  input: AlasInput,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number | null {
  return aplicarAjusteCompra(precioReferenciaAlas(input, cfg), cfg, "ala");
}

/** Precio de VENTA de unas alas (referencia × multiplicador de alas). */
export function precioVentaAlas(
  input: AlasInput,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number | null {
  const ref = precioReferenciaAlas(input, cfg);
  if (ref === null) return null;
  return Math.round(ref * cfg.multVenta.ala);
}

// =====================================================
// JEWELS
// =====================================================
// REGULARES: se compran en bundles (campo `bundles`).
// ESPECIALES: se compran por unidad individual.

export const JEWEL_REGULARES: JewelTipo[] = ["chaos", "creation", "soul", "bless", "harmony", "life"];
export const JEWEL_ESPECIALES: JewelTipo[] = ["socket", "luck_jewel", "skill_jewel", "additional"];

export function esJewelEspecial(tipo: JewelTipo): boolean {
  return JEWEL_ESPECIALES.includes(tipo);
}

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

/** Precio de REFERENCIA de una jewel (por bundle o por unidad, según tipo). */
export function precioReferenciaJewel(
  tipo: JewelTipo,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number {
  return cfg.jewels.precios[tipo];
}

/** Precio de COMPRA unitario de una jewel (con ajuste de compra aplicado). */
export function jewelPrecioCompra(
  tipo: JewelTipo,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number {
  return aplicarAjusteCompra(precioReferenciaJewel(tipo, cfg), cfg, "jewel") ?? 0;
}

/** Multiplicador de venta de una jewel según sea regular o especial. */
export function jewelMultVenta(
  tipo: JewelTipo,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number {
  return esJewelEspecial(tipo) ? cfg.multVenta.jewelEspecial : cfg.multVenta.jewelRegular;
}

/** Precio de VENTA unitario de una jewel (referencia × multiplicador). */
export function jewelPrecioVenta(
  tipo: JewelTipo,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number {
  return Math.round(precioReferenciaJewel(tipo, cfg) * jewelMultVenta(tipo, cfg));
}

/** Precio total de COMPRA por una cantidad de bundles (regulares) o unidades (especiales). */
export function precioJewels(
  tipo: JewelTipo | null,
  bundles: number,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number | null {
  if (!tipo) return null;
  if (bundles < 1) return null;
  return jewelPrecioCompra(tipo, cfg) * bundles;
}

// =====================================================
// SEEDS
// =====================================================

export const SEED_LABELS: Record<SeedTipo, string> = {
  max_life: "Max Life",
  damage_reduction: "Damage Reduction",
  penta: "Penta (contenedor)",
  exc_dmg_rate: "Exc Dmg Rate",
  crit_dmg_rate: "Crit Dmg Rate",
};

/** Tipos de seed que aceptan el modificador "ensamblada en Penta". */
export const SEED_ACEPTA_PENTA: SeedTipo[] = ["max_life", "damage_reduction"];

/** Precio de REFERENCIA de una seed. */
export function precioReferenciaSeed(
  tipo: SeedTipo | null,
  ensambladaPenta: boolean,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number | null {
  if (!tipo) return null;
  const s = cfg.seeds;
  switch (tipo) {
    case "max_life":
      return ensambladaPenta ? s.maxLifePenta : s.maxLife;
    case "damage_reduction":
      return ensambladaPenta ? s.dmgReductionPenta : s.dmgReduction;
    case "penta":
      return s.penta;
    case "exc_dmg_rate":
      return s.excDmgRate;
    case "crit_dmg_rate":
      return s.critDmgRate;
  }
}

/** Precio de COMPRA de una seed. */
export function precioSeed(
  tipo: SeedTipo | null,
  ensambladaPenta: boolean,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number | null {
  return aplicarAjusteCompra(precioReferenciaSeed(tipo, ensambladaPenta, cfg), cfg, "seed");
}

/**
 * Precio de VENTA de una seed.
 * - max_life / damage_reduction → multiplicador general de seeds
 * - penta → su propio multiplicador (rompe la regla)
 * - exc/crit dmg rate → precio fijo configurable (rompe la regla)
 */
export function precioVentaSeed(
  tipo: SeedTipo | null,
  ensambladaPenta: boolean,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number | null {
  if (!tipo) return null;
  if (tipo === "exc_dmg_rate" || tipo === "crit_dmg_rate") {
    return cfg.seeds.ventaFijaExcCrit;
  }
  const ref = precioReferenciaSeed(tipo, ensambladaPenta, cfg);
  if (ref === null) return null;
  const mult = tipo === "penta" ? cfg.multVenta.seedPenta : cfg.multVenta.seed;
  return Math.round(ref * mult);
}

// =====================================================
// GEMAS Y OTROS
// =====================================================

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

/** Precio de REFERENCIA de una gema. */
export function precioReferenciaGema(
  tipo: GemaTipo,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number {
  return cfg.gemas[tipo];
}

/** Precio de COMPRA de una gema (con ajuste aplicado). */
export function gemaPrecioCompra(
  tipo: GemaTipo,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number {
  return aplicarAjusteCompra(precioReferenciaGema(tipo, cfg), cfg, "gema") ?? 0;
}

/** Precio de VENTA de una gema (referencia × multiplicador de gemas). */
export function precioVentaGema(
  tipo: GemaTipo | null,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number | null {
  if (!tipo) return null;
  return Math.round(precioReferenciaGema(tipo, cfg) * cfg.multVenta.gema);
}

// =====================================================
// JOYERÍA (anillos y pendientes)
// =====================================================
// ANILLOS: requieren HP + DD + REF. Variable: Life Recovery %.
// PENDIENTES: requieren exe rate + dmg 2% + tercera opción. Variable: Life %.
// El % aporta una parte del rango (curva exponencial) y el nivel la otra
// (lineal + saltos en +7 y +15). Todo configurable.

export const JOYA_LABELS: Record<TipoJoya, string> = {
  anillo: "Anillo",
  pendiente: "Pendiente",
};

/** Opción variable del pendiente. Solo "life" se compra. */
export type OpcionVariablePendiente = "life" | "mana" | "ag";

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

/** Variantes baratas por tipo. */
const ANILLO_BARATOS: NombreAnillo[] = ["poison", "fire", "magic"];
const PENDIENTE_BARATOS: NombrePendiente[] = ["water", "fire", "ability"];

export function esJoyaBarata(tipo: TipoJoya, nombre: string | null): boolean {
  if (!nombre) return false;
  if (tipo === "anillo") return ANILLO_BARATOS.includes(nombre as NombreAnillo);
  return PENDIENTE_BARATOS.includes(nombre as NombrePendiente);
}

/** Factor de nivel (0..1): subida lineal + saltos extra en +7 y +15. */
function factorNivelJoya(nivel: number, cfg: ConfigPrecios): number {
  const j = cfg.joyeria;
  const n = Math.max(0, Math.min(15, nivel));
  const base = (n / 15) * j.lineal;
  let bonus = 0;
  if (n >= 7) bonus += j.salto7;
  if (n >= 15) bonus += j.salto15;
  return Math.min(1, base + bonus);
}

/** Precio base de joyería (variante cara), entre el piso y el techo configurados. */
function precioJoyaBase(nivel: number, pct: number, cfg: ConfigPrecios): number {
  const j = cfg.joyeria;
  const fPct = Math.pow((pct - 1) / 6, j.expPct);
  const fNivel = factorNivelJoya(nivel, cfg);
  const rango = j.techo - j.piso;
  const aportePct = fPct * rango * j.pesoPct;
  const aporteNivel = fNivel * rango * j.pesoNivel;
  const bruto = Math.min(j.techo, j.piso + aportePct + aporteNivel);
  return Math.round(bruto * j.ajusteGlobal);
}

export interface JoyaInput {
  tipo: TipoJoya | null;
  nombre?: string | null;     // para la variante barata
  nivel: number;              // 0-15
  lifeRecovery: number;       // 1-7 (% de Life Recovery)
  tieneLife?: boolean;        // sin esto no se compra
  // Anillo:
  hpDdRef?: boolean;
  // Pendiente:
  exeRate?: boolean;
  dmg2pct?: boolean;
  tercera?: "" | "speed7" | "dmglvl20";
}

/** Precio de REFERENCIA de una joya (fórmula pura, sin ajuste de compra). */
export function precioReferenciaJoya(
  input: JoyaInput,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number | null {
  const { tipo, nivel, lifeRecovery, nombre } = input;
  const req = cfg.requisitos.joya;
  if (!tipo) return null;

  if (req.exigeLife && !input.tieneLife) return null;
  if (lifeRecovery < req.lifeMin || lifeRecovery > req.lifeMax) return null;

  if (tipo === "anillo") {
    if (req.anilloExigeHpDdRef && !input.hpDdRef) return null;
  } else {
    if (req.pendienteExigeExeRateDmg2 && (!input.exeRate || !input.dmg2pct)) return null;
    if (req.pendienteExigeTercera && input.tercera !== "speed7" && input.tercera !== "dmglvl20") {
      return null;
    }
  }

  let precio = precioJoyaBase(nivel, lifeRecovery, cfg);
  if (esJoyaBarata(tipo, nombre ?? null)) {
    precio = Math.round(precio * cfg.joyeria.variantesBaratas);
  }
  return precio;
}

/** Precio de COMPRA de una joya. null si no se compra. */
export function precioJoya(
  input: JoyaInput,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number | null {
  return aplicarAjusteCompra(precioReferenciaJoya(input, cfg), cfg, "joya");
}

/** Precio de VENTA de una joya (referencia × multiplicador de joyería). */
export function precioVentaJoya(
  input: JoyaInput,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number | null {
  const ref = precioReferenciaJoya(input, cfg);
  if (ref === null) return null;
  return Math.round(ref * cfg.multVenta.joya);
}
