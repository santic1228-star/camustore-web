/**
 * Configuración global de CamuStore.
 * Editá estos valores para personalizar la tienda.
 */

export const CONFIG = {
  // Nombre de la tienda
  STORE_NAME: "CamuStore",
  STORE_TAGLINE: "Items de Mu Online · Servidor Guerra Eterna",

  // WhatsApp — IMPORTANTE: reemplazá con tu número real (sin +, sin espacios)
  // Formato: código país + código área + número. Ej Argentina Córdoba: 5493514567890
  WHATSAPP_NUMBER: "5493510000000",

  // Texto que aparece en mensajes de consulta de items
  WHATSAPP_GREETING: "Hola CamuStore!",

  // Moneda
  CURRENCY: "WC",
} as const;

/**
 * Genera un link de WhatsApp con mensaje prellenado.
 */
export function whatsappLink(message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encoded}`;
}
