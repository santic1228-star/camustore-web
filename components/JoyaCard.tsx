"use client";

import { CONFIG, whatsappLink } from "@/lib/config";
import { JOYA_LABELS } from "@/lib/precios";
import { trackEvento } from "@/lib/analytics";
import type { JoyaPublico } from "@/lib/database.types";

interface Props {
  joya: JoyaPublico;
}

export default function JoyaCard({ joya }: Props) {
  const { tipo, nombre, nivel, life_recovery, tercera_opcion, precio_venta } = joya;
  const icono = tipo === "anillo" ? "💍" : "📿";
  const label = JOYA_LABELS[tipo];

  const terceraLabel = tercera_opcion === "speed7" ? "speed +7" : tercera_opcion === "dmglvl20" ? "dmg lvl/20" : null;

  const opcionesPendiente = tipo === "pendiente"
    ? `exe rate 10%, dmg +2%${terceraLabel ? `, ${terceraLabel}` : ""}, Life Recovery`
    : null;

  const wpMsg = `${CONFIG.WHATSAPP_GREETING} Me interesa esta joya:
• ${label}${nombre ? ` "${nombre}"` : ""} +${nivel}
• Life Recovery: ${life_recovery}%
${tipo === "anillo" ? "• HP + DD + REF" : `• ${opcionesPendiente}`}
• Precio: ${precio_venta.toLocaleString("es-AR")} ${CONFIG.CURRENCY}`;

  return (
    <div className="gamer-card rounded-lg p-5 border border-luck-gold/30 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icono}</span>
          <div>
            <h3 className="font-display font-bold text-base text-text-primary uppercase leading-tight">
              {label}{nombre ? <span className="text-text-secondary normal-case"> · {nombre}</span> : ""}
            </h3>
            <p className="font-numeric text-xs text-text-muted">+{nivel}</p>
          </div>
        </div>
        <span className="badge bg-luck-gold/15 text-luck-gold border border-luck-gold/40">
          {life_recovery}% life
        </span>
      </div>

      <div className="border-t border-border-base pt-3 space-y-1">
        <p className="font-body text-[11px] text-text-secondary">
          {tipo === "anillo" ? "HP + DD + REF" : opcionesPendiente}
        </p>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-body text-text-muted uppercase tracking-wider mb-0.5">Precio</p>
          <p className="font-numeric font-bold text-xl neon-text-orange">
            {precio_venta.toLocaleString("es-AR")}
          </p>
          <p className="text-[10px] font-body text-text-muted">{CONFIG.CURRENCY}</p>
        </div>
        <a
          href={whatsappLink(wpMsg)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvento({
            tipo: "consultar_item",
            item_categoria: "joya",
            item_nombre: `${label}${nombre ? ` ${nombre}` : ""} +${nivel} ${life_recovery}%`,
            item_precio: precio_venta,
          })}
          className="btn-whatsapp px-4 py-2 rounded text-xs font-body uppercase tracking-wider"
        >
          Consultar
        </a>
      </div>
    </div>
  );
}
