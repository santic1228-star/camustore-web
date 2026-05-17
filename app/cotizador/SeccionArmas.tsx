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
  const [socket, setSocket] = useState("");
  const [luck, setLuck] = useState(true);
  const [skill, setSkill] = useState(true);

  const precio = useMemo(() => {
    const input: ArmaInput = {
      exeRate, dmgLvl20, dmg2pct, speed7,
      nivel: Number(nivel) || 0,
      tipo: tipo || null,
      socket: socket === "" ? null : Number(socket),
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
    `• Tipo: ${tipo || "—"}${socket !== "" ? ` · socket ${socket}` : ""}`,
    `• Luck: ${luck ? "Sí" : "No"} · Skill: ${skill ? "Sí" : "No"}`,
  ].join("\n");

  const motivoNoPrecio = !tipo
    ? "Elegí el tipo del arma (s3, 380 o 400)."
    : (!exeRate || !dmg2pct)
    ? "Las armas deben tener exe rate 10% Y dmg +2% (ambas obligatorias)."
    : (!dmgLvl20 && !speed7)
    ? "Falta la 3ra opción: dmg lvl/20 o speed +7."
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
          <FieldLabel>Opciones obligatorias</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            <Checkbox checked={exeRate} onChange={setExeRate} label="exe rate 10%" hint="Obligatoria" />
            <Checkbox checked={dmg2pct} onChange={setDmg2pct} label="dmg +2%" hint="Obligatoria" />
          </div>
        </div>

        <div>
          <FieldLabel>Tercera opción (una de las dos)</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            <Checkbox checked={dmgLvl20} onChange={setDmgLvl20} label="dmg lvl/20" hint="Opcional A" />
            <Checkbox checked={speed7} onChange={setSpeed7} label="speed +7" hint="Opcional B" />
          </div>
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
            <FieldLabel>Socket (0 a 3) · solo tipo 400</FieldLabel>
            <TextInput value={socket} onChange={setSocket} type="number" min={0} max={3} placeholder="0" />
            {tipo === "400" && socket !== "" && Number(socket) > 0 && (
              <p className="text-[10px] font-body text-luck-gold mt-1.5 uppercase tracking-wider">
                +{(Number(socket) * 1200).toLocaleString("es-AR")} WC por sockets
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
        <PriceResult precio={precio} descripcion={descripcion} motivoNoPrecio={motivoNoPrecio} />
      </div>
    </div>
  );
}
