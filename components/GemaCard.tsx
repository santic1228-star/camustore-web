"use client";

import { CONFIG, whatsappLink } from "@/lib/config";
import { GEMA_LABELS } from "@/lib/precios";
import { trackEvento } from "@/lib/analytics";
import type { TipoGema } from "@/lib/database.types";

interface Props {
  group: {
    tipo: TipoGema;
    totalCantidad: number;
    precioUnitario: number;
  };
}

const ICONOS: Partial<Record<TipoGema, string>> = {
  gema_item_s3: "💠",
  gema_alas_s3: "💠",
  gema_seed: "🌟",
  gema_item_380: "💠",
  gema_item_400: "💠",
  gema_gp: "🔷",
  ring_wheel: "💍",
  item_acc: "📿",
  purple_box: "🟣",
  chaos_box: "🎁",
  kundun_box_5: "📦",
  kundun_box_4: "📦",
};

export default function GemaCard({ group }: Props) {
  const { tipo, totalCantidad, precioUnitario } = group;
  const label = GEMA_LABELS[tipo];
  const icono = ICONOS[tipo] || "🔮";

  const wpMsg = `${CONFIG.WHATSAPP_GREETING} Quiero comprar ${label}.
Stock disponible: ${totalCantidad} unidad${totalCantidad === 1 ? "" : "es"}
Precio: ${precioUnitario.toLocaleString("es-AR")} ${CONFIG.CURRENCY} c/u`;

  return (
    <div className="gamer-card rounded-lg p-5 border border-purple-500/30 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icono}</span>
          <h3 className="font-display font-bold text-base text-text-primary uppercase leading-tight">
            {label}
          </h3>
        </div>
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
            {precioUnitario.toLocaleString("es-AR")}
          </p>
          <p className="text-[10px] font-body text-text-muted">{CONFIG.CURRENCY} / unidad</p>
        </div>
      </div>

      <a
        href={whatsappLink(wpMsg)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvento({
          tipo: "consultar_jewel",
          item_categoria: "gema",
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
