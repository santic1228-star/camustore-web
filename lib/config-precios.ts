/**
 * Configuración de precios — acceso a datos (Supabase).
 *
 * La tabla `config_precios` es APPEND-ONLY: guardar nunca pisa nada, inserta
 * una fila nueva. La más reciente es la vigente. Consecuencias buenas:
 *   - historial completo de cambios de precios, con autor y fecha;
 *   - "volver atrás" = insertar de nuevo una config vieja (un click);
 *   - apagar un hot sale no puede dejar la tienda en un estado intermedio.
 *
 * La lógica pura (qué significa cada coeficiente) vive en `precios-config.ts`.
 * Acá solo lectura y escritura.
 */

import { supabase } from "./supabase";
import { CONFIG_PRECIOS_DEFAULT, fusionarConfig, type ConfigPrecios } from "./precios-config";
import type { ConfigPreciosRow } from "./database.types";

export interface ResultadoGuardado {
  ok: boolean;
  /** Mensaje técnico (mensaje + código de Supabase) para mostrar en la UI. */
  error: string | null;
  fila: ConfigPreciosRow | null;
}

/**
 * Guarda una configuración nueva. Devuelve el error con detalle técnico en vez
 * de tragárselo: si algo falla, Santi puede mandar la captura (lección 24/08).
 */
export async function guardarConfig(
  valores: ConfigPrecios,
  creadoPorEmail: string,
  nota?: string | null
): Promise<ResultadoGuardado> {
  const { data, error } = await supabase
    .from("config_precios")
    .insert({
      valores: valores as unknown as Record<string, unknown>,
      nota: nota?.trim() || null,
      creado_por_email: creadoPorEmail.toLowerCase(),
    })
    .select()
    .single();

  if (error) {
    return {
      ok: false,
      error: `${error.message}${error.code ? ` (código ${error.code})` : ""}`,
      fila: null,
    };
  }
  return { ok: true, error: null, fila: data as ConfigPreciosRow };
}

/** Historial de cambios, del más nuevo al más viejo. */
export async function listarHistorial(limite = 20): Promise<{
  filas: ConfigPreciosRow[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("config_precios")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limite);

  if (error) {
    return { filas: [], error: `${error.message}${error.code ? ` (${error.code})` : ""}` };
  }
  return { filas: (data as ConfigPreciosRow[]) || [], error: null };
}

/** Config completa de una fila del historial (con los defaults completando huecos). */
export function configDeFila(fila: ConfigPreciosRow): ConfigPrecios {
  return fusionarConfig(CONFIG_PRECIOS_DEFAULT, fila.valores);
}

/**
 * Vuelve a una configuración del historial: la re-inserta como fila nueva.
 * No borra nada — el "deshacer" también queda registrado.
 */
export async function restaurarConfig(
  fila: ConfigPreciosRow,
  creadoPorEmail: string
): Promise<ResultadoGuardado> {
  const fecha = new Date(fila.created_at).toLocaleString("es-AR");
  return guardarConfig(configDeFila(fila), creadoPorEmail, `Restaurada la versión del ${fecha}`);
}
