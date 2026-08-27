"use client";

import { useState, useMemo } from "react";
import { FieldLabel, Select, Checkbox, PillToggle } from "@/components/ui/FormField";
import PriceResult from "@/components/PriceResult";
import { precioArma, ArmaInput } from "@/lib/precios";
import { useCfg } from "@/lib/precios-contexto";
import { itemsPorRazaCategoria, itemPorId, RAZAS_CON_ITEMS, TipoEquipo } from "@/lib/items-catalogo";
import type { Raza } from "@/lib/database.types";

export default function SeccionArmas() {
  const cfg = useCfg();
  const [raza, setRaza] = useState<"" | Raza>("");
  const [itemId, setItemId] = useState("");
  const [tipo, setTipo] = useState<"" | TipoEquipo>("");
  const [nivel, setNivel] = useState("9");
  const [exeRate, setExeRate] = useState(true);
  const [dmg2pct, setDmg2pct] = useState(true);
  const [tercera, setTercera] = useState<"" | "speed7" | "dmglvl20">("speed7");
  const [socket, setSocket] = useState<number>(2);
  const [luck, setLuck] = useState(true);
  const [skill, setSkill] = useState(true);

  const speed7 = tercera === "speed7";
  const dmgLvl20 = tercera === "dmglvl20";

  const itemsDisponibles = useMemo(() => {
    if (!raza) return [];
    return itemsPorRazaCategoria(raza, "arma");
  }, [raza]);

  const item = itemId ? itemPorId(itemId) : null;
  const tiposDisponibles: TipoEquipo[] = item ? item.tipos : [];

  function onRazaChange(r: Raza | "") {
    setRaza(r); setItemId(""); setTipo("");
  }
  function onItemChange(id: string) {
    setItemId(id);
    const it = itemPorId(id);
    if (it && tipo && !it.tipos.includes(tipo as TipoEquipo)) setTipo("");
  }

  const precio = useMemo(() => {
    const input: ArmaInput = {
      exeRate, dmgLvl20, dmg2pct, speed7,
      nivel: Number(nivel) || 0,
      tipo: tipo || null,
      socket: tipo === "400" ? socket : null,
      luck, skill,
    };
    return precioArma(input, cfg);
  }, [exeRate, dmgLvl20, dmg2pct, speed7, nivel, tipo, socket, luck, skill, cfg]);

  const opcionesTxt = [
    exeRate ? "exe rate 10%" : null,
    dmg2pct ? "dmg +2%" : null,
    dmgLvl20 ? "dmg lvl/20" : null,
    speed7 ? "speed +7" : null,
  ].filter(Boolean).join(", ") || "(ninguna)";

  const descripcion = [
    `• Arma: ${item ? item.nombre : "(sin item)"}${raza ? ` (${raza})` : ""}`,
    `• Nivel: ${nivel}`,
    `• Opciones: ${opcionesTxt}`,
    `• Tipo: ${tipo || "—"}${tipo === "400" && socket > 0 ? ` · ${socket} socket${socket === 1 ? "" : "s"}` : ""}`,
    `• Luck: ${luck ? "Sí" : "No"} · Skill: ${skill ? "Sí" : "No"}`,
  ].join("\n");

  const tieneTercera = speed7 || dmgLvl20;

  let motivoNoPrecio: string | undefined;
  if (!raza) motivoNoPrecio = "Elegí tu raza.";
  else if (!itemId) motivoNoPrecio = "Elegí el item.";
  else if (!tipo) motivoNoPrecio = "Elegí el tipo del arma (s3, 380 o 400).";
  else if (!exeRate || !dmg2pct) motivoNoPrecio = "Obligatorias: exe rate 10% + dmg +2%. Sin ambas no se compra.";
  else if (tipo === "s3" || tipo === "380") {
    if (!tieneTercera) motivoNoPrecio = "Las armas s3 y 380 necesitan las 3 opciones (falta la tercera).";
    else if (!luck) motivoNoPrecio = "Las armas s3 y 380 se compran solo con luck.";
    else if (!skill) motivoNoPrecio = "Las armas s3 y 380 se compran solo con skill.";
  } else if (tipo === "400" && !tieneTercera) {
    if (!luck || !skill || socket < 2) {
      motivoNoPrecio = "Arma 400 con 2 opciones (rate + 2%) se compra solo con luck + skill + mínimo 2 sockets.";
    }
  }

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
            <FieldLabel>2. Arma</FieldLabel>
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
              {(["s3","380","400"] as TipoEquipo[]).map((t) => {
                const disp = tiposDisponibles.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => disp && setTipo(t)}
                    disabled={!disp}
                    className={`px-4 py-2 rounded font-numeric text-sm font-bold transition-all ${
                      !disp ? "opacity-25 cursor-not-allowed" :
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
                Solo existe en: {tiposDisponibles.join(", ")}.
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
                  type="number" min={0} max={15} value={nivel}
                  onChange={(e) => setNivel(e.target.value)}
                  className="w-full bg-bg-card border border-border-base focus:border-neon-cyan rounded px-3 py-2.5 font-numeric text-text-primary outline-none transition-colors"
                />
              </div>
              {tipo === "400" && (
                <div>
                  <FieldLabel>Sockets</FieldLabel>
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
                      +{(socket * 1200).toLocaleString("es-AR")} WC
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <FieldLabel>Opciones obligatorias</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                <Checkbox checked={exeRate} onChange={setExeRate} label="exe rate 10%" hint="Obligatoria" />
                <Checkbox checked={dmg2pct} onChange={setDmg2pct} label="dmg +2%" hint="Obligatoria" />
              </div>
            </div>

            <div>
              <FieldLabel>Tercera opción {tipo !== "400" ? "(obligatoria)" : "(opcional)"}</FieldLabel>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: "", label: "Ninguna" },
                  { v: "speed7", label: "speed +7" },
                  { v: "dmglvl20", label: "dmg lvl/20" },
                ] as const).map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setTercera(opt.v)}
                    className={`px-3 py-2.5 rounded font-body text-xs uppercase tracking-wider border transition-colors ${
                      tercera === opt.v
                        ? opt.v === "" ? "bg-bg-card-hover border-border-strong text-text-primary" : "bg-neon-cyan/15 border-neon-cyan/60 text-neon-cyan"
                        : "bg-bg-card border-border-base text-text-secondary hover:border-border-strong"
                    }`}
                  >
                    {opt.label}
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
          </>
        )}
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <PriceResult precio={precio} descripcion={descripcion} motivoNoPrecio={motivoNoPrecio} categoria="arma" nombre={item?.nombre || "arma"} />
      </div>
    </div>
  );
}
