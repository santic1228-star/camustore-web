/**
 * Miembros — acceso a datos (Supabase) de la versión con login.
 *
 * Tablas: `miembros` y `eventos_registros` (SQL: camustore_miembros.sql).
 * La lógica de cálculo vive en lib/registros.ts (pura); acá solo lectura/escritura.
 */

import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { checkIsAdmin } from "./auth";
import type {
  EventoRegistroInsert,
  EventoRegistroRow,
  MiembroInsert,
  MiembroRow,
  TipoEventoRegistro,
  AsistenciaRow,
  AsistenciaInsert,
  Raza,
} from "./database.types";

// =====================================================
// Identidad del miembro logueado
// =====================================================

export interface SesionMiembro {
  user: User;
  /** Fila en `miembros`. null si es admin sin fila propia. */
  miembro: MiembroRow | null;
  esAdmin: boolean;
  /** Nombre para mostrar y para firmar registros. */
  personaje: string;
  email: string;
}

/**
 * Verifica si el usuario logueado puede entrar a /miembros.
 * - Miembro activo → ok.
 * - Admin (lista de lib/auth.ts) → ok aunque no esté en `miembros`.
 */
export async function verificarMiembro(user: User | null): Promise<SesionMiembro | null> {
  if (!user?.email) return null;
  const email = user.email.toLowerCase();

  const { data } = await supabase
    .from("miembros")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  const miembro = (data as MiembroRow | null) ?? null;
  const esAdmin = await checkIsAdmin(user);

  if (miembro?.activo) {
    return { user, miembro, esAdmin, personaje: miembro.personaje, email };
  }
  if (esAdmin) {
    return { user, miembro: null, esAdmin, personaje: "Admin", email };
  }
  return null;
}

// =====================================================
// Admin: gestión de miembros
// =====================================================

export async function listarMiembros(): Promise<MiembroRow[]> {
  const { data, error } = await supabase
    .from("miembros")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as MiembroRow[];
}

export async function altaMiembro(input: MiembroInsert): Promise<void> {
  const { error } = await supabase.from("miembros").insert({
    email: input.email.trim().toLowerCase(),
    personaje: input.personaje.trim(),
    activo: input.activo ?? true,
    notas: input.notas ?? null,
  });
  if (error) {
    if (error.code === "23505") throw new Error("Ese email ya está cargado.");
    throw new Error(error.message);
  }
}

export async function actualizarMiembro(
  id: string,
  patch: Partial<Pick<MiembroRow, "personaje" | "activo" | "notas">>,
): Promise<void> {
  const { error } = await supabase.from("miembros").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function eliminarMiembro(id: string): Promise<void> {
  const { error } = await supabase.from("miembros").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// =====================================================
// Admin: alta/clave/baja en UN paso, vía la ruta de API del servidor
// (app/api/admin/miembros/route.ts). Crea también el usuario de Authentication.
// =====================================================

export interface AltaResultado {
  email: string;
  personaje: string;
  /** Clave generada. null si el usuario de Authentication ya existía (conserva la suya). */
  clave: string | null;
  usuarioYaExistia: boolean;
}

async function llamarApiAdmin<T>(body: Record<string, unknown>): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sin sesión. Volvé a loguearte.");

  const res = await fetch("/api/admin/miembros", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
  return json;
}

export async function altaMiembroCompleta(email: string, personaje: string): Promise<AltaResultado> {
  return llamarApiAdmin<AltaResultado>({ accion: "alta", email, personaje });
}

export async function nuevaClaveMiembro(email: string): Promise<string> {
  const r = await llamarApiAdmin<{ clave: string }>({ accion: "nueva_clave", email });
  return r.clave;
}

export async function bajaMiembroCompleta(email: string): Promise<void> {
  await llamarApiAdmin<{ ok: true }>({ accion: "baja", email });
}

// =====================================================
// Registros compartidos
// =====================================================

export interface RegistrosCargados {
  /** Último registro por tipo (el vigente). */
  vigentes: Partial<Record<TipoEventoRegistro, EventoRegistroRow>>;
  /** Los últimos N registros de todos los tipos, más nuevo primero. */
  historial: EventoRegistroRow[];
}

export async function cargarRegistros(limiteHistorial = 30): Promise<RegistrosCargados> {
  const { data, error } = await supabase
    .from("eventos_registros")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limiteHistorial);
  if (error) throw new Error(error.message);

  const historial = (data ?? []) as EventoRegistroRow[];
  const vigentes: RegistrosCargados["vigentes"] = {};
  for (const r of historial) {
    if (!vigentes[r.tipo]) vigentes[r.tipo] = r; // viene ordenado desc: el primero de cada tipo es el último cargado
  }
  return { vigentes, historial };
}

export async function insertarRegistro(input: EventoRegistroInsert): Promise<void> {
  const { error } = await supabase.from("eventos_registros").insert(input);
  if (error) throw new Error(error.message);
}

export interface Aporte {
  personaje: string;
  cantidad: number;
}

/**
 * Ranking de aportes: cuántos registros cargó cada uno (todos los tipos,
 * historial completo). Se cuenta en el cliente; con miles de registros
 * seguirá siendo liviano porque solo trae una columna.
 */
export async function contarAportes(): Promise<Aporte[]> {
  const { data, error } = await supabase
    .from("eventos_registros")
    .select("cargado_por_personaje")
    .limit(5000);
  if (error) throw new Error(error.message);

  const conteo = new Map<string, number>();
  for (const fila of (data ?? []) as { cargado_por_personaje: string }[]) {
    const p = fila.cargado_por_personaje;
    conteo.set(p, (conteo.get(p) ?? 0) + 1);
  }
  return Array.from(conteo, ([personaje, cantidad]) => ({ personaje, cantidad })).sort(
    (a, b) => b.cantidad - a.cantidad || a.personaje.localeCompare(b.personaje),
  );
}

export async function eliminarRegistro(id: string): Promise<void> {
  const { error } = await supabase.from("eventos_registros").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// =====================================================
// Avatar por raza (27/08)
// =====================================================

/**
 * Cambia SOLO la raza del miembro logueado, vía la función `miembro_set_raza`
 * (security definer): la política de update de `miembros` sigue siendo admin.
 * Falla con mensaje claro si el logueado no tiene fila en `miembros`.
 */
export async function setMiRaza(raza: Raza | null): Promise<void> {
  const { error } = await supabase.rpc("miembro_set_raza", { nueva: raza });
  if (error) throw new Error(`No se pudo guardar el avatar: ${error.message}${error.code ? ` (código ${error.code})` : ""}`);
}

// =====================================================
// Asistencias: quién se apunta a qué registro (27/08)
// =====================================================

/** Asistencias de varios registros, agrupadas por registro_id (orden de llegada). */
export async function cargarAsistencias(registroIds: string[]): Promise<Record<string, AsistenciaRow[]>> {
  const out: Record<string, AsistenciaRow[]> = {};
  if (registroIds.length === 0) return out;
  const { data, error } = await supabase
    .from("eventos_asistencias")
    .select("*")
    .in("registro_id", registroIds)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  for (const a of (data ?? []) as AsistenciaRow[]) {
    (out[a.registro_id] ??= []).push(a);
  }
  return out;
}

/** Me apunto a un registro. Si ya estaba, no duplica (unique registro+email). */
export async function apuntarse(registroId: string, sesion: SesionMiembro, raza: Raza | null): Promise<void> {
  const fila: AsistenciaInsert = {
    registro_id: registroId,
    email: sesion.email,
    personaje: sesion.personaje,
    miembro_id: sesion.miembro?.id ?? null,
    raza,
  };
  const { error } = await supabase.from("eventos_asistencias").insert(fila);
  if (error && error.code !== "23505") {
    throw new Error(`No se pudo apuntar: ${error.message}${error.code ? ` (código ${error.code})` : ""}`);
  }
}

/** Me bajo de un registro (o el admin baja a alguien). */
export async function desapuntarse(registroId: string, email: string): Promise<void> {
  const { error } = await supabase
    .from("eventos_asistencias")
    .delete()
    .eq("registro_id", registroId)
    .eq("email", email.toLowerCase());
  if (error) throw new Error(`No se pudo bajar: ${error.message}${error.code ? ` (código ${error.code})` : ""}`);
}

// =====================================================
// Asistencias del calendario: apuntarse a una ocurrencia puntual (28/08)
// (distinto de eventos_asistencias, que apunta a registros de Gaion/bosses)
// =====================================================

import type { CalAsistenciaInsert, CalAsistenciaRow } from "./database.types";

/** Clave de agrupado de una ocurrencia: evento + inicio exacto. */
export function claveOcurrencia(eventoId: string, inicioMs: number): string {
  return `${eventoId}@${inicioMs}`;
}

/**
 * Asistencias de las ocurrencias entre dos instantes, agrupadas por
 * claveOcurrencia (orden de llegada).
 */
export async function cargarAsistenciasCalendario(
  desdeMs: number,
  hastaMs: number,
): Promise<Record<string, CalAsistenciaRow[]>> {
  const out: Record<string, CalAsistenciaRow[]> = {};
  const { data, error } = await supabase
    .from("calendario_asistencias")
    .select("*")
    .gte("inicio", new Date(desdeMs).toISOString())
    .lte("inicio", new Date(hastaMs).toISOString())
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  for (const a of (data ?? []) as CalAsistenciaRow[]) {
    (out[claveOcurrencia(a.evento_id, Date.parse(a.inicio))] ??= []).push(a);
  }
  return out;
}

/** Me apunto a una ocurrencia. Si ya estaba, no duplica (unique evento+inicio+email). */
export async function apuntarseCalendario(
  eventoId: string,
  inicioMs: number,
  sesion: SesionMiembro,
  raza: Raza | null,
): Promise<void> {
  const fila: CalAsistenciaInsert = {
    evento_id: eventoId,
    inicio: new Date(inicioMs).toISOString(),
    email: sesion.email,
    personaje: sesion.personaje,
    miembro_id: sesion.miembro?.id ?? null,
    raza,
  };
  const { error } = await supabase.from("calendario_asistencias").insert(fila);
  if (error && error.code !== "23505") {
    throw new Error(`No se pudo apuntar: ${error.message}${error.code ? ` (código ${error.code})` : ""}`);
  }
}

/** Me bajo de una ocurrencia (o el admin baja a alguien). */
export async function desapuntarseCalendario(
  eventoId: string,
  inicioMs: number,
  email: string,
): Promise<void> {
  const { error } = await supabase
    .from("calendario_asistencias")
    .delete()
    .eq("evento_id", eventoId)
    .eq("inicio", new Date(inicioMs).toISOString())
    .eq("email", email.toLowerCase());
  if (error) throw new Error(`No se pudo bajar: ${error.message}${error.code ? ` (código ${error.code})` : ""}`);
}
