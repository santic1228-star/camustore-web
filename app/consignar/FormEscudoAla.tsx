"use client";

import { useState } from "react";
import { Checkbox, FieldLabel, PillToggle, Select, TextInput } from "@/components/ui/FormField";
import PanelAgregar from "./PanelAgregar";
import { ESCUDO_NOMBRES } from "@/lib/precios";
import type { LineaConsignacion } from "@/lib/consignacion";

interface Props {
  onAgregar: (linea: LineaConsignacion, precioVenta: number) => void;
}

// =====================================================
// Escudo (solo 400, 4 nombres) — espejo de SeccionEscudos
// =====================================================
export function FormEscudo({ onAgregar }: Props) {
  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState("9");
  const [hpDdRef, setHpDdRef] = useState(true);
  const [socket, setSocket] = useState<number>(2);
  const [luck, setLuck] = useState(true);
  const [skill, setSkill] = useState(true);

  const linea: LineaConsignacion | null = nombre
    ? {
        categoria: "escudo",
        atributos: {
          nombreEscudo: nombre,
          nivel: Number(nivel) || 0,
          socket,
          hpDdRef,
          luck,
          skill,
        },
      }
    : null;

  let motivo: string | undefined;
  if (!nombre) motivo = "Elegí el escudo.";
  else if (!hpDdRef) motivo = "Los escudos se consignan solo con HP + DD + REF.";
  else if (socket < 2) motivo = "Los escudos se consignan solo con 2 o 3 sockets.";

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Escudo</FieldLabel>
            <Select<string>
              value={nombre}
              onChange={(v) => setNombre(v)}
              options={ESCUDO_NOMBRES}
              placeholder="Elegí escudo"
            />
          </div>
          <div>
            <FieldLabel>Nivel (0 a 15)</FieldLabel>
            <input
              type="number"
              min={0}
              max={15}
              value={nivel}
              onChange={(e) => setNivel(e.target.value)}
              className="w-full bg-bg-card border border-border-base focus:border-neon-cyan rounded px-3 py-2.5 font-numeric text-text-primary outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <FieldLabel>Opción obligatoria</FieldLabel>
          <Checkbox checked={hpDdRef} onChange={setHpDdRef} label="HP + DD + REF" hint="Sin esto, no se consigna" />
        </div>

        <div>
          <FieldLabel>Sockets · mín. 2</FieldLabel>
          <div className="inline-flex bg-bg-card border border-border-base rounded p-0.5 gap-0.5 w-full">
            {[2, 3].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSocket(n)}
                className={`flex-1 px-2 py-1.5 rounded font-numeric text-sm font-bold transition-all ${
                  socket === n ? "bg-neon-cyan text-bg-deep" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>¿Tiene Luck?</FieldLabel>
            <PillToggle value={luck} onChange={setLuck} />
          </div>
          <div>
            <FieldLabel>¿Tiene Skill?</FieldLabel>
            <PillToggle value={skill} onChange={setSkill} />
          </div>
        </div>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <PanelAgregar linea={linea} motivo={motivo} onAgregar={onAgregar} />
      </div>
    </div>
  );
}

// =====================================================
// Alas — espejo de SeccionAlas (sin tipo s3/380/400)
// =====================================================
export function FormAla({ onAgregar }: Props) {
  const [nivel, setNivel] = useState("0");
  const [ignore, setIgnore] = useState(false);
  const [returnOpc, setReturnOpc] = useState(false);
  const [lifeRecovery, setLifeRecovery] = useState(false);
  const [luck, setLuck] = useState(true);

  const nOpc = [ignore, returnOpc, lifeRecovery].filter(Boolean).length;

  const linea: LineaConsignacion = {
    categoria: "ala",
    atributos: {
      nivel: Number(nivel) || 0,
      exeRate: false,
      dmg2pct: false,
      ignore,
      returnOpc,
      lifeRecovery,
      luck,
    },
  };

  const motivo =
    nOpc === 0
      ? "Las alas se consignan solo si tienen al menos 1 opción."
      : nOpc < 3 && !luck
        ? "Alas sin luck solo se consignan si tienen las 3 opciones."
        : undefined;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <FieldLabel>Nivel (0 a 15)</FieldLabel>
          <TextInput value={nivel} onChange={setNivel} type="number" min={0} max={15} />
        </div>

        <div>
          <FieldLabel>Opciones que tienen</FieldLabel>
          <div className="grid sm:grid-cols-3 gap-2">
            <Checkbox checked={ignore} onChange={setIgnore} label="Ignore" hint="Ignora defensa" />
            <Checkbox checked={returnOpc} onChange={setReturnOpc} label="Return" hint="Refleja daño" />
            <Checkbox checked={lifeRecovery} onChange={setLifeRecovery} label="Life Recovery" hint="Recupera HP" />
          </div>
        </div>

        <div>
          <FieldLabel>¿Tienen Luck?</FieldLabel>
          <PillToggle value={luck} onChange={setLuck} />
        </div>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <PanelAgregar linea={linea} motivo={motivo} onAgregar={onAgregar} />
      </div>
    </div>
  );
}
