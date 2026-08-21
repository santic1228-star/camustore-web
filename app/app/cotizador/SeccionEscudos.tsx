"use client";

import { useState, useMemo } from "react";
import { FieldLabel, Select, Checkbox, PillToggle } from "@/components/ui/FormField";
import PriceResult from "@/components/PriceResult";
import { precioEscudo, EscudoInput, ESCUDO_NOMBRES, escudoLabel } from "@/lib/precios";

export default function SeccionEscudos() {
  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState("9");
  const [hpDdRef, setHpDdRef] = useState(true);
  const [socket, setSocket] = useState<number>(2);
  const [luck, setLuck] = useState(true);
  const [skill, setSkill] = useState(true);

  const precio = useMemo(() => {
    const input: EscudoInput = {
      hpDdRef,
      nivel: Number(nivel) || 0,
      socket,
      luck, skill,
    };
    return precioEscudo(input);
  }, [hpDdRef, nivel, socket, luck, skill]);

  const descripcion = [
    `• Escudo: ${nombre ? escudoLabel(nombre) : "(sin nombre)"}`,
    `• Nivel: ${nivel} · ${socket} socket${socket === 1 ? "" : "s"}`,
    `• HP+DD+REF · Luck: ${luck ? "Sí" : "No"} · Skill: ${skill ? "Sí" : "No"}`,
  ].join("\n");

  let motivoNoPrecio: string | undefined;
  if (!nombre) {
    motivoNoPrecio = "Elegí el escudo.";
  } else if (!hpDdRef) {
    motivoNoPrecio = "Los escudos se compran solo con HP + DD + REF.";
  } else if (socket < 2) {
    motivoNoPrecio = "Los escudos se compran solo con 2 o 3 sockets.";
  }

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
              type="number" min={0} max={15} value={nivel}
              onChange={(e) => setNivel(e.target.value)}
              className="w-full bg-bg-card border border-border-base focus:border-neon-cyan rounded px-3 py-2.5 font-numeric text-text-primary outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <FieldLabel>Opción obligatoria</FieldLabel>
          <Checkbox checked={hpDdRef} onChange={setHpDdRef} label="HP + DD + REF" hint="Sin esto, no se compra" />
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
          {socket > 0 && (
            <p className="text-[10px] font-body text-luck-gold mt-1.5 uppercase tracking-wider">
              +{(socket * 1200).toLocaleString("es-AR")} WC por sockets
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>¿Tiene Luck?</FieldLabel>
            <PillToggle value={luck} onChange={setLuck} />
            {!luck && (
              <p className="text-[10px] font-body text-neon-orange mt-1.5 uppercase tracking-wider">Sin luck: ×0,25</p>
            )}
          </div>
          <div>
            <FieldLabel>¿Tiene Skill?</FieldLabel>
            <PillToggle value={skill} onChange={setSkill} />
            {!skill && (
              <p className="text-[10px] font-body text-neon-orange mt-1.5 uppercase tracking-wider">Sin skill: ×0,25</p>
            )}
          </div>
        </div>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <PriceResult precio={precio} descripcion={descripcion} motivoNoPrecio={motivoNoPrecio} categoria="escudo" nombre={nombre ? escudoLabel(nombre) : "escudo"} />
      </div>
    </div>
  );
}
