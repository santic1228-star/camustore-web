// =====================================================
// CamuStore - Helpers de consignación
// =====================================================
// Centraliza tipos del carrito de consignación y cálculo del precio sugerido.
// Reusa las fórmulas del cotizador para que el precio sugerido coincida.

import {
  precioArmadura, precioArma, precioAlas, precioEscudo, precioVentaEscudo,
  precioJoya, precioVentaJoya,
  JEWEL_PRECIOS, JEWEL_MULT_VENTA, esJewelEspecial,
  SEED_LABELS, precioSeed, precioVentaSeed,
  GEMA_PRECIOS, GEMA_LABELS, GEMA_MULT_VENTA,
  joyaLabel, escudoLabel,
  JewelTipo, SeedTipo, GemaTipo, TipoJoya,
} from "./precios";
import { itemPorId } from "./items-catalogo";
import type { Raza } from "./database.types";

// =====================================================
// Atributos por categoría (snapshot que se guarda en DB)
// =====================================================

export interface AtribsArmadura {
  itemId: string; raza: Raza; nivel: number;
  tipo: "s3" | "380" | "400"; socket: number;
  hpDdRef: boolean; luck: boolean;
}
export interface AtribsArma {
  itemId: string; raza: Raza; nivel: number;
  tipo: "s3" | "380" | "400"; socket: number;
  exeRate: boolean; dmg2pct: boolean;
  tercera: "" | "speed7" | "dmglvl20";
  luck: boolean; skill: boolean;
}
export interface AtribsEscudo {
  nombreEscudo: string; nivel: number; socket: number;
  hpDdRef: boolean; luck: boolean; skill: boolean;
}
export interface AtribsAla {
  nivel: number;
  exeRate: boolean;    // (campo legacy; no afecta precio de alas)
  dmg2pct: boolean;    // (campo legacy; no afecta precio de alas)
  ignore: boolean;
  returnOpc: boolean;
  lifeRecovery: boolean;
  luck: boolean;
}
export interface AtribsJoya {
  tipo: TipoJoya; nombre: string;
  nivel: number; lifeRecovery: number; tieneLife: boolean;
  hpDdRef: boolean;
  exeRate: boolean; dmg2pct: boolean;
  tercera: "speed7" | "dmglvl20";
}
export interface AtribsJewel { tipoJewel: JewelTipo; cantidad: number; }
export interface AtribsSeed { tipoSeed: SeedTipo; cantidad: number; ensambladaPenta?: boolean; }
export interface AtribsGema { tipoGema: GemaTipo; cantidad: number; }

// Línea del carrito (unión tipada)
export type LineaConsignacion =
  | { categoria: "armadura"; atributos: AtribsArmadura }
  | { categoria: "arma";     atributos: AtribsArma }
  | { categoria: "escudo";   atributos: AtribsEscudo }
  | { categoria: "ala";      atributos: AtribsAla }
  | { categoria: "joya";     atributos: AtribsJoya }
  | { categoria: "jewel";    atributos: AtribsJewel }
  | { categoria: "seed";     atributos: AtribsSeed }
  | { categoria: "gema";     atributos: AtribsGema };

// =====================================================
// Multiplicadores compra→venta (igual que admin/ItemFormModal.tsx)
// =====================================================
function multVenta(categoria: LineaConsignacion["categoria"], tipo?: "s3" | "380" | "400"): number {
  if (categoria === "armadura" || categoria === "arma") return tipo === "400" ? 4 : 3;
  if (categoria === "ala") return 2.1;
  // jewel/seed/gema/joya/escudo: ya tienen su propio venta calculado
  return 1;
}

// =====================================================
// Precio sugerido de COMPRA (lo que la tienda pagaría hoy)
// =====================================================
export function precioSugeridoCompra(linea: LineaConsignacion): number | null {
  switch (linea.categoria) {
    case "armadura": {
      const a = linea.atributos;
      return precioArmadura({
        hpDdRef: a.hpDdRef, nivel: a.nivel, tipo: a.tipo,
        socket: a.tipo === "400" ? a.socket : null, luck: a.luck,
      });
    }
    case "arma": {
      const a = linea.atributos;
      return precioArma({
        exeRate: a.exeRate, dmg2pct: a.dmg2pct,
        speed7: a.tercera === "speed7", dmgLvl20: a.tercera === "dmglvl20",
        nivel: a.nivel, tipo: a.tipo,
        socket: a.tipo === "400" ? a.socket : null,
        luck: a.luck, skill: a.skill,
      });
    }
    case "escudo": {
      const a = linea.atributos;
      return precioEscudo({
        hpDdRef: a.hpDdRef, nivel: a.nivel,
        socket: a.socket, luck: a.luck, skill: a.skill,
      });
    }
    case "ala": {
      const a = linea.atributos;
      return precioAlas({
        nivel: a.nivel,
        ignore: a.ignore, returnOpc: a.returnOpc,
        lifeRecovery: a.lifeRecovery, luck: a.luck,
      });
    }
    case "joya": {
      const a = linea.atributos;
      return precioJoya({
        tipo: a.tipo, nombre: a.nombre,
        nivel: a.nivel, lifeRecovery: a.lifeRecovery, tieneLife: a.tieneLife,
        hpDdRef: a.hpDdRef,
        exeRate: a.exeRate, dmg2pct: a.dmg2pct, tercera: a.tercera,
      });
    }
    case "jewel": {
      const a = linea.atributos;
      if (a.cantidad <= 0) return null;
      return JEWEL_PRECIOS[a.tipoJewel] * a.cantidad;
    }
    case "seed": {
      const a = linea.atributos;
      if (a.cantidad <= 0) return null;
      const unit = precioSeed(a.tipoSeed, a.ensambladaPenta ?? false);
      if (unit === null) return null;
      return unit * a.cantidad;
    }
    case "gema": {
      const a = linea.atributos;
      if (a.cantidad <= 0) return null;
      return GEMA_PRECIOS[a.tipoGema] * a.cantidad;
    }
  }
}

// =====================================================
// Precio sugerido de VENTA al público (lo que se cobra al cliente)
// =====================================================
export function precioSugeridoVenta(linea: LineaConsignacion): number | null {
  switch (linea.categoria) {
    case "armadura":
    case "arma": {
      const compra = precioSugeridoCompra(linea);
      if (compra === null) return null;
      const tipo = (linea.atributos as { tipo: "s3" | "380" | "400" }).tipo;
      return Math.round(compra * multVenta(linea.categoria, tipo));
    }
    case "ala": {
      const compra = precioSugeridoCompra(linea);
      if (compra === null) return null;
      return Math.round(compra * multVenta("ala"));
    }
    case "escudo": {
      const a = linea.atributos;
      return precioVentaEscudo({
        hpDdRef: a.hpDdRef, nivel: a.nivel,
        socket: a.socket, luck: a.luck, skill: a.skill,
      });
    }
    case "joya": {
      const a = linea.atributos;
      return precioVentaJoya({
        tipo: a.tipo, nombre: a.nombre,
        nivel: a.nivel, lifeRecovery: a.lifeRecovery, tieneLife: a.tieneLife,
        hpDdRef: a.hpDdRef,
        exeRate: a.exeRate, dmg2pct: a.dmg2pct, tercera: a.tercera,
      });
    }
    case "jewel": {
      const a = linea.atributos;
      if (a.cantidad <= 0) return null;
      const ventaUnit = Math.round(JEWEL_PRECIOS[a.tipoJewel] * JEWEL_MULT_VENTA[a.tipoJewel]);
      return ventaUnit * a.cantidad;
    }
    case "seed": {
      const a = linea.atributos;
      if (a.cantidad <= 0) return null;
      const ventaUnit = precioVentaSeed(a.tipoSeed, a.ensambladaPenta ?? false);
      if (ventaUnit === null) return null;
      return ventaUnit * a.cantidad;
    }
    case "gema": {
      const a = linea.atributos;
      if (a.cantidad <= 0) return null;
      return GEMA_PRECIOS[a.tipoGema] * GEMA_MULT_VENTA * a.cantidad;
    }
  }
}

// =====================================================
// Label legible
// =====================================================
export function labelLinea(linea: LineaConsignacion): string {
  switch (linea.categoria) {
    case "armadura":
    case "arma": {
      const a = linea.atributos;
      const it = itemPorId(a.itemId);
      return `${it?.nombre || "(item)"} +${a.nivel} ${a.tipo}${a.tipo === "400" && a.socket ? ` · ${a.socket} sock` : ""}`;
    }
    case "escudo": {
      const a = linea.atributos;
      return `${escudoLabel(a.nombreEscudo)} +${a.nivel}${a.socket ? ` · ${a.socket} sock` : ""}`;
    }
    case "ala": {
      const a = linea.atributos;
      return `Alas +${a.nivel}`;
    }
    case "joya": {
      const a = linea.atributos;
      const life = a.tieneLife ? ` ${a.lifeRecovery}%` : "";
      return `${joyaLabel(a.tipo, a.nombre)} +${a.nivel}${life}`;
    }
    case "jewel": {
      const a = linea.atributos;
      const sufijo = esJewelEspecial(a.tipoJewel) ? "u." : "bundle(s)";
      return `Jewel ${a.tipoJewel} · ${a.cantidad} ${sufijo}`;
    }
    case "seed": {
      const a = linea.atributos;
      return `${SEED_LABELS[a.tipoSeed]}${a.ensambladaPenta ? " (Penta)" : ""} × ${a.cantidad}`;
    }
    case "gema": {
      const a = linea.atributos;
      return `${GEMA_LABELS[a.tipoGema]} × ${a.cantidad}`;
    }
  }
}

// =====================================================
// Desglose de comisión
// =====================================================
export interface DesgloseConsignante {
  precioVenta: number;
  comisionPct: number;
  comisionTienda: number;
  pagoConsignante: number;
}
export function calcularDesgloseConsignante(precioVenta: number, comisionPct: number): DesgloseConsignante {
  const comisionTienda = Math.round(precioVenta * (comisionPct / 100));
  const pagoConsignante = precioVenta - comisionTienda;
  return { precioVenta, comisionPct, comisionTienda, pagoConsignante };
}
