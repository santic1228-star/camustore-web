/**
 * Vista previa de precios.
 * ========================
 *
 * La grilla de casos de ejemplo que el panel del admin muestra mientras se
 * editan los coeficientes: los mismos casos que se validan a mano antes de
 * cambiar una fórmula (Convención 5), pero recalculándose en vivo.
 *
 * Puro: recibe una config y devuelve números. Se puede probar con node.
 */

import {
  precioReferenciaAlas,
  precioReferenciaArma,
  precioReferenciaArmadura,
  precioReferenciaEscudo,
  precioReferenciaJewel,
  precioReferenciaJoya,
  precioReferenciaSeed,
  precioReferenciaGema,
  precioAlas,
  precioArma,
  precioArmadura,
  precioEscudo,
  precioJoya,
  precioSeed,
  jewelPrecioCompra,
  gemaPrecioCompra,
  precioVentaAlas,
  precioVentaArma,
  precioVentaArmadura,
  precioVentaEscudo,
  precioVentaGema,
  precioVentaJoya,
  precioVentaSeed,
  jewelPrecioVenta,
} from "./precios";
import {
  aplicarHotSale,
  type CategoriaPrecio,
  type ConfigPrecios,
} from "./precios-config";

export interface FilaPreview {
  label: string;
  categoria: CategoriaPrecio;
  /** Precio de fórmula, sin ajuste de compra. */
  referencia: number | null;
  /** Lo que le pagás al jugador (referencia × ajuste). */
  compra: number | null;
  /** Precio de lista al público. */
  venta: number | null;
  /** Lo que paga el cliente hoy (venta − hot sale). */
  ventaFinal: number | null;
  /** venta ÷ compra. null si no se puede calcular. */
  margen: number | null;
}

function fila(
  label: string,
  categoria: CategoriaPrecio,
  referencia: number | null,
  compra: number | null,
  venta: number | null,
  cfg: ConfigPrecios,
  ahoraMs: number
): FilaPreview {
  const ventaFinal =
    venta === null ? null : aplicarHotSale(venta, cfg, categoria, ahoraMs).final;
  const margen =
    compra && compra > 0 && ventaFinal !== null
      ? Math.round((ventaFinal / compra) * 100) / 100
      : null;
  return { label, categoria, referencia, compra, venta, ventaFinal, margen };
}

/**
 * Los casos de siempre: los extremos y un par de intermedios de cada categoría.
 * Son los mismos que figuran en REGLAS_DE_PRECIOS, así se pueden comparar.
 */
export function filasPreview(cfg: ConfigPrecios, ahoraMs: number): FilaPreview[] {
  const armadura400 = { hpDdRef: true, nivel: 15, tipo: "400" as const, socket: 3, luck: true };
  const armadura380 = { hpDdRef: true, nivel: 15, tipo: "380" as const, socket: null, luck: true };
  const armaduraS3 = { hpDdRef: true, nivel: 9, tipo: "s3" as const, socket: null, luck: true };

  const arma400 = {
    exeRate: true, dmg2pct: true, speed7: true, dmgLvl20: false,
    nivel: 15, tipo: "400" as const, socket: 3, luck: true, skill: true,
  };
  const armaS3 = {
    exeRate: true, dmg2pct: true, speed7: true, dmgLvl20: false,
    nivel: 9, tipo: "s3" as const, socket: null, luck: true, skill: true,
  };

  const escudo = { hpDdRef: true, nivel: 15, socket: 3, luck: true, skill: true };
  const alas = { ignore: true, returnOpc: true, lifeRecovery: true, luck: true, nivel: 15 };
  const anillo = {
    tipo: "anillo" as const, nombre: "earth", nivel: 5,
    lifeRecovery: 5, tieneLife: true, hpDdRef: true,
  };

  return [
    fila("Armadura 400 +15 · luck · 3 sockets", "armadura",
      precioReferenciaArmadura(armadura400, cfg), precioArmadura(armadura400, cfg),
      precioVentaArmadura(armadura400, cfg), cfg, ahoraMs),

    fila("Armadura 380 +15 · luck", "armadura",
      precioReferenciaArmadura(armadura380, cfg), precioArmadura(armadura380, cfg),
      precioVentaArmadura(armadura380, cfg), cfg, ahoraMs),

    fila("Armadura s3 +9 · luck", "armadura",
      precioReferenciaArmadura(armaduraS3, cfg), precioArmadura(armaduraS3, cfg),
      precioVentaArmadura(armaduraS3, cfg), cfg, ahoraMs),

    fila("Arma 400 +15 · completa · 3 sockets", "arma",
      precioReferenciaArma(arma400, cfg), precioArma(arma400, cfg),
      precioVentaArma(arma400, cfg), cfg, ahoraMs),

    fila("Arma s3 +9 · completa", "arma",
      precioReferenciaArma(armaS3, cfg), precioArma(armaS3, cfg),
      precioVentaArma(armaS3, cfg), cfg, ahoraMs),

    fila("Escudo +15 · luck · skill · 3 sockets", "escudo",
      precioReferenciaEscudo(escudo, cfg), precioEscudo(escudo, cfg),
      precioVentaEscudo(escudo, cfg), cfg, ahoraMs),

    fila("Alas +15 · 3 opciones · luck", "ala",
      precioReferenciaAlas(alas, cfg), precioAlas(alas, cfg),
      precioVentaAlas(alas, cfg), cfg, ahoraMs),

    fila("Anillo caro +5 · 5% life", "joya",
      precioReferenciaJoya(anillo, cfg), precioJoya(anillo, cfg),
      precioVentaJoya(anillo, cfg), cfg, ahoraMs),

    fila("Jewel of Socket (1 unidad)", "jewel",
      precioReferenciaJewel("socket", cfg), jewelPrecioCompra("socket", cfg),
      jewelPrecioVenta("socket", cfg), cfg, ahoraMs),

    fila("Chaos (1 bundle)", "jewel",
      precioReferenciaJewel("chaos", cfg), jewelPrecioCompra("chaos", cfg),
      jewelPrecioVenta("chaos", cfg), cfg, ahoraMs),

    fila("Seed Max Life", "seed",
      precioReferenciaSeed("max_life", false, cfg), precioSeed("max_life", false, cfg),
      precioVentaSeed("max_life", false, cfg), cfg, ahoraMs),

    fila("Gema item 400", "gema",
      precioReferenciaGema("gema_item_400", cfg), gemaPrecioCompra("gema_item_400", cfg),
      precioVentaGema("gema_item_400", cfg), cfg, ahoraMs),
  ];
}
