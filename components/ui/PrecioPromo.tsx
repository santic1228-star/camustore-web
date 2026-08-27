"use client";

/**
 * Precio de una tarjeta del catálogo, con el hot sale aplicado si está vigente.
 *
 * El hot sale NO toca la DB: el precio de lista se lee tal cual está guardado
 * (o se calcula con las fórmulas) y el descuento se aplica acá, al mostrarlo.
 * Apagar la promo devuelve todos los precios a su valor original sin migrar
 * una sola fila.
 */

import { CONFIG } from "@/lib/config";
import { useAhora, useCfg } from "@/lib/precios-contexto";
import { aplicarHotSale, type CategoriaPrecio, type PrecioConPromo } from "@/lib/precios-config";

/**
 * Precio final de venta para una categoría, con promo si corresponde.
 * Lo usan las tarjetas para el número que muestran, para el carrito y para el
 * mensaje de WhatsApp — así los tres dicen exactamente lo mismo.
 */
export function usePrecioPromo(precioLista: number, categoria: CategoriaPrecio): PrecioConPromo {
  const cfg = useCfg();
  const ahora = useAhora();
  // Antes de que monte el reloj no aplicamos promo: así el HTML del servidor y
  // el del cliente coinciden y no se rompe la hidratación.
  return aplicarHotSale(precioLista, cfg, categoria, ahora ?? 0);
}

interface Props {
  precio: PrecioConPromo;
  /** "card" = tarjetas del catálogo. "compacto" = listas y filas. */
  variante?: "card" | "compacto";
  /** Texto arriba del número. */
  etiqueta?: string;
}

export default function PrecioPromo({ precio, variante = "card", etiqueta = "Precio" }: Props) {
  const grande = variante === "card";

  return (
    <div>
      {/* Cartel marketinero (solo en tarjetas): "🔥 HOT SALE · 30% OFF".
          El texto sale del panel de precios (Texto del cartel); el % es el que
          efectivamente aplica a esta categoría (global u override). */}
      {grande && precio.enPromo && <CartelPromo precio={precio} />}

      <div className="flex items-center gap-1.5">
        <p className="text-xs text-text-muted uppercase tracking-wider font-body">{etiqueta}</p>
        {precio.enPromo && (
          <span className="badge bg-danger-red/15 text-danger-red border border-danger-red/50 text-[10px] font-bold">
            −{precio.pct}%
          </span>
        )}
      </div>

      {precio.enPromo && (
        <p className="font-numeric text-xs text-text-muted line-through leading-none mb-0.5">
          {precio.original.toLocaleString("es-AR")}
        </p>
      )}

      <p
        className={`font-numeric font-bold leading-none ${
          grande ? "text-xl sm:text-2xl" : "text-base"
        } ${precio.enPromo ? "text-danger-red" : "neon-text-orange"}`}
      >
        {precio.final.toLocaleString("es-AR")}
        <span className="text-xs ml-1 text-text-secondary font-body">{CONFIG.CURRENCY}</span>
      </p>
    </div>
  );
}

/** Cinta roja con brillo, pensada para llamar la atención en el catálogo. */
export function CartelPromo({ precio, className = "" }: { precio: PrecioConPromo; className?: string }) {
  if (!precio.enPromo) return null;
  return (
    <div
      className={`inline-flex items-center gap-1.5 mb-1.5 px-2.5 py-1 rounded-sm bg-gradient-to-r from-danger-red to-neon-orange text-bg-deep font-display font-black text-[11px] sm:text-xs uppercase tracking-[0.18em] shadow-[0_0_16px_rgba(255,51,102,0.55)] ${className}`}
      aria-label={`${precio.etiqueta}, ${precio.pct}% de descuento`}
    >
      <span aria-hidden>🔥</span>
      <span>{precio.etiqueta}</span>
      <span className="opacity-60">·</span>
      <span className="font-numeric">{precio.pct}% OFF</span>
    </div>
  );
}

/**
 * Línea para el mensaje de WhatsApp. Si hay promo, deja constancia del precio
 * de lista para que el cliente vea el descuento que se le está haciendo.
 */
export function lineaPrecioWhatsapp(precio: PrecioConPromo): string {
  if (!precio.enPromo) {
    return `• Precio: ${precio.final.toLocaleString("es-AR")} ${CONFIG.CURRENCY}`;
  }
  return (
    `• Precio: ${precio.final.toLocaleString("es-AR")} ${CONFIG.CURRENCY} ` +
    `(${precio.etiqueta} −${precio.pct}% · antes ${precio.original.toLocaleString("es-AR")})`
  );
}

/** Detalle para la línea del carrito. */
export function detallePromoCarrito(precio: PrecioConPromo): string {
  return precio.enPromo ? ` · ${precio.etiqueta} −${precio.pct}%` : "";
}
