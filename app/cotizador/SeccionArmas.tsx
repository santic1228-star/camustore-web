"use client";

import { useState, useMemo } from "react";
import { FieldLabel, TextInput, Select, Checkbox, PillToggle } from "@/components/ui/FormField";
import PriceResult from "@/components/PriceResult";
import { precioArma, ArmaInput } from "@/lib/precios";

export default function SeccionArmas() {
  const [parte, setParte] = useState("");
  const [nivel, setNivel] = useState("9");
  const [exeRate, setExeRate] = useState(false);
  const [dmgLvl20, setDmgLvl20] = useState(false);
  const [dmg2pct, setDmg2pct] = useState(false);
  const [speed7, setSpeed7] = useState(false);
  const [tipo, setTipo] = useState<"" | "s3" | "380" | "400">("");
  const [socket, setSocket] = useState<number>(0);  // 0, 1, 2 o 3
  const [luck, setLuck] = useState(true);
  const [skill, setSkill] = useState(true);

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

  const totalOpc = (exeRate ? 1 : 0) + [dmg2pct, speed7, dmgLvl20].filter(Boolean).length;

  const motivoNoPrecio = !tipo
    ? "Elegí el tipo del arma (s3, 380 o 400)."
    : !exeRate
    ? "Las armas necesitan exe rate 10% (obligatoria)."
    : totalOpc < 2
    ? "Con solo exe rate no se compra. Agregá al menos 1 opción extra."
    : undefined;

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
          <FieldLabel>Opción obligatoria</FieldLabel>
          <Checkbox checked={exeRate} onChange={setExeRate} label="exe rate 10%" hint="Sin esto, no se compra" />
        </div>

        <div>
          <FieldLabel>
            Opciones extra (máximo 2)
            <span className="ml-2 text-[10px] normal-case tracking-normal text-text-muted">
              {[dmg2pct, speed7, dmgLvl20].filter(Boolean).length}/2 elegidas
            </span>
          </FieldLabel>
          <div className="grid grid-cols-3 gap-2">
            {([
              { label: "dmg +2%", value: dmg2pct, setter: setDmg2pct },
              { label: "speed +7", value: speed7, setter: setSpeed7 },
              { label: "dmg lvl/20", value: dmgLvl20, setter: setDmgLvl20 },
            ] as const).map((opt) => {
              const totalExtras = [dmg2pct, speed7, dmgLvl20].filter(Boolean).length;
              const bloqueado = !opt.value && totalExtras >= 2;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => !bloqueado && opt.setter(!opt.value)}
                  disabled={bloqueado}
                  className={`px-3 py-2.5 rounded font-body text-xs uppercase tracking-wider border transition-colors ${
                    opt.value
                      ? "bg-neon-cyan/15 border-neon-cyan/60 text-neon-cyan"
                      : bloqueado
                        ? "bg-bg-card border-border-base text-text-muted opacity-40 cursor-not-allowed"
                        : "bg-bg-card border-border-base text-text-secondary hover:border-border-strong cursor-pointer"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          {exeRate && [dmg2pct, speed7, dmgLvl20].filter(Boolean).length === 1 && (
            <p className="text-[10px] font-body text-neon-orange/80 mt-1.5">
              Con 2 opciones útiles el precio se paga al 30%.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Tipo</FieldLabel>
            <Select<"s3" | "380" | "400">
              value={tipo}
              onChange={(v) => setTipo(v)}
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
            {!skill && (
              <p className="text-[10px] font-body text-neon-orange mt-1.5 uppercase tracking-wider">
                Armas sin skill: ×0,25
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
