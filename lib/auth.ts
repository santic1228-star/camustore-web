/**
 * Helpers de autenticación y verificación de admin.
 */

import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";
import { esEmailAdmin } from "./admins";

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
 * Verifica si el usuario actual es admin.
 * Compara el email del usuario contra la lista hardcodeada en lib/admins.ts.
 *
 * Esto es robusto porque solo necesita el JWT del cliente (que ya tenemos),
 * no hace queries adicionales que puedan colgarse.
 */
export async function checkIsAdmin(user: User | null): Promise<boolean> {
  return esEmailAdmin(user?.email);
}
