// =====================================================
// CamuStore - Consignación · Fase 3 (admin)
// =====================================================
// Lo que el admin hace con una consignación: listarla, aprobar o rechazar
// cada ítem, publicar el ítem aprobado en su tabla destino con dueño =
// personaje del consignante, y recalcular el estado de la cabecera.
//
// Separación (misma que el resto del proyecto):
//   - Funciones PURAS (sin Supabase): `calcularEstadoCabecera`,
//     `payloadDestino`, `pagoEstimado`, `mensajeWhatsappConsignante`.
//     Se prueban en node.
//   - Funciones de DATOS (con Supabase): `listarConsignaciones`,
//     `contarAbiertas`, `aprobarItem`, `rechazarItem`.
//
// Decisiones (DECISIONES §6 y 26/08):
//   - Aprobar = publicar de una: el ítem entra `activo` al catálogo público.
//   - La comisión corre sobre lo EFECTIVAMENTE cobrado. Acá guardamos el
//     precio aprobado (lo que se publica) y el % acordado; la liquidación
//     final es de la Fase 4 (estado "vendido").
//   - Jewels / seeds / gemas no guardan precio en su tabla (se calculan al
//     vuelo con la config): se publican al precio de lista vigente. El
//     `precio_aprobado` queda igual registrado, para la liquidación.
// =====================================================

import { supabase } from "./supabase";
import {
  calcularDesgloseConsignante,
  labelLinea,
  precioSugeridoVenta,
  type LineaConsignacion,
} from "./consignacion";
import { CONFIG_PRECIOS_DEFAULT, type ConfigPrecios } from "./precios-config";
import { esJewelEspecial } from "./precios";
import { itemPorId } from "./items-catalogo";
import { CONFIG } from "./config";
import type {
  Categoria,
  ConsignacionItemRow,
  ConsignacionRow,
  EstadoConsigItem,
  EstadoConsignacionV2,
  Raza,
  TipoItem,
} from "./database.types";

// =====================================================
// Tipos
// =====================================================

export interface ConsignacionConItems {
  cabecera: ConsignacionRow;
  items: ConsignacionItemRow[];
}

/** Tabla destino de un ítem aprobado + el payload listo para insertar. */
export type PayloadDestino =
  | { tabla: "items"; payload: Record<string, unknown> }
  | { tabla: "joyeria_stock"; payload: Record<string, unknown> }
  | { tabla: "jewels_stock"; payload: Record<string, unknown> }
  | { tabla: "seeds_stock"; payload: Record<string, unknown> }
  | { tabla: "gemas_stock"; payload: Record<string, unknown> };

export const ESTADO_CABECERA_LABEL: Record<EstadoConsignacionV2, string> = {
  pendiente: "Pendiente",
  parcial: "Parcial",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
};

export const ESTADO_ITEM_LABEL: Record<EstadoConsigItem, string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
};

/** Categorías cuyo precio de venta NO se guarda en la tabla destino. */
export const CATEGORIAS_PRECIO_LISTA = ["jewel", "seed", "gema"] as const;
export function precioVaEnDestino(categoria: LineaConsignacion["categoria"]): boolean {
  return !(CATEGORIAS_PRECIO_LISTA as readonly string[]).includes(categoria);
}

// =====================================================
// Puro: línea desde la fila
// =====================================================

/**
 * El JSONB `atributos` se guardó desde `LineaConsignacion` en la Fase 2,
 * así que castea directo. Si alguna categoría vieja no coincide, el precio
 * sugerido da null y la UI lo muestra como "no cotiza".
 */
export function lineaDeItem(item: Pick<ConsignacionItemRow, "categoria" | "atributos">): LineaConsignacion {
  return { categoria: item.categoria, atributos: item.atributos } as unknown as LineaConsignacion;
}

export function labelDeItem(item: Pick<ConsignacionItemRow, "categoria" | "atributos">): string {
  try {
    return labelLinea(lineaDeItem(item));
  } catch {
    return `(${item.categoria})`;
  }
}

/** Precio de venta que darían las reglas HOY (puede diferir del guardado). */
export function sugeridoHoy(
  item: Pick<ConsignacionItemRow, "categoria" | "atributos">,
  cfg: ConfigPrecios = CONFIG_PRECIOS_DEFAULT
): number | null {
  try {
    return precioSugeridoVenta(lineaDeItem(item), cfg);
  } catch {
    return null;
  }
}

// =====================================================
// Puro: estado de la cabecera
// =====================================================

/**
 * - todos pendientes                → pendiente
 * - ninguno pendiente, todos aprobados  → aprobada
 * - ninguno pendiente, todos rechazados → rechazada
 * - cualquier otra mezcla           → parcial
 */
export function calcularEstadoCabecera(items: Pick<ConsignacionItemRow, "estado">[]): EstadoConsignacionV2 {
  if (items.length === 0) return "pendiente";
  const pend = items.filter((i) => i.estado === "pendiente").length;
  const apro = items.filter((i) => i.estado === "aprobado").length;
  const rech = items.filter((i) => i.estado === "rechazado").length;
  if (pend === items.length) return "pendiente";
  if (pend === 0 && apro === items.length) return "aprobada";
  if (pend === 0 && rech === items.length) return "rechazada";
  return "parcial";
}

// =====================================================
// Puro: lo que cobra cada parte
// =====================================================

/** Lo que se le pagaría al consignante si el ítem se vende al precio aprobado. */
export function pagoEstimado(precioAprobado: number, comisionPct: number): number {
  return calcularDesgloseConsignante(precioAprobado, comisionPct).pagoConsignante;
}

// =====================================================
// Puro: mapeo a la tabla destino
// =====================================================

const ESCUDO_RAZA: Record<string, Raza> = {
  guardian: "Wizard",
  crimson_glory: "Knight",
  salamander: "Gladiator",
  cross: "Lord",
};

/**
 * Arma el insert para la tabla destino. Calcado de los payloads de
 * `ItemFormModal` (items), `SeccionJoyeriaStock`, `SeccionStock` y
 * `SeccionGemasStock`, para que un ítem consignado sea indistinguible de uno
 * cargado a mano — salvo por `dueno`.
 *
 * `precio_compra` = pago estimado al consignante (informativo hasta la Fase 4).
 */
export function payloadDestino(
  linea: LineaConsignacion,
  precioAprobado: number,
  comisionPct: number,
  personaje: string
): PayloadDestino {
  const dueno = personaje.trim() || "Consignante";
  const precioCompra = pagoEstimado(precioAprobado, comisionPct);

  switch (linea.categoria) {
    case "armadura": {
      const a = linea.atributos;
      const it = itemPorId(a.itemId);
      return {
        tabla: "items",
        payload: {
          categoria: "armadura" as Categoria,
          nombre: it?.nombre ?? a.itemId,
          parte: it?.parte ?? null,
          raza: a.raza ?? it?.raza ?? null,
          nivel: a.nivel,
          tipo: a.tipo as TipoItem,
          socket: a.tipo === "400" ? a.socket : 0,
          hp_dd_ref: a.hpDdRef,
          luck: a.luck,
          precio_compra: precioCompra,
          precio_venta: precioAprobado,
          dueno,
          estado: "activo",
        },
      };
    }
    case "arma": {
      const a = linea.atributos;
      const it = itemPorId(a.itemId);
      return {
        tabla: "items",
        payload: {
          categoria: "arma" as Categoria,
          nombre: it?.nombre ?? a.itemId,
          parte: it?.parte ?? "weapon",
          raza: a.raza ?? it?.raza ?? null,
          nivel: a.nivel,
          tipo: a.tipo as TipoItem,
          socket: a.tipo === "400" ? a.socket : 0,
          exe_rate: a.exeRate,
          dmg_lvl_20: a.tercera === "dmglvl20",
          dmg_2pct: a.dmg2pct,
          speed_7: a.tercera === "speed7",
          skill: a.skill,
          luck: a.luck,
          precio_compra: precioCompra,
          precio_venta: precioAprobado,
          dueno,
          estado: "activo",
        },
      };
    }
    case "escudo": {
      const a = linea.atributos;
      return {
        tabla: "items",
        payload: {
          categoria: "escudo" as Categoria,
          nombre: a.nombreEscudo, // código (guardian, crimson_glory…), igual que el admin
          parte: "shield",
          raza: ESCUDO_RAZA[a.nombreEscudo] ?? null,
          nivel: a.nivel,
          tipo: "400" as TipoItem,
          socket: a.socket,
          hp_dd_ref: a.hpDdRef,
          luck: a.luck,
          skill: a.skill,
          precio_compra: precioCompra,
          precio_venta: precioAprobado,
          dueno,
          estado: "activo",
        },
      };
    }
    case "ala": {
      const a = linea.atributos;
      return {
        tabla: "items",
        payload: {
          categoria: "ala" as Categoria,
          nombre: "Alas",
          parte: "wings",
          raza: null,
          nivel: a.nivel,
          tipo: "s3" as TipoItem,
          socket: 0,
          opc_ignore: a.ignore,
          opc_return: a.returnOpc,
          opc_life_recov: a.lifeRecovery,
          luck: a.luck,
          precio_compra: precioCompra,
          precio_venta: precioAprobado,
          dueno,
          estado: "activo",
        },
      };
    }
    case "joya": {
      const a = linea.atributos;
      return {
        tabla: "joyeria_stock",
        payload: {
          tipo: a.tipo,
          nombre: a.nombre || null,
          nivel: a.nivel,
          life_recovery: a.lifeRecovery,
          hp_dd_ref: a.tipo === "anillo" ? a.hpDdRef : false,
          exe_rate: a.tipo === "pendiente" ? a.exeRate : false,
          dmg_2pct: a.tipo === "pendiente" ? a.dmg2pct : false,
          tercera_opcion: a.tipo === "pendiente" ? a.tercera : null,
          opcion_variable: "life",
          raza: null,
          dueno,
          precio_compra: precioCompra,
          precio_venta: precioAprobado,
          estado: "activo",
        },
      };
    }
    case "jewel": {
      const a = linea.atributos;
      const especial = esJewelEspecial(a.tipoJewel);
      return {
        tabla: "jewels_stock",
        payload: especial
          ? { tipo: a.tipoJewel, bundles: 0, cantidad: a.cantidad, dueno, estado: "activo" }
          : { tipo: a.tipoJewel, bundles: a.cantidad, cantidad: 0, dueno, estado: "activo" },
      };
    }
    case "seed": {
      const a = linea.atributos;
      return {
        tabla: "seeds_stock",
        payload: {
          tipo: a.tipoSeed,
          ensamblada_penta: a.ensambladaPenta ?? false,
          cantidad: a.cantidad,
          dueno,
          estado: "activo",
        },
      };
    }
    case "gema": {
      const a = linea.atributos;
      return {
        tabla: "gemas_stock",
        payload: { tipo: a.tipoGema, cantidad: a.cantidad, dueno, estado: "activo" },
      };
    }
  }
}

// =====================================================
// Puro: mensaje de WhatsApp para el consignante
// =====================================================

export function fmtWC(n: number): string {
  return `${n.toLocaleString("es-AR")} ${CONFIG.CURRENCY}`;
}

/** Link directo al WhatsApp del consignante (el número se guardó solo con dígitos). */
export function waLinkConsignante(whatsapp: string, mensaje: string): string {
  const digits = whatsapp.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Resumen de lo decidido, para avisarle al consignante a mano (DECISIONES §6:
 * las notificaciones automáticas son de la Fase 4).
 */
export function mensajeWhatsappConsignante(c: ConsignacionConItems): string {
  const aprobados = c.items.filter((i) => i.estado === "aprobado");
  const rechazados = c.items.filter((i) => i.estado === "rechazado");
  const pendientes = c.items.filter((i) => i.estado === "pendiente");

  const lineas: string[] = [];
  lineas.push(`Hola ${c.cabecera.personaje}! Revisé tu consignación en CamuStore.`);

  if (aprobados.length) {
    lineas.push("");
    lineas.push(`✅ Aprobado${aprobados.length > 1 ? "s" : ""} (ya publicado${aprobados.length > 1 ? "s" : ""} en la tienda):`);
    for (const i of aprobados) {
      const precio = i.precio_aprobado ?? i.precio_sugerido;
      const pago = pagoEstimado(precio, i.comision_pct);
      lineas.push(`• ${labelDeItem(i)} → se publica a ${fmtWC(precio)}; te llevás ${100 - i.comision_pct}% de lo que se cobre (≈ ${fmtWC(pago)})`);
    }
  }
  if (rechazados.length) {
    lineas.push("");
    lineas.push(rechazados.length > 1 ? "❌ No los tomo:" : "❌ No lo tomo:");
    for (const i of rechazados) {
      lineas.push(`• ${labelDeItem(i)}${i.motivo_rechazo ? ` — ${i.motivo_rechazo}` : ""}`);
    }
  }
  if (pendientes.length) {
    lineas.push("");
    lineas.push(`⏳ Todavía estoy viendo: ${pendientes.map((i) => labelDeItem(i)).join(", ")}.`);
  }
  lineas.push("");
  lineas.push("Cuando puedas coordinamos la entrega ingame. Gracias!");
  return lineas.join("\n");
}

// =====================================================
// Datos
// =====================================================

function errorTecnico(prefijo: string, e: { message?: string; code?: string; details?: string } | null): Error {
  const partes = [e?.message, e?.code ? `(código ${e.code})` : null, e?.details].filter(Boolean);
  return new Error(`${prefijo}: ${partes.join(" ") || "error desconocido"}`);
}

/** Todas las consignaciones con sus ítems, las más nuevas primero. */
export async function listarConsignaciones(): Promise<ConsignacionConItems[]> {
  const { data: cabs, error: e1 } = await supabase
    .from("consignaciones")
    .select("*")
    .order("created_at", { ascending: false });
  if (e1) throw errorTecnico("No se pudieron leer las consignaciones", e1);

  const { data: items, error: e2 } = await supabase
    .from("consignaciones_items")
    .select("*")
    .order("created_at", { ascending: true });
  if (e2) throw errorTecnico("No se pudieron leer los ítems", e2);

  const porCab = new Map<string, ConsignacionItemRow[]>();
  for (const it of (items ?? []) as ConsignacionItemRow[]) {
    const arr = porCab.get(it.consignacion_id) ?? [];
    arr.push(it);
    porCab.set(it.consignacion_id, arr);
  }
  return ((cabs ?? []) as ConsignacionRow[]).map((cabecera) => ({
    cabecera,
    items: porCab.get(cabecera.id) ?? [],
  }));
}

/** Cantidad de consignaciones con algo por decidir (pendiente o parcial). */
export async function contarAbiertas(): Promise<number> {
  const { count, error } = await supabase
    .from("consignaciones")
    .select("id", { count: "exact", head: true })
    .in("estado", ["pendiente", "parcial"]);
  if (error) throw errorTecnico("No se pudo contar", error);
  return count ?? 0;
}

async function recalcularCabecera(consignacionId: string): Promise<EstadoConsignacionV2> {
  const { data, error } = await supabase
    .from("consignaciones_items")
    .select("estado")
    .eq("consignacion_id", consignacionId);
  if (error) throw errorTecnico("No se pudo releer la consignación", error);
  const estado = calcularEstadoCabecera((data ?? []) as Pick<ConsignacionItemRow, "estado">[]);
  const { error: e2 } = await supabase
    .from("consignaciones")
    .update({ estado, revisado_at: new Date().toISOString() })
    .eq("id", consignacionId);
  if (e2) throw errorTecnico("No se pudo actualizar el estado de la consignación", e2);
  return estado;
}

/**
 * Aprueba un ítem: lo publica en su tabla destino (activo, dueño = personaje),
 * guarda `item_creado_id`, precio y comisión, y recalcula la cabecera.
 *
 * Orden: primero el insert destino, después el update del ítem. Si el update
 * fallara con el ítem ya publicado, el error lo dice con el id creado, para
 * que se pueda arreglar a mano (no hay transacciones desde el cliente).
 */
export async function aprobarItem(
  item: ConsignacionItemRow,
  cabecera: ConsignacionRow,
  precioAprobado: number,
  comisionPct: number
): Promise<{ itemCreadoId: string; estadoCabecera: EstadoConsignacionV2 }> {
  if (item.estado !== "pendiente") throw new Error("Este ítem ya fue decidido.");
  if (!Number.isFinite(precioAprobado) || precioAprobado <= 0) throw new Error("El precio aprobado tiene que ser mayor a 0.");
  if (!Number.isFinite(comisionPct) || comisionPct < 0 || comisionPct > 100) throw new Error("La comisión tiene que estar entre 0 y 100.");

  const destino = payloadDestino(lineaDeItem(item), precioAprobado, comisionPct, cabecera.personaje);

  const { data: creado, error: e1 } = await supabase
    .from(destino.tabla)
    .insert(destino.payload as never)
    .select("id")
    .single();
  if (e1) throw errorTecnico(`No se pudo publicar el ítem en ${destino.tabla}`, e1);
  const itemCreadoId = (creado as { id: string }).id;

  const { error: e2 } = await supabase
    .from("consignaciones_items")
    .update({
      estado: "aprobado",
      precio_aprobado: Math.round(precioAprobado),
      comision_pct: Math.round(comisionPct),
      item_creado_id: itemCreadoId,
      motivo_rechazo: null,
    })
    .eq("id", item.id);
  if (e2) {
    throw errorTecnico(
      `El ítem quedó publicado en ${destino.tabla} (id ${itemCreadoId}) pero no se pudo marcar como aprobado`,
      e2
    );
  }

  const estadoCabecera = await recalcularCabecera(item.consignacion_id);
  return { itemCreadoId, estadoCabecera };
}

/** Rechaza un ítem con motivo (opcional) y recalcula la cabecera. */
export async function rechazarItem(
  item: ConsignacionItemRow,
  motivo: string
): Promise<EstadoConsignacionV2> {
  if (item.estado !== "pendiente") throw new Error("Este ítem ya fue decidido.");
  const { error } = await supabase
    .from("consignaciones_items")
    .update({ estado: "rechazado", motivo_rechazo: motivo.trim() || null })
    .eq("id", item.id);
  if (error) throw errorTecnico("No se pudo rechazar el ítem", error);
  return recalcularCabecera(item.consignacion_id);
}

/** Borra una consignación entera (cascade a los ítems). Solo para limpiar pruebas. */
export async function eliminarConsignacion(id: string): Promise<void> {
  const { error } = await supabase.from("consignaciones").delete().eq("id", id);
  if (error) throw errorTecnico("No se pudo borrar la consignación", error);
}
