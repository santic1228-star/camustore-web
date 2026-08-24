"use client";

import { useState } from "react";
import { FieldLabel, PillToggle, Select, TextInput } from "@/components/ui/FormField";
import PanelAgregar from "./PanelAgregar";
import {
  esJewelEspecial,
  GEMA_LABELS,
  JEWEL_LABELS,
  SEED_ACEPTA_PENTA,
  SEED_LABELS,
  type GemaTipo,
  type JewelTipo,
  type SeedTipo,
} from "@/lib/precios";
import type { LineaConsignacion } from "@/lib/consignacion";

interface Props {
  onAgregar: (linea: LineaConsignacion, precioVenta: number) => void;
}

function clampCantidad(s: string): number {
  return Math.max(0, Math.min(99, Number(s) || 0));
}

// =====================================================
// Jewels — regulares por bundle de 30, especiales por unidad
// =====================================================
export function FormJewel({ onAgregar }: Props) {
  const [tipo, setTipo] = useState<"" | JewelTipo>("");
  const [cantidad, setCantidad] = useState("1");

  const cantidadNum = clampCantidad(cantidad);
  const especial = tipo ? esJewelEspecial(tipo) : false;

  const linea: LineaConsignacion | null = tipo
    ? { categoria: "jewel", atributos: { tipoJewel: tipo, cantidad: cantidadNum } }
    : null;

  const motivo = !tipo
    ? "Elegí el tipo de jewel."
    : cantidadNum < 1
      ? "Cargá al menos 1."
      : undefined;

  const opciones = (Object.keys(JEWEL_LABELS) as JewelTipo[]).map((k) => ({
    value: k,
    label: JEWEL_LABELS[k],
  }));

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <FieldLabel>Tipo de Jewel</FieldLabel>
          <Select<JewelTipo> value={tipo} onChange={(v) => setTipo(v)} options={opciones} placeholder="Elegí jewel" />
        </div>

        <div>
          <FieldLabel>{especial ? "Cantidad de unidades (1 a 99)" : "Cantidad de bundles de 30 (1 a 99)"}</FieldLabel>
          <TextInput value={cantidad} onChange={setCantidad} type="number" min={1} max={99} placeholder="1" />
          {tipo && (
            <p className="text-[10px] font-body text-text-muted mt-1.5 uppercase tracking-wider">
              {especial
                ? "Este jewel se cotiza por unidad."
                : cantidadNum > 0
                  ? `${cantidadNum} bundle${cantidadNum === 1 ? "" : "s"} = ${(cantidadNum * 30).toLocaleString("es-AR")} jewels`
                  : "Cada bundle equivale a 30 jewels."}
            </p>
          )}
        </div>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <PanelAgregar linea={linea} motivo={motivo} onAgregar={onAgregar} />
      </div>
    </div>
  );
}

// =====================================================
// Seeds
// =====================================================
export function FormSeed({ onAgregar }: Props) {
  const [tipo, setTipo] = useState<"" | SeedTipo>("");
  const [ensamblada, setEnsamblada] = useState(false);
  const [cantidad, setCantidad] = useState("1");

  const cantidadNum = clampCantidad(cantidad);
  const aceptaPenta = tipo ? SEED_ACEPTA_PENTA.includes(tipo) : false;

  const linea: LineaConsignacion | null = tipo
    ? {
        categoria: "seed",
        atributos: { tipoSeed: tipo, cantidad: cantidadNum, ensambladaPenta: aceptaPenta && ensamblada },
      }
    : null;

  const motivo = !tipo ? "Elegí el tipo de seed." : cantidadNum < 1 ? "Cargá al menos 1." : undefined;

  const opciones = (Object.keys(SEED_LABELS) as SeedTipo[]).map((k) => ({
    value: k,
    label: SEED_LABELS[k],
  }));

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <FieldLabel>Tipo de Seed</FieldLabel>
          <Select<SeedTipo> value={tipo} onChange={(v) => setTipo(v)} options={opciones} placeholder="Elegí seed" />
        </div>

        {aceptaPenta && (
          <div>
            <FieldLabel>¿Está ensamblada en Penta Sphere?</FieldLabel>
            <PillToggle value={ensamblada} onChange={setEnsamblada} trueLabel="Sí, ensamblada" falseLabel="No, sin ensamblar" />
          </div>
        )}

        <div>
          <FieldLabel>Cantidad (1 a 99)</FieldLabel>
          <TextInput value={cantidad} onChange={setCantidad} type="number" min={1} max={99} placeholder="1" />
        </div>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <PanelAgregar linea={linea} motivo={motivo} onAgregar={onAgregar} />
      </div>
    </div>
  );
}

// =====================================================
// Gemas y otros
// =====================================================
export function FormGema({ onAgregar }: Props) {
  const [tipo, setTipo] = useState<"" | GemaTipo>("");
  const [cantidad, setCantidad] = useState("1");

  const cantidadNum = clampCantidad(cantidad);

  const linea: LineaConsignacion | null = tipo
    ? { categoria: "gema", atributos: { tipoGema: tipo, cantidad: cantidadNum } }
    : null;

  const motivo = !tipo ? "Elegí qué tenés para consignar." : cantidadNum < 1 ? "Cargá al menos 1." : undefined;

  const opciones = (Object.keys(GEMA_LABELS) as GemaTipo[]).map((k) => ({
    value: k,
    label: GEMA_LABELS[k],
  }));

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <FieldLabel>¿Qué tenés para consignar?</FieldLabel>
          <Select<GemaTipo> value={tipo} onChange={(v) => setTipo(v)} options={opciones} placeholder="Elegí item" />
        </div>

        <div>
          <FieldLabel>Cantidad (1 a 99)</FieldLabel>
          <TextInput value={cantidad} onChange={setCantidad} type="number" min={1} max={99} placeholder="1" />
        </div>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <PanelAgregar linea={linea} motivo={motivo} onAgregar={onAgregar} />
      </div>
    </div>
  );
}
