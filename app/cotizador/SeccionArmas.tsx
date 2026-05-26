"use client";

import { useState, useMemo } from "react";
import { FieldLabel, TextInput, Select, Checkbox, PillToggle } from "@/components/ui/FormField";
import PriceResult from "@/components/PriceResult";
import { precioArma, ArmaInput } from "@/lib/precios";

export default function SeccionArmas() {
  const [parte, setParte] = useState("");
  const [nivel, setNivel] = useState("9");
  const [exeRate, setExeRate] = useState(true);
  const [dmg2pct, setDmg2pct] = useState(true);
  const [tercera, setTercera] = useState<"" | "speed7" | "dmglvl20">("speed7");
  const [tipo, setTipo] = useState<"" | "s3" | "380" | "400">("");
  const [socket, setSocket] = useState<number>(2);
  const [luck, setLuck] = useState(true);
  const [skill, setSkill] = useState(true);

  const speed7 = tercera === "speed7";
  const dmgLvl20 = tercera === "dmglvl20";

  const precio = useMemo(() => {
    const input: ArmaInput = {
      exeRate, dmgLvl20, dmg2pct, speed7,
      nivel: Number(nivel) || 0,
      tipo: tipo || null,
      socket: tipo === "400" ? socket : null,
      luck, skill,
    };
    return precioArma(input);
  }, [exeRate, dmgLvl20, dmg2pct, speed7, nivel, tipo, socket, luck, skill]);

  const opciones = [
    exeRate ? "exe rate 10%" : null,
    dmg2pct ? "dmg +2%" : null,
    dmgLvl20 ? "dmg lvl/20" : null,
    speed7 ? "speed +7" : null,
  ].filter(Boolean).join(", ") || "(ninguna)";

  const descripcion = [
    `• Arma: ${parte || "(sin nombre)"}`,
    `• Nivel: ${nivel}`,
    `• Opciones: ${opciones}`,
    `• Tipo: ${tipo || "—"}${tipo === "400" && socket > 0 ? ` · ${socket} socket${socket === 1 ? "" : "s"}` : ""}`,
    `• Luck: ${luck ? "Sí" : "No"} · Skill: ${skill ? "Sí" : "No"}`,
  ].join("\n");

  const tieneTercera = speed7 || dmgLvl20;

  let motivoNoPrecio: string | undefined;
  if (!tipo) {
    motivoNoPrecio = "Elegí el tipo del arma (s3, 380 o 400).";
  } else if (!exeRate || !dmg2pct) {
    motivoNoPrecio = "Obligatorias: exe rate 10% + dmg +2%. Sin ambas no se compra.";
  } else if (tipo === "s3" || tipo === "380") {
    if (!tieneTercera) motivoNoPrecio = "Las armas s3 y 380 necesitan las 3 opciones (falta la tercera).";
    else if (!luck) motivoNoPrecio = "Las armas s3 y 380 se compran solo con luck.";
    else if (!skill) motivoNoPrecio = "Las armas s3 y 380 se compran solo con skill.";
  } else if (tipo === "400") {
    if (!tieneTercera) {
      if (!luck || !skill || socket < 2) {
        motivoNoPrecio = "Arma 400 con 2 opciones (rate + 2%) se compra solo con luck + skill + mínimo 2 sockets.";
      }
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Tipo de arma</FieldLabel>
            <TextInput value={parte} onChange={setParte} placeholder="sword, staff, blade..." />
          </div>
          <div>
            <FieldLabel>Nivel (0 a 15)</FieldLabel>
            <TextInput value={nivel} onChange={setNivel} type="number" min={0} max={15} />
          </div>
        </div>

        <div>
          <FieldLabel>Opciones obligatorias</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            <Checkbox checked={exeRate} onChange={setExeRate} label="exe rate 10%" hint="Obligatoria" />
            <Checkbox checked={dmg2pct} onChange={setDmg2pct} label="dmg +2%" hint="Obligatoria" />
          </div>
        </div>

        <div>
          <FieldLabel>Tercera opción</FieldLabel>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTercera("")}
              className={`px-3 py-2.5 rounded font-body text-xs uppercase tracking-wider border transition-colors ${
                tercera === ""
                  ? "bg-bg-card-hover border-border-strong text-text-primary"
                  : "bg-bg-card border-border-base text-text-muted hover:border-border-strong"
              }`}
            >
              Ninguna
            </button>
            <button
              type="button"
              onClick={() => setTercera("speed7")}
              className={`px-3 py-2.5 rounded font-body text-xs uppercase tracking-wider border transition-colors ${
                tercera === "speed7"
                  ? "bg-neon-cyan/15 border-neon-cyan/60 text-neon-cyan"
                  : "bg-bg-card border-border-base text-text-secondary hover:border-border-strong"
              }`}
            >
              speed +7
            </button>
            <button
              type="button"
              onClick={() => setTercera("dmglvl20")}
              className={`px-3 py-2.5 rounded font-body text-xs uppercase tracking-wider border transition-colors ${
                tercera === "dmglvl20"
                  ? "bg-neon-cyan/15 border-neon-cyan/60 text-neon-cyan"
                  : "bg-bg-card border-border-base text-text-secondary hover:border-border-strong"
              }`}
            >
              dmg lvl/20
            </button>
          </div>
          {tipo === "400" && !tieneTercera && (
            <p className="text-[10px] font-body text-neon-orange/80 mt-1.5">
              Arma 400 sin tercera opción: se paga 40% menos (requiere luck + skill + 2 sockets).
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Tipo</FieldLabel>
            <Select<"s3" | "380" | "400">
              value={tipo}
              onChange={(v) => { setTipo(v); if (v === "400" && socket < 2) setSocket(2); }}
              options={[
                { value: "s3", label: "s3" },
                { value: "380", label: "380" },
                { value: "400", label: "400" },
              ]}
              placeholder="Elegí tipo"
            />
          </div>
          <div>
            <FieldLabel>Sockets {tipo === "400" ? "" : "· solo 400"}</FieldLabel>
            <div className={`inline-flex bg-bg-card border border-border-base rounded p-0.5 gap-0.5 w-full ${tipo !== "400" ? "opacity-40 pointer-events-none" : ""}`}>
              {[0, 1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSocket(n)}
                  className={`flex-1 px-2 py-1.5 rounded font-numeric text-sm font-bold transition-all ${
                    socket === n
                      ? "bg-neon-cyan text-bg-deep"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {tipo === "400" && socket > 0 && (
              <p className="text-[10px] font-body text-luck-gold mt-1.5 uppercase tracking-wider">
                +{(socket * 1200).toLocaleString("es-AR")} WC por sockets
              </p>
            )}
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
            {!skill && tipo === "400" && tieneTercera && (
              <p className="text-[10px] font-body text-neon-orange mt-1.5 uppercase tracking-wider">
                Arma 400 sin skill: ×0,25
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <PriceResult precio={precio} descripcion={descripcion} motivoNoPrecio={motivoNoPrecio} categoria="arma" nombre={parte || "arma"} />
      </div>
    </div>
  );
}
