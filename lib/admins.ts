/**
 * Lista de emails de admin. Hardcodeada por simplicidad.
 * Vive en un módulo sin dependencias para poder usarla tanto en el navegador
 * (lib/auth.ts) como en las rutas de API del servidor (app/api/...).
 */
export const ADMIN_EMAILS = [
  "santic1228@gmail.com",
];

export function esEmailAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
