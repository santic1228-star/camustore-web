/**
 * Helpers de autenticación y verificación de admin.
 */

import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";

/**
 * Manda un magic link al email del usuario para loguearse.
 * El link redirige a /admin después del login.
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
 * Verifica si el email del usuario actual está en la tabla `admins`.
 * Returns null si no es admin (o no está logueado).
 */
export async function checkIsAdmin(user: User | null): Promise<boolean> {
  if (!user?.email) return false;
  const { data, error } = await supabase
    .from("admins")
    .select("email")
    .eq("email", user.email)
    .maybeSingle();
  if (error) {
    console.warn("Error checkeando admin:", error);
    return false;
  }
  return !!data;
}
