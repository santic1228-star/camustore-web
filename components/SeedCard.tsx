"use client";

import { CONFIG, whatsappLink } from "@/lib/config";
import { SEED_LABELS } from "@/lib/precios";
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
  const label = SEED_LABELS[tipo];

  const wpMsg = `${CONFIG.WHATSAPP_GREETING} Quiero comprar ${label}${ensamblada_penta ? " (Penta Sphere)" : ""}.
Stock disponible: ${totalCantidad} unidad${totalCantidad === 1 ? "" : "es"}
Precio: ${precioUnidad.toLocaleString("es-AR")} ${CONFIG.CURRENCY} por unidad`;

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
          <p className="text-[10px] font-body text-text-muted uppercase tracking-wider mb-0.5">
            Precio
          </p>
          <p className="font-numeric font-bold text-xl neon-text-orange">
            {precioUnidad.toLocaleString("es-AR")}
          </p>
          <p className="text-[10px] font-body text-text-muted">{CONFIG.CURRENCY} / unidad</p>
        </div>
      </div>

      <a
        href={whatsappLink(wpMsg)}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary block text-center px-4 py-2 rounded font-body text-xs uppercase tracking-widest mt-1"
      >
        Consultar
      </a>
    </div>
  );
}
