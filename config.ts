"use client";

import { CONFIG, whatsappLink } from "@/lib/config";
import { trackEvento } from "@/lib/analytics";

interface Props {
  precio: number | null;
  /** Descripción del item para el mensaje de WhatsApp */
  descripcion: string;
  /** Mensaje cuando no se puede cotizar (falta dato o item no se compra) */
  motivoNoPrecio?: string;
  /** Para analytics: categoría del item cotizado */
  categoria?: string;
  /** Para analytics: nombre del item cotizado */
  nombre?: string;
}

export default function PriceResult({ precio, descripcion, motivoNoPrecio, categoria, nombre }: Props) {
  const tienePrecio = precio !== null && precio > 0;
  const formattedPrecio = precio !== null ? precio.toLocaleString("es-AR") : "—";

  const wpMessage = `${CONFIG.WHATSAPP_GREETING} Quiero vender este item:
${descripcion}
Cotización: ${formattedPrecio} ${CONFIG.CURRENCY}`;

  function onCotizar() {
    trackEvento({
      tipo: "cotizar",
      item_categoria: categoria ?? null,
      item_nombre: nombre || "(cotización)",
      item_precio: precio,
    });
  }

  return (
    <div className={`gamer-card rounded-lg p-6 sm:p-8 ${tienePrecio ? "neon-border-cyan animate-pulse-glow" : ""}`}>
      <p className="font-body text-xs uppercase tracking-[0.3em] text-text-muted mb-3">
        Te pagamos por este item
      </p>

      {tienePrecio ? (
        <>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="font-numeric font-black text-5xl sm:text-6xl neon-text-orange leading-none">
              {formattedPrecio}
            </span>
            <span className="font-body text-lg text-text-secondary">
              {CONFIG.CURRENCY}
            </span>
          </div>

          <a
            href={whatsappLink(wpMessage)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onCotizar}
            className="btn-whatsapp w-full block text-center px-6 py-4 rounded font-body text-sm uppercase tracking-widest"
          >
            ⚡ Vendo este item
          </a>

          <p className="text-[10px] font-body text-text-muted mt-3 text-center uppercase tracking-wider">
            Te llevamos a WhatsApp con los datos cargados
          </p>
        </>
      ) : (
        <div className="py-4">
          <p className="font-body text-text-secondary">
            {motivoNoPrecio || "Completá los datos del item para ver la cotización."}
          </p>
        </div>
      )}
    </div>
  );
}
