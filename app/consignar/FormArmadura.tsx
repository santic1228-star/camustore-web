"use client";

import { useMemo, useState } from "react";
import { Checkbox, FieldLabel, PillToggle, Select } from "@/components/ui/FormField";
import PanelAgregar from "./PanelAgregar";
import { itemsPorRazaCategoria, itemPorId, RAZAS_CON_ITEMS, type TipoEquipo } from "@/lib/items-catalogo";
import type { LineaConsignacion } from "@/lib/consignacion";
import type { Raza } from "@/lib/database.types";

interface Props {
  onAgregar: (linea: LineaConsignacion, precioVenta: number) => void;
}

/** Mismo flow encadenado que SeccionArmaduras del cotizador: raza → ítem → tipo → atributos. */
export default function FormArmadura({ onAgregar }: Props) {
  const [raza, setRaza] = useState<"" | Raza>("");
  const [itemId, setItemId] = useState("");
  const [tipo, setTipo] = useState<"" | TipoEquipo>("");
  const [nivel, setNivel] = useState("10");
  const [hpDdRef, setHpDdRef] = useState(false);
  const [socket, setSocket] = useState<number>(2);
  const [luck, setLuck] = useState(true);

  const itemsDisponibles = useMemo(() => {
    if (!raza) return [];
    return itemsPorRazaCategoria(raza, "armadura");
  }, [raza]);

  const item = itemId ? itemPorId(itemId) : null;
  const tiposDisponibles: TipoEquipo[] = item ? item.tipos : [];

  function onRazaChange(r: Raza | "") {
    setRaza(r);
    setItemId("");
    setTipo("");
  }
  function onItemChange(id: string) {
    setItemId(id);
    const it = itemPorId(id);
    if (it && tipo && !it.tipos.includes(tipo as TipoEquipo)) setTipo("");
  }

  const linea: LineaConsignacion | null =
    raza && itemId && tipo
      ? {
          categoria: "armadura",
          atributos: {
            itemId,
            raza,
            nivel: Number(nivel) || 0,
            tipo,
            socket: tipo === "400" ? socket : 0,
            hpDdRef,
            luck,
          },
        }
      : null;

  let motivo: string | undefined;
  if (!raza) motivo = "Elegí tu raza.";
  else if (!itemId) motivo = "Elegí el item.";
  else if (!tipo) motivo = "Elegí el tipo (s3, 380 o 400).";
  else if (!hpDdRef) motivo = "Las armaduras se consignan solo si tienen HP, DD y REF (las 3 opciones).";
  else if ((tipo === "s3" || tipo === "380") && !luck) motivo = "Los items s3 y 380 se consignan solo con luck.";
  else if (tipo === "400" && socket < 2) motivo = "Los items 400 se consignan solo con 2 o 3 sockets.";

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <FieldLabel>1. Tu raza</FieldLabel>
          <Select<Raza>
            value={raza}
            onChange={(v) => onRazaChange(v)}
            options={RAZAS_CON_ITEMS.map((r) => ({ value: r, label: r }))}
            placeholder="Elegí tu raza"
          />
        </div>

        {raza && (
          <div>
            <FieldLabel>2. Item</FieldLabel>
            <Select<string>
              value={itemId}
              onChange={(v) => onItemChange(v)}
              options={itemsDisponibles.map((i) => ({ value: i.id, label: i.nombre }))}
              placeholder={`Elegí (${itemsDisponibles.length} disponibles)`}
            />
          </div>
        )}

        {item && (
          <div>
            <FieldLabel>3. Tipo {tiposDisponibles.length === 1 ? "(único disponible)" : ""}</FieldLabel>
            <div className="inline-flex bg-bg-card border border-border-base rounded p-0.5 gap-0.5">
              {(["s3", "380", "400"] as TipoEquipo[]).map((t) => {
                const disponible = tiposDisponibles.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => disponible && setTipo(t)}
                    disabled={!disponible}
                    className={`px-4 py-2 rounded font-numeric text-sm font-bold transition-all ${
                      !disponible
                        ? "opacity-25 cursor-not-allowed"
                        : tipo === t
                          ? "bg-neon-cyan text-bg-deep"
                          : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            {tiposDisponibles.length < 3 && (
              <p className="text-[10px] font-body text-text-muted mt-1.5">
                Este item solo existe en: {tiposDisponibles.join(", ")}.
              </p>
            )}
          </div>
        )}

        {tipo && (
          <>
            <div className="grid grid-cols-2 gap-3">
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
              {tipo === "400" && (
                <div>
                  <FieldLabel>Sockets · mín. 2</FieldLabel>
                  <div className="inline-flex bg-bg-card border border-border-base rounded p-0.5 gap-0.5 w-full">
                    {[2, 3].map((n) => (
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
                </div>
              )}
            </div>

            <div>
              <FieldLabel>Opciones</FieldLabel>
              <Checkbox checked={hpDdRef} onChange={setHpDdRef} label="HP + DD + REF" hint="Las 3 opciones obligatorias" />
            </div>

            <div>
              <FieldLabel>¿Tiene Luck?</FieldLabel>
              <PillToggle value={luck} onChange={setLuck} />
            </div>
          </>
        )}
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <PanelAgregar linea={linea} motivo={motivo} onAgregar={onAgregar} />
      </div>
    </div>
  );
}
