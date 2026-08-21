"use client";

import { useState, useMemo } from "react";
import { FieldLabel, Select, Checkbox, PillToggle } from "@/components/ui/FormField";
import PriceResult from "@/components/PriceResult";
import { precioArmadura, ArmaduraInput } from "@/lib/precios";
import { itemsPorRazaCategoria, itemPorId, RAZAS_CON_ITEMS, TipoEquipo } from "@/lib/items-catalogo";
import type { Raza } from "@/lib/database.types";

export default function SeccionArmaduras() {
  const [raza, setRaza] = useState<"" | Raza>("");
  const [itemId, setItemId] = useState("");
  const [tipo, setTipo] = useState<"" | TipoEquipo>("");
  const [nivel, setNivel] = useState("10");
  const [hpDdRef, setHpDdRef] = useState(false);
  const [socket, setSocket] = useState<number>(2);
  const [luck, setLuck] = useState(true);

  // Items disponibles para la raza seleccionada
  const itemsDisponibles = useMemo(() => {
    if (!raza) return [];
    return itemsPorRazaCategoria(raza, "armadura");
  }, [raza]);

  // Tipos disponibles para el item seleccionado
  const item = itemId ? itemPorId(itemId) : null;
  const tiposDisponibles: TipoEquipo[] = item ? item.tipos : [];

  // Cuando cambia la raza → reseteo item y tipo
  function onRazaChange(r: Raza | "") {
    setRaza(r);
    setItemId("");
    setTipo("");
  }
  // Cuando cambia el item → reseteo el tipo si no está entre los disponibles
  function onItemChange(id: string) {
    setItemId(id);
    const it = itemPorId(id);
    if (it && tipo && !it.tipos.includes(tipo as TipoEquipo)) {
      setTipo("");
    }
  }

  const precio = useMemo(() => {
    const input: ArmaduraInput = {
      hpDdRef,
      nivel: Number(nivel) || 0,
      tipo: tipo || null,
      socket: tipo === "400" ? socket : null,
      luck,
    };
    return precioArmadura(input);
  }, [hpDdRef, nivel, tipo, socket, luck]);

  const descripcion = [
    `• Armadura: ${item ? item.nombre : "(sin item)"}${raza ? ` (${raza})` : ""}`,
    `• Nivel: ${nivel}`,
    `• Tipo: ${tipo || "—"}${tipo === "400" && socket > 0 ? ` · ${socket} socket${socket === 1 ? "" : "s"}` : ""}`,
    `• HP + DD + REF: ${hpDdRef ? "Sí" : "No"} · Luck: ${luck ? "Sí" : "No"}`,
  ].join("\n");

  let motivoNoPrecio: string | undefined;
  if (!raza) motivoNoPrecio = "Elegí tu raza.";
  else if (!itemId) motivoNoPrecio = "Elegí el item.";
  else if (!tipo) motivoNoPrecio = "Elegí el tipo (s3, 380 o 400).";
  else if (!hpDdRef) motivoNoPrecio = "Las armaduras se compran solo si tienen HP, DD y REF (las 3 opciones).";
  else if ((tipo === "s3" || tipo === "380") && !luck) motivoNoPrecio = "Los items s3 y 380 se compran solo con luck.";
  else if (tipo === "400" && socket < 2) motivoNoPrecio = "Los items 400 se compran solo con 2 o 3 sockets.";

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        {/* Paso 1: Raza */}
        <div>
          <FieldLabel>1. Tu raza</FieldLabel>
          <Select<Raza>
            value={raza}
            onChange={(v) => onRazaChange(v)}
            options={RAZAS_CON_ITEMS.map((r) => ({ value: r, label: r }))}
            placeholder="Elegí tu raza"
          />
        </div>

        {/* Paso 2: Item (filtrado por raza) */}
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

        {/* Paso 3: Tipo (filtrado por item) */}
        {item && (
          <div>
            <FieldLabel>3. Tipo {tiposDisponibles.length === 1 ? "(único disponible)" : ""}</FieldLabel>
            <div className="inline-flex bg-bg-card border border-border-base rounded p-0.5 gap-0.5">
              {(["s3","380","400"] as TipoEquipo[]).map((t) => {
                const disponible = tiposDisponibles.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => disponible && setTipo(t)}
                    disabled={!disponible}
                    className={`px-4 py-2 rounded font-numeric text-sm font-bold transition-all ${
                      !disponible ? "opacity-25 cursor-not-allowed" :
                      tipo === t ? "bg-neon-cyan text-bg-deep" : "text-text-secondary hover:text-text-primary"
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

        {/* Paso 4: Resto (solo cuando hay tipo) */}
        {tipo && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Nivel (0 a 15)</FieldLabel>
                <input
                  type="number" min={0} max={15} value={nivel}
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
                          socket === n ? "bg-neon-cyan text-bg-deep" : "text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  {socket > 0 && (
                    <p className="text-[10px] font-body text-luck-gold mt-1.5 uppercase tracking-wider">
                      +{(socket * 600).toLocaleString("es-AR")} WC
                    </p>
                  )}
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
        <PriceResult precio={precio} descripcion={descripcion} motivoNoPrecio={motivoNoPrecio} categoria="armadura" nombre={item?.nombre || "armadura"} />
      </div>
    </div>
  );
}
