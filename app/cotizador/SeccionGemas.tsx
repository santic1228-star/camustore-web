"use client";

import { useState, useMemo } from "react";
import { FieldLabel, Select } from "@/components/ui/FormField";
import PriceResult from "@/components/PriceResult";
import { gemaPrecioCompra, GEMA_LABELS, GemaTipo } from "@/lib/precios";
import { useCfg } from "@/lib/precios-contexto";

export default function SeccionGemas() {
  const cfg = useCfg();
  const [tipo, setTipo] = useState<"" | GemaTipo>("");

  const precio = useMemo(() => {
    if (!tipo) return null;
    return gemaPrecioCompra(tipo, cfg);
  }, [tipo, cfg]);

  const descripcion = `• ${tipo ? GEMA_LABELS[tipo] : "(sin seleccionar)"}`;
  const motivoNoPrecio = !tipo ? "Elegí qué tenés para vender." : undefined;

  // Genero las opciones desde GEMA_LABELS
  const opciones = (Object.keys(GEMA_LABELS) as GemaTipo[]).map((k) => ({
    value: k,
    label: GEMA_LABELS[k],
  }));

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <FieldLabel>¿Qué tenés para vender?</FieldLabel>
          <Select<GemaTipo>
            value={tipo}
            onChange={(v) => setTipo(v)}
            options={opciones}
            placeholder="Elegí item"
          />
        </div>

        {/* Tabla de referencia */}
        <div className="mt-6 p-4 rounded border border-border-base bg-bg-card/50">
          <p className="font-body text-xs uppercase tracking-widest text-text-muted mb-3">
            Precios de compra
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-body text-xs">
            {(Object.keys(GEMA_LABELS) as GemaTipo[]).map((k) => (
              <div key={k} className="contents">
                <div className="text-text-secondary">{GEMA_LABELS[k]}</div>
                <div className="font-numeric font-bold text-neon-cyan text-right">
                  {gemaPrecioCompra(k, cfg).toLocaleString("es-AR")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <PriceResult precio={precio} descripcion={descripcion} motivoNoPrecio={motivoNoPrecio} categoria="gema" nombre={tipo ? GEMA_LABELS[tipo] : "gema"} />
      </div>
    </div>
  );
}
