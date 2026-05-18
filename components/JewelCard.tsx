"use client";

import { CONFIG, whatsappLink } from "@/lib/config";
import { JEWEL_LABELS } from "@/lib/precios";
import type { TipoJewel } from "@/lib/database.types";

interface Props {
  group: {
    tipo: TipoJewel;
    totalBundles: number;
    precioPorBundle: number;
  };
}

const ICONOS_JEWEL: Record<TipoJewel, string> = {
  chaos: "🌀",
  creation: "✨",
  soul: "👻",
  bless: "🌟",
};

const COLORS_JEWEL: Record<TipoJewel, string> = {
  chaos: "border-purple-500/40",
  creation: "border-pink-500/40",
  soul: "border-blue-500/40",
  bless: "border-luck-gold/40",
};

export default function JewelCard({ group }: Props) {
  const { tipo, totalBundles, precioPorBundle } = group;
  const totalJewels = totalBundles * 30;
  const label = JEWEL_LABELS[tipo];

  const wpMsg = `${CONFIG.WHATSAPP_GREETING} Quiero comprar ${label}.
Stock disponible: ${totalBundles} bundle${totalBundles === 1 ? "" : "s"} (${totalJewels} jewels)
Precio: ${precioPorBundle.toLocaleString("es-AR")} ${CONFIG.CURRENCY} por bundle`;

  return (
    <div className={`gamer-card rounded-lg p-5 border ${COLORS_JEWEL[tipo]} flex flex-col gap-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{ICONOS_JEWEL[tipo]}</span>
          <h3 className="font-display font-bold text-lg text-text-primary uppercase">
            {label.replace("Jewel of ", "")}
          </h3>
        </div>
        <span className="badge bg-success-green/15 text-success-green border border-success-green/40">
          stock
        </span>
      </div>

      <div className="border-t border-border-base pt-3 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] font-body text-text-muted uppercase tracking-wider mb-0.5">
            Disponibles
          </p>
          <p className="font-numeric font-bold text-neon-cyan">
            {totalBundles} <span className="text-xs">bundles</span>
          </p>
          <p className="text-[10px] font-body text-text-muted mt-0.5">
            ({totalJewels.toLocaleString("es-AR")} jewels)
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-body text-text-muted uppercase tracking-wider mb-0.5">
            Precio bundle
          </p>
          <p className="font-numeric font-bold text-xl neon-text-orange">
            {precioPorBundle.toLocaleString("es-AR")}
          </p>
          <p className="text-[10px] font-body text-text-muted">{CONFIG.CURRENCY}</p>
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
