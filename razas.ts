"use client";

import { CONFIG, whatsappLink } from "@/lib/config";
import { JEWEL_LABELS } from "@/lib/precios";
import { trackEvento } from "@/lib/analytics";
import type { TipoJewel } from "@/lib/database.types";

interface Props {
  group: {
    tipo: TipoJewel;
    esEspecial: boolean;
    totalUnidades: number;       // bundles si regular, cantidad si especial
    precioUnitario: number;      // por bundle (regular) o por jewel (especial)
  };
}

const ICONOS_JEWEL: Record<TipoJewel, string> = {
  chaos: "🌀",
  creation: "✨",
  soul: "👻",
  bless: "🌟",
  harmony: "🎵",
  life: "💚",
  socket: "🔌",
  luck_jewel: "🍀",
  skill_jewel: "⚡",
  additional: "➕",
};

const COLORS_JEWEL: Record<TipoJewel, string> = {
  chaos: "border-purple-500/40",
  creation: "border-pink-500/40",
  soul: "border-blue-500/40",
  bless: "border-luck-gold/40",
  harmony: "border-cyan-500/40",
  life: "border-green-500/40",
  socket: "border-luck-gold/60",
  luck_jewel: "border-luck-gold/60",
  skill_jewel: "border-luck-gold/60",
  additional: "border-luck-gold/60",
};

export default function JewelCard({ group }: Props) {
  const { tipo, esEspecial, totalUnidades, precioUnitario } = group;
  const label = JEWEL_LABELS[tipo];
  const totalJewels = esEspecial ? totalUnidades : totalUnidades * 30;
  const unidadLabel = esEspecial ? "unidad" : "bundle";
  const unidadesLabelPlural = esEspecial ? "unidades" : "bundles";

  const wpMsg = esEspecial
    ? `${CONFIG.WHATSAPP_GREETING} Quiero comprar ${label}.
Stock disponible: ${totalUnidades} unidad${totalUnidades === 1 ? "" : "es"}
Precio: ${precioUnitario.toLocaleString("es-AR")} ${CONFIG.CURRENCY} c/u`
    : `${CONFIG.WHATSAPP_GREETING} Quiero comprar ${label}.
Stock disponible: ${totalUnidades} bundle${totalUnidades === 1 ? "" : "s"} (${totalJewels} jewels)
Precio: ${precioUnitario.toLocaleString("es-AR")} ${CONFIG.CURRENCY} por bundle`;

  return (
    <div className={`gamer-card rounded-lg p-5 border ${COLORS_JEWEL[tipo]} flex flex-col gap-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{ICONOS_JEWEL[tipo]}</span>
          <h3 className="font-display font-bold text-lg text-text-primary uppercase">
            {label.replace("Jewel of ", "")}
          </h3>
        </div>
        {esEspecial ? (
          <span className="badge bg-luck-gold/15 text-luck-gold border border-luck-gold/40">
            especial
          </span>
        ) : (
          <span className="badge bg-success-green/15 text-success-green border border-success-green/40">
            stock
          </span>
        )}
      </div>

      <div className="border-t border-border-base pt-3 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] font-body text-text-muted uppercase tracking-wider mb-0.5">
            Disponibles
          </p>
          <p className="font-numeric font-bold text-neon-cyan">
            {totalUnidades} <span className="text-xs">{unidadesLabelPlural}</span>
          </p>
          {!esEspecial && (
            <p className="text-[10px] font-body text-text-muted mt-0.5">
              ({totalJewels.toLocaleString("es-AR")} jewels)
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[10px] font-body text-text-muted uppercase tracking-wider mb-0.5">
            Precio
          </p>
          <p className="font-numeric font-bold text-xl neon-text-orange">
            {precioUnitario.toLocaleString("es-AR")}
          </p>
          <p className="text-[10px] font-body text-text-muted">{CONFIG.CURRENCY} / {unidadLabel}</p>
        </div>
      </div>

      <a
        href={whatsappLink(wpMsg)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvento({
          tipo: "consultar_jewel",
          item_categoria: "jewel",
          item_nombre: label,
          item_precio: precioUnitario,
        })}
        className="btn-primary block text-center px-4 py-2 rounded font-body text-xs uppercase tracking-widest mt-1"
      >
        Consultar
      </a>
    </div>
  );
}
