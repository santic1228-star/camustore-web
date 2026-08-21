/**
 * Datos de prueba para el catálogo.
 * En Phase 2 esto se reemplaza por queries a Supabase.
 */

import type { Item } from "./types";
import { getRaza } from "./razas";

// Helper: calcula precio según las reglas del Excel
function calcVenta(opts: Partial<Item> & { tipo: Item["tipo"]; nivel: number; luck: boolean; socket?: number | null }): number {
  const { tipo, nivel, luck, socket = 0 } = opts;

  // Alas: precios planos
  if (tipo === "alas") {
    const opciones = opts.opciones || "";
    const nOpc = opciones.split(",").filter(s => s.trim()).length;
    let compra = 0;
    if (nOpc === 3 && luck) compra = 50000;
    else if (nOpc === 3 && !luck) compra = 40000;
    else if (nOpc === 2 && luck) compra = 10000;
    else if (nOpc === 1 && luck) compra = 2000;
    return compra * 2.5;
  }

  // s3 / 380 / 400
  let base = 0;
  if (tipo === "s3") base = 500 + (nivel === 15 ? 1000 : 0);
  else if (tipo === "380") base = 800 + (nivel === 15 ? 1300 : 0);
  else if (tipo === "400") base = 1000 + (nivel === 15 ? 2000 : 0) + (socket === 3 ? 1000 : 0);

  const compra = base * (luck ? 1 : 0.25);
  const venta = tipo === "400" ? compra * 4 : compra * 3;
  return Math.round(venta);
}

// Generador rápido
function mk(
  id: string,
  nombre: string,
  parte: string,
  nivel: number,
  tipo: Item["tipo"],
  socket: number | null,
  luck: boolean,
  categoria: Item["categoria"] = "armadura",
  opciones = "hp, dd, ref"
): Item {
  return {
    id,
    nombre,
    parte,
    raza: getRaza(nombre),
    nivel,
    opciones,
    luck,
    tipo,
    socket,
    precio_venta: calcVenta({ tipo, nivel, luck, socket, opciones }),
    categoria,
  };
}

export const ITEMS_MOCK: Item[] = [
  // Armaduras 400 (mejores)
  mk("1", "queen", "helm", 10, "400", 2, true),
  mk("2", "queen", "armor", 10, "400", 3, true),
  mk("3", "queen", "pants", 13, "400", 2, true),
  mk("4", "titan", "helm", 15, "400", 3, true),
  mk("5", "titan", "boots", 11, "400", 2, true),
  mk("6", "eternal", "armor", 9, "400", 2, true),
  mk("7", "royal", "helm", 12, "400", 3, true),
  mk("8", "royal", "boots", 10, "400", 2, false),
  mk("9", "dragon knight", "armor", 14, "400", 3, true),
  mk("10", "dark phoenix", "pants", 15, "400", 3, true),
  mk("11", "dark master", "helm", 11, "400", 2, true),
  mk("12", "storm blitz", "armor", 13, "400", 2, true),
  mk("13", "grand viper", "pants", 10, "400", 2, true),

  // Armaduras 380
  mk("14", "volcano", "armor", 9, "380", null, true),
  mk("15", "volcano", "pants", 11, "380", null, true),
  mk("16", "hurricane", "boots", 10, "380", null, true),
  mk("17", "adamantine", "armor", 13, "380", null, true),
  mk("18", "grand soul", "helm", 15, "380", null, true),
  mk("19", "seraphim", "armor", 10, "380", null, false),

  // Armaduras s3
  mk("20", "great dragon", "armor", 11, "s3", null, true),
  mk("21", "dark soul", "armor", 10, "s3", null, true),
  mk("22", "guardian", "helm", 9, "s3", null, true),
  mk("23", "sylphid", "pants", 12, "s3", null, true),

  // Armas
  mk("24", "sword", "espada", 10, "400", 2, true, "arma", "exe rate 10%, dmg +2%, speed +7"),
  mk("25", "staff", "vara", 14, "400", 3, true, "arma", "exe rate 10%, dmg +2%, dmg lvl/20"),
  mk("26", "scepter", "cetro", 11, "380", null, true, "arma", "exe rate 10%, dmg +2%, speed +7"),

  // Alas
  mk("27", "dragon wings", "wings", 0, "alas", null, true, "ala", "ignore, return, life recovery"),
  mk("28", "wings of storm", "wings", 0, "alas", null, true, "ala", "ignore, return"),
  mk("29", "wings of soul", "wings", 0, "alas", null, false, "ala", "ignore, return, life recovery"),
  mk("30", "wings of satan", "wings", 0, "alas", null, true, "ala", "ignore"),
];

// Funciones helper para filtrar
export function getAllItems(): Item[] {
  return ITEMS_MOCK;
}

export function searchItems(items: Item[], query: string): Item[] {
  if (!query.trim()) return items;
  const q = query.toLowerCase();
  return items.filter(item => {
    const haystack = [
      item.nombre,
      item.parte,
      item.raza,
      String(item.nivel),
      item.opciones,
      item.tipo,
      item.categoria,
      item.luck ? "luck" : "",
    ].join(" ").toLowerCase();
    return haystack.includes(q);
  });
}
