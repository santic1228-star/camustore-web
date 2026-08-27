"use client";

import { useState, useMemo } from "react";
import { FieldLabel, TextInput, Checkbox, PillToggle } from "@/components/ui/FormField";
import PriceResult from "@/components/PriceResult";
import { precioAlas, AlasInput } from "@/lib/precios";
import { useCfg } from "@/lib/precios-contexto";

export default function SeccionAlas() {
  const cfg = useCfg();
  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState("0");
  const [ignore, setIgnore] = useState(false);
  const [returnOpc, setReturnOpc] = useState(false);
  const [lifeRecovery, setLifeRecovery] = useState(false);
  const [luck, setLuck] = useState(true);

  const precio = useMemo(() => {
    const input: AlasInput = {
      ignore, returnOpc, lifeRecovery, luck,
      nivel: Number(nivel) || 0,
    };
    return precioAlas(input, cfg);
  }, [ignore, returnOpc, lifeRecovery, luck, nivel, cfg]);

  const nOpc = [ignore, returnOpc, lifeRecovery].filter(Boolean).length;
  const opciones = [
    ignore ? "ignore" : null,
    returnOpc ? "return" : null,
    lifeRecovery ? "life recovery" : null,
  ].filter(Boolean).join(", ") || "(ninguna)";

  const descripcion = [
    `• Alas: ${nombre || "(sin nombre)"}`,
    `• Nivel: ${nivel}`,
    `• Opciones (${nOpc}): ${opciones}`,
    `• Luck: ${luck ? "Sí" : "No"}`,
  ].join("\n");

  const motivoNoPrecio =
    nOpc === 0
      ? "Las alas se compran solo si tienen al menos 1 opción."
      : (nOpc < 3 && !luck)
      ? "Alas sin luck solo se compran si tienen las 3 opciones."
      : undefined;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Nombre / Tipo de alas</FieldLabel>
            <TextInput value={nombre} onChange={setNombre} placeholder="dragon wings..." />
          </div>
          <div>
            <FieldLabel>Nivel (0 a 15)</FieldLabel>
            <TextInput value={nivel} onChange={setNivel} type="number" min={0} max={15} />
          </div>
        </div>

        <div>
          <FieldLabel>Opciones que tiene</FieldLabel>
          <div className="grid sm:grid-cols-3 gap-2">
            <Checkbox checked={ignore} onChange={setIgnore} label="Ignore" hint="Ignora defensa" />
            <Checkbox checked={returnOpc} onChange={setReturnOpc} label="Return" hint="Refleja daño" />
            <Checkbox checked={lifeRecovery} onChange={setLifeRecovery} label="Life Recovery" hint="Recupera HP" />
          </div>
        </div>

        <div>
          <FieldLabel>¿Tiene Luck?</FieldLabel>
          <PillToggle value={luck} onChange={setLuck} />
        </div>

        {/* Tabla de referencia */}
        <div className="mt-6 p-4 rounded border border-border-base bg-bg-card/50">
          <p className="font-body text-xs uppercase tracking-widest text-text-muted mb-3">
            Tabla de precios (base → lvl 15)
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-body text-xs">
            <div className="text-text-secondary">1 opc + luck</div>
            <div className="font-numeric text-right">
              <span className="text-text-muted">2.000</span>
              <span className="text-text-muted mx-1">→</span>
              <span className="font-bold text-neon-cyan">5.000 WC</span>
            </div>
            <div className="text-text-secondary">2 opc + luck</div>
            <div className="font-numeric text-right">
              <span className="text-text-muted">10.000</span>
              <span className="text-text-muted mx-1">→</span>
              <span className="font-bold text-neon-cyan">16.000 WC</span>
            </div>
            <div className="text-text-secondary">3 opc (sin luck)</div>
            <div className="font-numeric text-right">
              <span className="text-text-muted">20.000</span>
              <span className="text-text-muted mx-1">→</span>
              <span className="font-bold text-neon-cyan">40.000 WC</span>
            </div>
            <div className="text-text-secondary">3 opc + luck</div>
            <div className="font-numeric text-right">
              <span className="text-text-muted">25.000</span>
              <span className="text-text-muted mx-1">→</span>
              <span className="font-bold text-luck-gold">60.000 WC</span>
            </div>
          </div>
          <p className="text-[10px] font-body text-text-muted mt-3 uppercase tracking-wider">
            Niveles 10-14 interpolados linealmente
          </p>
        </div>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <PriceResult precio={precio} descripcion={descripcion} motivoNoPrecio={motivoNoPrecio} categoria="ala" nombre={nombre || "ala"} />
      </div>
    </div>
  );
}
