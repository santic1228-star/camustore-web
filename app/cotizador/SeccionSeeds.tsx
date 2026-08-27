"use client";

import { useState, useMemo } from "react";
import { FieldLabel, Select, PillToggle } from "@/components/ui/FormField";
import PriceResult from "@/components/PriceResult";
import { useCfg } from "@/lib/precios-contexto";
import { precioSeed, SeedTipo, SEED_LABELS, SEED_ACEPTA_PENTA } from "@/lib/precios";

export default function SeccionSeeds() {
  const cfg = useCfg();
  const [tipo, setTipo] = useState<"" | SeedTipo>("");
  const [ensamblada, setEnsamblada] = useState(false);

  const aceptaPenta = tipo ? SEED_ACEPTA_PENTA.includes(tipo) : false;

  const precio = useMemo(() => {
    return precioSeed(tipo || null, aceptaPenta && ensamblada, cfg);
  }, [tipo, ensamblada, aceptaPenta, cfg]);

  const descripcion = [
    `• Seed: ${tipo ? SEED_LABELS[tipo] : "(sin tipo)"}`,
    aceptaPenta ? `• Ensamblada en Penta Sphere: ${ensamblada ? "Sí" : "No"}` : null,
  ].filter(Boolean).join("\n");

  const motivoNoPrecio = !tipo ? "Elegí el tipo de seed." : undefined;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <FieldLabel>Tipo de Seed</FieldLabel>
          <Select<SeedTipo>
            value={tipo}
            onChange={(v) => setTipo(v)}
            options={[
              { value: "max_life", label: "Max Life" },
              { value: "damage_reduction", label: "Damage Reduction" },
              { value: "penta", label: "Penta (contenedor)" },
              { value: "exc_dmg_rate", label: "Exc Dmg Rate" },
              { value: "crit_dmg_rate", label: "Crit Dmg Rate" },
            ]}
            placeholder="Elegí seed"
          />
        </div>

        {aceptaPenta && (
          <div>
            <FieldLabel>¿Está ensamblada en Penta Sphere?</FieldLabel>
            <PillToggle value={ensamblada} onChange={setEnsamblada} trueLabel="Sí, ensamblada" falseLabel="No, sin ensamblar" />
            <p className="text-[10px] font-body text-text-muted mt-1.5 uppercase tracking-wider">
              Si ya está en la Penta Sphere, pagamos +5.000 WC
            </p>
          </div>
        )}

        {/* Tabla de referencia */}
        <div className="mt-6 p-4 rounded border border-border-base bg-bg-card/50">
          <p className="font-body text-xs uppercase tracking-widest text-text-muted mb-3">
            Precios de referencia (compra)
          </p>
          <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 font-body text-xs">
            <div></div>
            <div className="text-text-muted text-right uppercase tracking-wider text-[10px]">Normal</div>
            <div className="text-text-muted text-right uppercase tracking-wider text-[10px]">Penta</div>

            <div className="text-text-secondary">Max Life</div>
            <div className="font-numeric font-bold text-neon-cyan text-right">35.000</div>
            <div className="font-numeric font-bold text-luck-gold text-right">40.000</div>

            <div className="text-text-secondary">Damage Reduction</div>
            <div className="font-numeric font-bold text-neon-cyan text-right">40.000</div>
            <div className="font-numeric font-bold text-luck-gold text-right">45.000</div>

            <div className="text-text-secondary">Penta (contenedor)</div>
            <div className="font-numeric font-bold text-neon-cyan text-right">5.000</div>
            <div className="text-text-muted text-right">—</div>

            <div className="text-text-secondary">Exc Dmg Rate</div>
            <div className="font-numeric font-bold text-neon-cyan text-right">500</div>
            <div className="text-text-muted text-right">—</div>

            <div className="text-text-secondary">Crit Dmg Rate</div>
            <div className="font-numeric font-bold text-neon-cyan text-right">500</div>
            <div className="text-text-muted text-right">—</div>
          </div>
        </div>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <PriceResult precio={precio} descripcion={descripcion} motivoNoPrecio={motivoNoPrecio} categoria="seed" nombre={tipo ? SEED_LABELS[tipo] : "seed"} />
      </div>
    </div>
  );
}
