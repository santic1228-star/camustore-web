"use client";

import { useState, useMemo } from "react";
import { FieldLabel, TextInput, Select } from "@/components/ui/FormField";
import PriceResult from "@/components/PriceResult";
import { precioJewels, JewelTipo, JEWEL_LABELS, jewelPrecioCompra } from "@/lib/precios";
import { useCfg } from "@/lib/precios-contexto";

export default function SeccionJewels() {
  const cfg = useCfg();
  const [tipo, setTipo] = useState<"" | JewelTipo>("");
  const [bundles, setBundles] = useState("1");

  const bundlesNum = Math.max(0, Math.min(99, Number(bundles) || 0));

  const precio = useMemo(() => {
    return precioJewels(tipo || null, bundlesNum, cfg);
  }, [tipo, bundlesNum, cfg]);

  const totalJewels = bundlesNum * cfg.jewels.bundle;

  const descripcion = [
    `• Jewels: ${tipo ? JEWEL_LABELS[tipo] : "(sin tipo)"}`,
    `• Cantidad: ${bundlesNum} bundle${bundlesNum === 1 ? "" : "s"} (${totalJewels} jewels)`,
  ].join("\n");

  const motivoNoPrecio = !tipo
    ? "Elegí el tipo de jewel."
    : bundlesNum < 1
    ? "Cargá al menos 1 bundle."
    : undefined;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <FieldLabel>Tipo de Jewel</FieldLabel>
          <Select<JewelTipo>
            value={tipo}
            onChange={(v) => setTipo(v)}
            options={[
              { value: "chaos", label: "Jewel of Chaos" },
              { value: "creation", label: "Jewel of Creation" },
              { value: "soul", label: "Jewel of Soul" },
              { value: "bless", label: "Jewel of Bless" },
            ]}
            placeholder="Elegí jewel"
          />
        </div>

        <div>
          <FieldLabel>Cantidad de bundles de 30 (0 a 99)</FieldLabel>
          <TextInput
            value={bundles}
            onChange={setBundles}
            type="number"
            min={0}
            max={99}
            placeholder="1"
          />
          <p className="text-[10px] font-body text-text-muted mt-1.5 uppercase tracking-wider">
            {bundlesNum > 0
              ? `${bundlesNum} bundle${bundlesNum === 1 ? "" : "s"} = ${totalJewels.toLocaleString("es-AR")} jewels`
              : "Cada bundle equivale a 30 jewels"}
          </p>
        </div>

        {/* Tabla de referencia */}
        <div className="mt-6 p-4 rounded border border-border-base bg-bg-card/50">
          <p className="font-body text-xs uppercase tracking-widest text-text-muted mb-3">
            Precios por bundle de 30
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-body text-xs">
            <div className="text-text-secondary">Jewel of Chaos</div>
            <div className="font-numeric font-bold text-neon-cyan text-right">{jewelPrecioCompra("chaos", cfg).toLocaleString("es-AR")} WC</div>
            <div className="text-text-secondary">Jewel of Creation</div>
            <div className="font-numeric font-bold text-neon-cyan text-right">{jewelPrecioCompra("creation", cfg).toLocaleString("es-AR")} WC</div>
            <div className="text-text-secondary">Jewel of Soul</div>
            <div className="font-numeric font-bold text-neon-cyan text-right">{jewelPrecioCompra("soul", cfg).toLocaleString("es-AR")} WC</div>
            <div className="text-text-secondary">Jewel of Bless</div>
            <div className="font-numeric font-bold text-neon-cyan text-right">{jewelPrecioCompra("bless", cfg).toLocaleString("es-AR")} WC</div>
          </div>
        </div>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <PriceResult precio={precio} descripcion={descripcion} motivoNoPrecio={motivoNoPrecio} categoria="jewel" nombre={tipo ? JEWEL_LABELS[tipo] : "jewel"} />
      </div>
    </div>
  );
}
