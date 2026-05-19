/**
 * Helpers de autenticación y verificación de admin.
 */

import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";

/**
 * Login con email + contraseña (para admins).
 */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<{ error?: string }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error("Error en login:", error);
    return { error: error.message };
  }
  return {};
}

/**
 * Manda un magic link al email del usuario para loguearse (para jugadores).
 */
export async function sendMagicLink(email: string): Promise<{ error?: string }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/admin`,
    },
  });
  if (error) {
    console.error("Error enviando magic link:", error);
    return { error: error.message };
  }
  return {};
}

/**
 * Cierra la sesión del usuario actual.
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Verifica si el usuario actual es admin llamando a la función SQL `is_admin()`.
 * Usar RPC en vez de SELECT directo porque la función tiene security definer
 * y bypasea el RLS de la tabla `admins`.
 */
export async function checkIsAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;
  const { data, error } = await supabase.rpc("is_admin");
  if (error) {
    console.warn("Error checkeando admin:", error);
    return false;
  }
  return data === true;
}
