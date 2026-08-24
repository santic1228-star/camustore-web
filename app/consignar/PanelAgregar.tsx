"use client";

import { useEffect, useRef, useState } from "react";
import { CONFIG } from "@/lib/config";
import {
  calcularDesgloseConsignante,
  labelLinea,
  precioSugeridoCompra,
  precioSugeridoVenta,
  type LineaConsignacion,
} from "@/lib/consignacion";

/** Comisión default de la tienda (DECISIONES §6). El admin puede editarla por ítem al aprobar. */
export const COMISION_PCT = 20;

interface Props {
  /** Línea armada por el form, o null si todavía faltan datos. */
  linea: LineaConsignacion | null;
  /** Por qué no se puede consignar todavía (falta un dato o el ítem no se compra). */
  motivo?: string;
  onAgregar: (linea: LineaConsignacion, precioVenta: number) => void;
}

export default function PanelAgregar({ linea, motivo, onAgregar }: Props) {
  const [flash, setFlash] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const compra = linea ? precioSugeridoCompra(linea) : null;
  const venta = linea ? precioSugeridoVenta(linea) : null;
  const cotiza = linea !== null && compra !== null && venta !== null && venta > 0;
  const desglose = cotiza && venta !== null ? calcularDesgloseConsignante(venta, COMISION_PCT) : null;

  function agregar() {
    if (!linea || !desglose) return;
    onAgregar(linea, desglose.precioVenta);
    setFlash(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setFlash(false), 1600);
  }

  return (
    <div className="gamer-card rounded-lg p-5 sm:p-6">
      <p className="font-body text-xs uppercase tracking-[0.3em] text-text-muted mb-3">
        Consignación
      </p>

      {linea && desglose ? (
        <>
          <p className="font-body text-xs text-text-secondary">{labelLinea(linea)}</p>
          <p className="font-numeric font-black text-3xl sm:text-4xl neon-text-cyan tabular-nums mt-1">
            {desglose.precioVenta.toLocaleString("es-AR")}{" "}
            <span className="text-lg">{CONFIG.CURRENCY}</span>
          </p>
          <p className="font-body text-[11px] uppercase tracking-wider text-text-muted mt-1">
            Precio de venta sugerido
          </p>

          <div className="mt-4 space-y-1.5 font-body text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-text-secondary">Comisión CamuStore ({COMISION_PCT}%)</span>
              <span className="font-numeric text-neon-orange tabular-nums whitespace-nowrap">
                −{desglose.comisionTienda.toLocaleString("es-AR")} {CONFIG.CURRENCY}
              </span>
            </div>
            <div className="flex justify-between gap-3 border-t border-border-base pt-1.5">
              <span className="text-text-primary font-bold">Te llevás ({100 - COMISION_PCT}%)</span>
              <span className="font-numeric font-bold text-success-green tabular-nums whitespace-nowrap">
                {desglose.pagoConsignante.toLocaleString("es-AR")} {CONFIG.CURRENCY}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={agregar}
            className={`w-full mt-5 px-5 py-3 rounded font-body text-sm uppercase tracking-widest transition-all ${
              flash
                ? "bg-success-green/15 text-success-green border border-success-green/50"
                : "btn-primary"
            }`}
          >
            {flash ? "✓ Agregado al lote" : "+ Agregar al lote"}
          </button>
        </>
      ) : (
        <>
          <p className="font-numeric font-black text-3xl text-text-muted/40 select-none">
            — {CONFIG.CURRENCY}
          </p>
          <p className="font-body text-sm text-text-secondary mt-3 leading-relaxed">
            {motivo || "Completá los datos del ítem para ver el precio sugerido."}
          </p>
          <button
            type="button"
            disabled
            className="w-full mt-5 px-5 py-3 rounded font-body text-sm uppercase tracking-widest bg-bg-card border border-border-base text-text-muted cursor-not-allowed"
          >
            + Agregar al lote
          </button>
        </>
      )}

      <p className="font-body text-[10px] text-text-muted mt-4 leading-relaxed">
        Los precios son sugeridos y pueden variar por promociones. Camus revisa cada ítem y confirma
        el precio al aprobar.
      </p>
    </div>
  );
}
