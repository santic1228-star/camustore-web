"use client";

import { useState, useMemo } from "react";
import { FieldLabel, TextInput, Select, Checkbox, PillToggle } from "@/components/ui/FormField";
import PriceResult from "@/components/PriceResult";
import { precioArmadura, ArmaduraInput } from "@/lib/precios";

export default function SeccionArmaduras() {
  const [nombre, setNombre] = useState("");
  const [parte, setParte] = useState("");
  const [nivel, setNivel] = useState("10");
  const [hpDdRef, setHpDdRef] = useState(false);
  const [tipo, setTipo] = useState<"" | "s3" | "380" | "400">("");
  const [socket, setSocket] = useState("");
  const [luck, setLuck] = useState(true);

  const precio = useMemo(() => {
    const input: ArmaduraInput = {
      hpDdRef,
      nivel: Number(nivel) || 0,
      tipo: tipo || null,
      socket: socket === "" ? null : Number(socket),
      luck,
    };
    return precioArmadura(input);
  }, [hpDdRef, nivel, tipo, socket, luck]);

  const descripcion = [
    `• Armadura: ${nombre || "(sin nombre)"} ${parte || ""}`.trim(),
    `• Nivel: ${nivel}`,
    `• Tipo: ${tipo || "—"}${socket !== "" ? ` · socket ${socket}` : ""}`,
    `• HP + DD + REF: ${hpDdRef ? "Sí" : "No"} · Luck: ${luck ? "Sí" : "No"}`,
  ].join("\n");

  const motivoNoPrecio = !tipo
    ? "Elegí el tipo del item (s3, 380 o 400)."
    : !hpDdRef
    ? "Las armaduras se compran solo si tienen HP, DD y REF (las 3 opciones)."
    : undefined;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Formulario */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Nombre del item</FieldLabel>
            <TextInput value={nombre} onChange={setNombre} placeholder="queen, titan..." />
          </div>
          <div>
            <FieldLabel>Parte</FieldLabel>
            <TextInput value={parte} onChange={setParte} placeholder="helm, armor..." />
          </div>
        </div>

        <div>
          <FieldLabel>Nivel (0 a 15)</FieldLabel>
          <TextInput value={nivel} onChange={setNivel} type="number" min={0} max={15} />
        </div>

        <div>
          <FieldLabel>Opciones</FieldLabel>
          <Checkbox
            checked={hpDdRef}
            onChange={setHpDdRef}
            label="HP + DD + REF"
            hint="Las 3 opciones obligatorias"
          />
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
            <FieldLabel>Socket (0 a 3)</FieldLabel>
            <TextInput value={socket} onChange={setSocket} type="number" min={0} max={3} placeholder="0" />
          </div>
        </div>

        <div>
          <FieldLabel>¿Tiene Luck?</FieldLabel>
          <PillToggle value={luck} onChange={setLuck} />
        </div>
      </div>

      {/* Resultado */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <PriceResult precio={precio} descripcion={descripcion} motivoNoPrecio={motivoNoPrecio} />
      </div>
    </div>
  );
}
