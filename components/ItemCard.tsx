"use client";

import { CONFIG, whatsappLink } from "@/lib/config";
import { RAZA_COLORS } from "@/lib/razas";
import { trackEvento } from "@/lib/analytics";
import { useCarrito } from "@/lib/carrito";
import PrecioPromo, { usePrecioPromo, lineaPrecioWhatsapp, detallePromoCarrito } from "@/components/ui/PrecioPromo";
import type { CategoriaPrecio } from "@/lib/precios-config";
import type { Item } from "@/lib/types";

interface Props {
  item: Item;
}

export default function ItemCard({ item }: Props) {
  const raceColor = RAZA_COLORS[item.raza] || RAZA_COLORS[""];
  const isLuck = item.luck;
  const { agregar } = useCarrito();
  const precio = usePrecioPromo(item.precio_venta, item.categoria as CategoriaPrecio);

  const wpMessage = `${CONFIG.WHATSAPP_GREETING} Me interesa este item:
• ${item.nombre} ${item.parte}
• Tipo: ${item.tipo} ${item.socket ? `· socket ${item.socket}` : ""}
• Nivel ${item.nivel} · ${item.opciones} ${item.luck ? "· luck" : ""}
${lineaPrecioWhatsapp(precio)}`;

  function onConsultar() {
    trackEvento({
      tipo: "consultar_item",
      item_categoria: item.categoria,
      item_nombre: `${item.nombre} ${item.parte}`.trim(),
      item_tipo: item.tipo,
      item_precio: precio.final,
    });
  }

  return (
    <article
      className={`gamer-card rounded-lg p-4 flex flex-col gap-3 ${isLuck ? "neon-border-gold" : ""}`}
    >
      {/* Header con nombre y raza */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display font-bold text-base sm:text-lg leading-tight text-text-primary">
            {item.nombre}
          </h3>
          <p className="font-body text-xs text-text-secondary mt-0.5">{item.parte}</p>
        </div>
        {item.raza && (
          <span
            className="badge"
            style={{
              color: raceColor,
              backgroundColor: `${raceColor}15`,
              border: `1px solid ${raceColor}50`,
            }}
          >
            {item.raza}
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 text-xs font-body">
        <Stat label="Nivel" value={String(item.nivel)} />
        <Stat label="Tipo" value={item.tipo || "—"} accent />
        <Stat
          label="Socket"
          value={item.socket !== null && item.socket !== undefined ? String(item.socket) : "—"}
        />
      </div>

      {/* Opciones */}
      <div className="text-xs font-body text-text-secondary border-t border-border-base pt-2">
        <span className="text-text-muted">Opciones: </span>
        <span className="text-text-primary">{item.opciones}</span>
        {isLuck && (
          <span className="ml-1 font-bold text-luck-gold">+ LUCK</span>
        )}
      </div>

      {/* Precio */}
      <div className="flex items-end justify-between mt-1">
        <PrecioPromo precio={precio} />
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => agregar({
              tipo: "compra",
              titulo: `${item.nombre} ${item.parte}`.trim(),
              detalle: `${item.tipo}${item.socket ? ` · ${item.socket} sock` : ""} · nv${item.nivel}${item.luck ? " · luck" : ""}${detallePromoCarrito(precio)}`,
              precio: precio.final,
            })}
            className="bg-neon-cyan/15 border border-neon-cyan/50 text-neon-cyan px-3 py-2 rounded text-xs font-body uppercase tracking-wider hover:bg-neon-cyan/25 transition-colors"
          >
            + Agregar
          </button>
          <a
            href={whatsappLink(wpMessage)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onConsultar}
            className="btn-whatsapp px-3 py-2 rounded text-xs font-body uppercase tracking-wider text-center"
          >
            Consultar
          </a>
        </div>
      </div>
    </article>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-text-muted uppercase tracking-wider text-[10px]">{label}</span>
      <span className={`font-numeric font-bold ${accent ? "neon-text-cyan" : "text-text-primary"}`}>
        {value}
      </span>
    </div>
  );
}
