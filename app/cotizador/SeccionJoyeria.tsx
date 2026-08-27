"use client";

import { useState, useMemo } from "react";
import { FieldLabel, Select, Checkbox, PillToggle } from "@/components/ui/FormField";
import PriceResult from "@/components/PriceResult";
import { useCfg } from "@/lib/precios-contexto";
import {
  precioJoya, JoyaInput, TipoJoya,
  ANILLO_NOMBRES, PENDIENTE_NOMBRES, joyaLabel, esJoyaBarata,
} from "@/lib/precios";

export default function SeccionJoyeria() {
  const cfg = useCfg();
  const [tipo, setTipo] = useState<"" | TipoJoya>("");
  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState("0");
  const [lifeRecovery, setLifeRecovery] = useState(1);
  const [tieneLife, setTieneLife] = useState(true);
  // Anillo
  const [hpDdRef, setHpDdRef] = useState(true);
  // Pendiente
  const [exeRate, setExeRate] = useState(true);
  const [dmg2pct, setDmg2pct] = useState(true);
  const [tercera, setTercera] = useState<"speed7" | "dmglvl20">("speed7");

  const precio = useMemo(() => {
    const input: JoyaInput = {
      tipo: tipo || null,
      nombre: nombre || null,
      nivel: Number(nivel) || 0,
      lifeRecovery,
      tieneLife,
      hpDdRef,
      exeRate, dmg2pct, tercera,
    };
    return precioJoya(input, cfg);
  }, [tipo, nombre, nivel, lifeRecovery, tieneLife, hpDdRef, exeRate, dmg2pct, tercera, cfg]);

  const nombresDisponibles = tipo === "anillo" ? ANILLO_NOMBRES : tipo === "pendiente" ? PENDIENTE_NOMBRES : [];
  const esBarata = tipo && nombre ? esJoyaBarata(tipo, nombre) : false;

  const descripcion = [
    `• ${tipo ? joyaLabel(tipo, nombre || null) : "(sin tipo)"}`,
    `• Nivel: ${nivel}`,
    tieneLife ? `• Life Recovery: ${lifeRecovery}%` : `• Sin Life Recovery`,
    tipo === "pendiente"
      ? `• Opciones: exe rate, dmg 2%, ${tercera === "speed7" ? "speed +7" : "dmg lvl/20"}`
      : `• HP+DD+REF`,
  ].join("\n");

  let motivoNoPrecio: string | undefined;
  if (!tipo) {
    motivoNoPrecio = "Elegí si es anillo o pendiente.";
  } else if (!nombre) {
    motivoNoPrecio = "Elegí el nombre de la joya.";
  } else if (!tieneLife) {
    motivoNoPrecio = "Solo compramos joyas con la opción Life Recovery. Marcá que la tiene para cotizar.";
  } else if (tipo === "anillo") {
    if (!hpDdRef) motivoNoPrecio = "Los anillos se compran solo con HP + DD + REF.";
  } else {
    if (!exeRate || !dmg2pct) motivoNoPrecio = "Los pendientes necesitan exe rate 10% + dmg 2% (obligatorias).";
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Tipo de joya</FieldLabel>
            <Select<TipoJoya>
              value={tipo}
              onChange={(v) => { setTipo(v); setNombre(""); }}
              options={[
                { value: "anillo", label: "Anillo" },
                { value: "pendiente", label: "Pendiente" },
              ]}
              placeholder="Elegí tipo"
            />
          </div>
          <div>
            <FieldLabel>Nombre</FieldLabel>
            <Select<string>
              value={nombre}
              onChange={(v) => setNombre(v)}
              options={nombresDisponibles}
              placeholder={tipo ? "Elegí nombre" : "Primero el tipo"}
            />
            {esBarata && (
              <p className="text-[10px] font-body text-neon-orange/80 mt-1.5">
                Variante de menor valor (-30%).
              </p>
            )}
          </div>
        </div>

        {tipo && (
          <>
            <div>
              <FieldLabel>Nivel (0 a 15)</FieldLabel>
              <input
                type="number" min={0} max={15} value={nivel}
                onChange={(e) => setNivel(e.target.value)}
                className="w-full bg-bg-card border border-border-base focus:border-neon-cyan rounded px-3 py-2.5 font-numeric text-text-primary outline-none transition-colors"
              />
            </div>

            {/* Opciones obligatorias según tipo */}
            {tipo === "anillo" && (
              <div>
                <FieldLabel>Opción obligatoria</FieldLabel>
                <Checkbox checked={hpDdRef} onChange={setHpDdRef} label="HP + DD + REF" hint="Sin esto, no se compra" />
              </div>
            )}

            {tipo === "pendiente" && (
              <>
                <div>
                  <FieldLabel>Opciones obligatorias (de arma)</FieldLabel>
                  <div className="grid grid-cols-2 gap-2">
                    <Checkbox checked={exeRate} onChange={setExeRate} label="exe rate 10%" hint="Obligatoria" />
                    <Checkbox checked={dmg2pct} onChange={setDmg2pct} label="dmg +2%" hint="Obligatoria" />
                  </div>
                </div>
                <div>
                  <FieldLabel>Tercera opción (obligatoria)</FieldLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { v: "speed7", label: "speed +7" },
                      { v: "dmglvl20", label: "dmg lvl/20" },
                    ] as const).map((opt) => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => setTercera(opt.v)}
                        className={`px-3 py-2.5 rounded font-body text-xs uppercase tracking-wider border transition-colors ${
                          tercera === opt.v
                            ? "bg-neon-cyan/15 border-neon-cyan/60 text-neon-cyan"
                            : "bg-bg-card border-border-base text-text-secondary hover:border-border-strong"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Life Recovery (opción de joyería) */}
            <div>
              <FieldLabel>¿Tiene Life Recovery?</FieldLabel>
              <PillToggle value={tieneLife} onChange={setTieneLife} trueLabel="Sí, tiene Life" falseLabel="No (AG/Mana)" />
              {!tieneLife && (
                <p className="text-[10px] font-body text-neon-orange/80 mt-1.5">
                  Solo compramos joyas con Life Recovery.
                </p>
              )}
            </div>

            {tieneLife && (
              <div>
                <FieldLabel>Life Recovery: {lifeRecovery}%</FieldLabel>
                <input
                  type="range" min={1} max={7} value={lifeRecovery}
                  onChange={(e) => setLifeRecovery(Number(e.target.value))}
                  className="w-full accent-neon-cyan mt-3"
                />
                <div className="flex justify-between text-[10px] font-numeric text-text-muted mt-1">
                  {[1,2,3,4,5,6,7].map((n) => <span key={n}>{n}</span>)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <PriceResult precio={precio} descripcion={descripcion} motivoNoPrecio={motivoNoPrecio} categoria="joya" nombre={tipo ? joyaLabel(tipo, nombre || null) : "joya"} />
      </div>
    </div>
  );
}
