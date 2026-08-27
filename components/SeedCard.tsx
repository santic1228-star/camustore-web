"use client";

import { CONFIG, whatsappLink } from "@/lib/config";
import { usePrecioPromo, detallePromoCarrito } from "@/components/ui/PrecioPromo";
import { useCarrito } from "@/lib/carrito";
import { SEED_LABELS } from "@/lib/precios";
import { trackEvento } from "@/lib/analytics";
import type { TipoSeed } from "@/lib/database.types";

interface Props {
  group: {
    tipo: TipoSeed;
    ensamblada_penta: boolean;
    totalCantidad: number;
    precioUnidad: number;
  };
}

export default function SeedCard({ group }: Props) {
  const { tipo, ensamblada_penta, totalCantidad, precioUnidad } = group;
  const precio = usePrecioPromo(precioUnidad, "seed");
  const { agregar } = useCarrito();
  const label = SEED_LABELS[tipo];

  const wpMsg = `${CONFIG.WHATSAPP_GREETING} Quiero comprar ${label}${ensamblada_penta ? " (Penta Sphere)" : ""}.
Stock disponible: ${totalCantidad} unidad${totalCantidad === 1 ? "" : "es"}
Precio: ${precio.final.toLocaleString("es-AR")} ${CONFIG.CURRENCY} por unidad${precio.enPromo ? ` (${precio.etiqueta} −${precio.pct}%, antes ${precio.original.toLocaleString("es-AR")})` : ""}`;

  const borderColor = ensamblada_penta ? "border-luck-gold/50" : "border-success-green/30";

  return (
    <div className={`gamer-card rounded-lg p-5 border ${borderColor} flex flex-col gap-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌱</span>
          <h3 className="font-display font-bold text-lg text-text-primary uppercase">
            {label}
          </h3>
        </div>
        {ensamblada_penta && (
          <span className="badge bg-luck-gold/15 text-luck-gold border border-luck-gold/40">
            Penta
          </span>
        )}
      </div>

      <div className="border-t border-border-base pt-3 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] font-body text-text-muted uppercase tracking-wider mb-0.5">
            Disponibles
          </p>
          <p className="font-numeric font-bold text-neon-cyan">
            {totalCantidad} <span className="text-xs">{totalCantidad === 1 ? "unidad" : "unidades"}</span>
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1.5 mb-0.5">
            <p className="text-[10px] font-body text-text-muted uppercase tracking-wider">
              Precio
            </p>
            {precio.enPromo && (
              <span className="badge bg-danger-red/15 text-danger-red border border-danger-red/50 text-[9px] font-bold">
                −{precio.pct}%
              </span>
            )}
          </div>
          {precio.enPromo && (
            <p className="font-numeric text-[11px] text-text-muted line-through leading-none">
              {precio.original.toLocaleString("es-AR")}
            </p>
          )}
          <p className={`font-numeric font-bold text-xl ${precio.enPromo ? "text-danger-red" : "neon-text-orange"}`}>
            {precio.final.toLocaleString("es-AR")}
          </p>
          <p className="text-[10px] font-body text-text-muted">{CONFIG.CURRENCY} / unidad</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mt-1">
        <button
          onClick={() => agregar({
            tipo: "compra",
            titulo: `${label}${ensamblada_penta ? " (Penta)" : ""}`,
            detalle: `${totalCantidad} u.${detallePromoCarrito(precio)}`,
            precio: precio.final,
          })}
          className="bg-neon-cyan/15 border border-neon-cyan/50 text-neon-cyan px-4 py-2 rounded font-body text-xs uppercase tracking-widest hover:bg-neon-cyan/25 transition-colors"
        >
          + Agregar al pedido
        </button>
        <a
          href={whatsappLink(wpMsg)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvento({
            tipo: "consultar_jewel",
            item_categoria: "seed",
            item_nombre: `${label}${ensamblada_penta ? " (Penta)" : ""}`,
            item_precio: precio.final,
          })}
          className="btn-primary block text-center px-4 py-2 rounded font-body text-xs uppercase tracking-widest"
        >
          Consultar
        </a>
      </div>
    </div>
  );
}
