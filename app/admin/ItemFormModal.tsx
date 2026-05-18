"use client";

import { useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { FieldLabel, TextInput, Select, Checkbox, PillToggle } from "@/components/ui/FormField";
import { precioArmadura, precioArma, precioAlas } from "@/lib/precios";
import { getRaza } from "@/lib/razas";
import type { Categoria, TipoItem, Raza } from "@/lib/database.types";

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

type Tab = "armadura" | "arma" | "ala";

export default function ItemFormModal({ onClose, onSaved }: Props) {
  const [tab, setTab] = useState<Tab>("armadura");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-bg-base border border-border-strong rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-bg-base border-b border-border-base px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-display font-bold text-xl text-text-primary">
            Nuevo item
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 flex gap-2 border-b border-border-base">
          {(["armadura", "arma", "ala"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 font-body text-xs uppercase tracking-wider border-b-2 transition-colors ${
                tab === t
                  ? "border-neon-cyan text-neon-cyan"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {t === "armadura" ? "🛡 Armadura" : t === "arma" ? "⚔ Arma" : "🪽 Ala"}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="p-6">
          {tab === "armadura" && <FormArmadura onClose={onClose} onSaved={onSaved} />}
          {tab === "arma" && <FormArma onClose={onClose} onSaved={onSaved} />}
          {tab === "ala" && <FormAla onClose={onClose} onSaved={onSaved} />}
        </div>
      </div>
    </div>
  );
}

/**
 * Calcula el precio de venta a partir del precio de compra del cotizador.
 *
 * IMPORTANTE: el "precioCompraCotizador" es SIEMPRE el precio teórico
 * que devuelve el cotizador, NO el precio_compra real (que puede haber sido
 * negociado distinto). El precio de venta es UNIFORME para todos los items
 * de una misma categoría/tipo.
 *
 * Multiplicadores:
 *   - Armadura/Arma s3 o 380 → ×3
 *   - Armadura/Arma 400     → ×4
 *   - Ala                   → ×2.1 (tipo siempre s3, no aplica multiplicador por tipo)
 *   - Jewel                 → ×2
 *   - Seed                  → ×3.5
 */
function calcularPrecioVenta(
  precioCompraCotizador: number,
  categoria: "armadura" | "arma" | "ala" | "jewel" | "seed",
  tipo: "s3" | "380" | "400" | null
): number {
  let mult = 1;
  if (categoria === "armadura" || categoria === "arma") {
    mult = tipo === "400" ? 4 : 3;
  } else if (categoria === "ala") {
    mult = 2.1;
  } else if (categoria === "jewel") {
    mult = 2;
  } else if (categoria === "seed") {
    mult = 3.5;
  }
  return Math.round(precioCompraCotizador * mult);
}

// =====================================================
// COMÚN: footer con precio y botón guardar
// =====================================================
function PriceFooter({
  precioCompraCalc, precioVentaCalc, dueno, setDueno, precioCompraOverride, setPrecioCompraOverride, onSave, saving, canSave,
}: {
  precioCompraCalc: number | null;
  precioVentaCalc: number | null;
  dueno: string;
  setDueno: (s: string) => void;
  precioCompraOverride: string;
  setPrecioCompraOverride: (s: string) => void;
  onSave: () => void;
  saving: boolean;
  canSave: boolean;
}) {
  return (
    <div className="mt-6 pt-6 border-t border-border-base space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Dueño in-game</FieldLabel>
          <TextInput value={dueno} onChange={setDueno} placeholder="Nick del jugador..." />
        </div>
        <div>
          <FieldLabel>Precio compra (override opcional)</FieldLabel>
          <TextInput value={precioCompraOverride} onChange={setPrecioCompraOverride} type="number" placeholder={precioCompraCalc ? String(precioCompraCalc) : "auto"} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded bg-bg-card border border-border-base">
          <p className="text-[10px] font-body text-text-muted uppercase tracking-widest mb-1">
            Pagás al jugador
          </p>
          <p className="font-numeric font-bold text-xl text-text-secondary">
            {precioCompraCalc !== null ? precioCompraCalc.toLocaleString("es-AR") : "—"} <span className="text-xs text-text-muted">WC</span>
          </p>
        </div>
        <div className="p-4 rounded bg-bg-card border border-neon-orange/40">
          <p className="text-[10px] font-body text-neon-orange uppercase tracking-widest mb-1">
            Precio de venta (público)
          </p>
          <p className="font-numeric font-bold text-2xl neon-text-orange">
            {precioVentaCalc !== null ? precioVentaCalc.toLocaleString("es-AR") : "—"} <span className="text-xs text-text-muted">WC</span>
          </p>
        </div>
      </div>

      <button
        onClick={onSave}
        disabled={!canSave || saving || precioVentaCalc === null}
        className="btn-primary w-full px-6 py-3 rounded font-body text-xs uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? "Guardando..." : "Guardar item"}
      </button>
    </div>
  );
}

// =====================================================
// FORM: ARMADURA
// =====================================================
function FormArmadura({ onSaved, onClose }: { onClose: () => void; onSaved: () => void }) {
  const [nombre, setNombre] = useState("");
  const [parte, setParte] = useState("");
  const [raza, setRaza] = useState<"" | Raza>("");
  const [nivel, setNivel] = useState("10");
  const [hpDdRef, setHpDdRef] = useState(true);
  const [tipo, setTipo] = useState<"" | TipoItem>("");
  const [socket, setSocket] = useState(0);
  const [luck, setLuck] = useState(true);
  const [dueno, setDueno] = useState("");
  const [precioCompraOverride, setPrecioCompraOverride] = useState("");
  const [saving, setSaving] = useState(false);

  function onNombreChange(s: string) {
    setNombre(s);
    if (!raza) {
      const r = getRaza(s);
      if (r) setRaza(r as Raza);
    }
  }

  const precioCompraCalc = useMemo(() => {
    return precioArmadura({
      hpDdRef, nivel: Number(nivel) || 0, tipo: tipo || null,
      socket: tipo === "400" ? socket : null, luck,
    });
  }, [hpDdRef, nivel, tipo, socket, luck]);

  // precio_compra real = override del admin (si lo puso) o el del cotizador.
  // Es SOLO informativo, no afecta el precio de venta.
  const precioCompraFinal = useMemo(() => {
    if (precioCompraOverride && Number(precioCompraOverride) > 0) {
      return Number(precioCompraOverride);
    }
    return precioCompraCalc;
  }, [precioCompraOverride, precioCompraCalc]);

  const precioVentaCalc = useMemo(() => {
    if (precioCompraCalc === null) return null;
    return calcularPrecioVenta(precioCompraCalc, "armadura", tipo || null);
  }, [precioCompraCalc, tipo]);

  async function guardar() {
    if (precioVentaCalc === null) return;
    setSaving(true);
    const { error } = await supabase.from("items").insert({
      categoria: "armadura" as Categoria,
      nombre: nombre.trim(),
      parte: parte.trim() || null,
      raza: raza || null,
      nivel: Number(nivel),
      tipo: tipo as TipoItem,
      socket: tipo === "400" ? socket : 0,
      hp_dd_ref: hpDdRef,
      luck,
      precio_compra: precioCompraFinal,    // lo que realmente pagaste (informativo)
      precio_venta: precioVentaCalc,        // siempre uniforme según cotizador × multiplicador
      dueno: dueno.trim() || null,
      estado: "activo",
    });
    setSaving(false);
    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      onSaved();
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Nombre del item</FieldLabel>
          <TextInput value={nombre} onChange={onNombreChange} placeholder="queen, titan..." />
        </div>
        <div>
          <FieldLabel>Parte</FieldLabel>
          <TextInput value={parte} onChange={setParte} placeholder="helm, armor..." />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Raza (auto)</FieldLabel>
          <Select<Raza>
            value={raza}
            onChange={(v) => setRaza(v)}
            options={[
              { value: "Knight", label: "Knight" },
              { value: "Wizard", label: "Wizard" },
              { value: "Elf", label: "Elf" },
              { value: "Gladiator", label: "Gladiator" },
              { value: "Lord", label: "Lord" },
              { value: "Summoner", label: "Summoner" },
            ]}
            placeholder="—"
          />
        </div>
        <div>
          <FieldLabel>Nivel (0 a 15)</FieldLabel>
          <TextInput value={nivel} onChange={setNivel} type="number" min={0} max={15} />
        </div>
      </div>

      <div>
        <FieldLabel>Opciones</FieldLabel>
        <Checkbox checked={hpDdRef} onChange={setHpDdRef} label="HP + DD + REF" hint="Las 3 obligatorias" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Tipo</FieldLabel>
          <Select<TipoItem>
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
          <SocketSelector value={socket} onChange={setSocket} disabled={tipo !== "400"} />
        </div>
      </div>

      <div>
        <FieldLabel>¿Tiene Luck?</FieldLabel>
        <PillToggle value={luck} onChange={setLuck} />
      </div>

      <PriceFooter
        precioCompraCalc={precioCompraFinal}
        precioVentaCalc={precioVentaCalc}
        dueno={dueno}
        setDueno={setDueno}
        precioCompraOverride={precioCompraOverride}
        setPrecioCompraOverride={setPrecioCompraOverride}
        onSave={guardar}
        saving={saving}
        canSave={!!nombre && !!tipo && precioVentaCalc !== null}
      />
    </div>
  );
}

// =====================================================
// FORM: ARMA
// =====================================================
function FormArma({ onSaved, onClose }: { onClose: () => void; onSaved: () => void }) {
  const [nombre, setNombre] = useState("");
  const [parte, setParte] = useState("");
  const [raza, setRaza] = useState<"" | Raza>("");
  const [nivel, setNivel] = useState("9");
  const [exeRate, setExeRate] = useState(true);
  const [dmgLvl20, setDmgLvl20] = useState(false);
  const [dmg2pct, setDmg2pct] = useState(true);
  const [speed7, setSpeed7] = useState(true);
  const [tipo, setTipo] = useState<"" | TipoItem>("");
  const [socket, setSocket] = useState(0);
  const [luck, setLuck] = useState(true);
  const [skill, setSkill] = useState(true);
  const [dueno, setDueno] = useState("");
  const [precioCompraOverride, setPrecioCompraOverride] = useState("");
  const [saving, setSaving] = useState(false);

  function onNombreChange(s: string) {
    setNombre(s);
    if (!raza) {
      const r = getRaza(s);
      if (r) setRaza(r as Raza);
    }
  }

  const precioCompraCalc = useMemo(() => {
    return precioArma({
      exeRate, dmgLvl20, dmg2pct, speed7,
      nivel: Number(nivel) || 0,
      tipo: tipo || null,
      socket: tipo === "400" ? socket : null,
      luck, skill,
    });
  }, [exeRate, dmgLvl20, dmg2pct, speed7, nivel, tipo, socket, luck, skill]);

  // precio_compra real (informativo)
  const precioCompraFinal = useMemo(() => {
    if (precioCompraOverride && Number(precioCompraOverride) > 0) {
      return Number(precioCompraOverride);
    }
    return precioCompraCalc;
  }, [precioCompraOverride, precioCompraCalc]);

  const precioVentaCalc = useMemo(() => {
    if (precioCompraCalc === null) return null;
    return calcularPrecioVenta(precioCompraCalc, "arma", tipo || null);
  }, [precioCompraCalc, tipo]);

  async function guardar() {
    if (precioVentaCalc === null) return;
    setSaving(true);
    const { error } = await supabase.from("items").insert({
      categoria: "arma" as Categoria,
      nombre: nombre.trim() || parte.trim(),
      parte: parte.trim() || null,
      raza: raza || null,
      nivel: Number(nivel),
      tipo: tipo as TipoItem,
      socket: tipo === "400" ? socket : 0,
      exe_rate: exeRate, dmg_lvl_20: dmgLvl20, dmg_2pct: dmg2pct, speed_7: speed7,
      skill, luck,
      precio_compra: precioCompraFinal,
      precio_venta: precioVentaCalc,
      dueno: dueno.trim() || null,
      estado: "activo",
    });
    setSaving(false);
    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      onSaved();
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Nombre del item</FieldLabel>
          <TextInput value={nombre} onChange={onNombreChange} placeholder="ej: sword breaker" />
        </div>
        <div>
          <FieldLabel>Tipo de arma</FieldLabel>
          <TextInput value={parte} onChange={setParte} placeholder="sword, staff, blade..." />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Raza</FieldLabel>
          <Select<Raza>
            value={raza}
            onChange={(v) => setRaza(v)}
            options={[
              { value: "Knight", label: "Knight" },
              { value: "Wizard", label: "Wizard" },
              { value: "Elf", label: "Elf" },
              { value: "Gladiator", label: "Gladiator" },
              { value: "Lord", label: "Lord" },
              { value: "Summoner", label: "Summoner" },
            ]}
            placeholder="—"
          />
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
        <div className="grid grid-cols-2 gap-2">
          <Checkbox checked={dmgLvl20} onChange={setDmgLvl20} label="dmg lvl/20" hint="Opcional A" />
          <Checkbox checked={speed7} onChange={setSpeed7} label="speed +7" hint="Opcional B" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Tipo</FieldLabel>
          <Select<TipoItem>
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
          <SocketSelector value={socket} onChange={setSocket} disabled={tipo !== "400"} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>¿Luck?</FieldLabel>
          <PillToggle value={luck} onChange={setLuck} />
        </div>
        <div>
          <FieldLabel>¿Skill?</FieldLabel>
          <PillToggle value={skill} onChange={setSkill} />
        </div>
      </div>

      <PriceFooter
        precioCompraCalc={precioCompraFinal}
        precioVentaCalc={precioVentaCalc}
        dueno={dueno}
        setDueno={setDueno}
        precioCompraOverride={precioCompraOverride}
        setPrecioCompraOverride={setPrecioCompraOverride}
        onSave={guardar}
        saving={saving}
        canSave={(!!nombre || !!parte) && !!tipo && precioVentaCalc !== null}
      />
    </div>
  );
}

// =====================================================
// FORM: ALA
// =====================================================
function FormAla({ onSaved, onClose }: { onClose: () => void; onSaved: () => void }) {
  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState("0");
  const [ignore, setIgnore] = useState(false);
  const [returnOpc, setReturnOpc] = useState(false);
  const [lifeRecovery, setLifeRecovery] = useState(false);
  const [luck, setLuck] = useState(true);
  const [raza, setRaza] = useState<"" | Raza>("");
  const [dueno, setDueno] = useState("");
  const [precioCompraOverride, setPrecioCompraOverride] = useState("");
  const [saving, setSaving] = useState(false);

  const precioCompraCalc = useMemo(() => {
    return precioAlas({
      ignore, returnOpc, lifeRecovery, luck,
      nivel: Number(nivel) || 0,
    });
  }, [ignore, returnOpc, lifeRecovery, luck, nivel]);

  // precio_compra real (informativo, no afecta venta)
  const precioCompraFinal = useMemo(() => {
    if (precioCompraOverride && Number(precioCompraOverride) > 0) {
      return Number(precioCompraOverride);
    }
    return precioCompraCalc;
  }, [precioCompraOverride, precioCompraCalc]);

  // Alas siempre × 2.1 (tipo s3 implícito)
  const precioVentaCalc = useMemo(() => {
    if (precioCompraCalc === null) return null;
    return calcularPrecioVenta(precioCompraCalc, "ala", "s3");
  }, [precioCompraCalc]);

  async function guardar() {
    if (precioVentaCalc === null) return;
    setSaving(true);
    const { error } = await supabase.from("items").insert({
      categoria: "ala" as Categoria,
      nombre: nombre.trim(),
      parte: "wings",
      raza: raza || null,
      nivel: Number(nivel),
      tipo: "s3" as TipoItem,
      socket: 0,
      opc_ignore: ignore,
      opc_return: returnOpc,
      opc_life_recov: lifeRecovery,
      luck,
      precio_compra: precioCompraFinal,
      precio_venta: precioVentaCalc,
      dueno: dueno.trim() || null,
      estado: "activo",
    });
    setSaving(false);
    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      onSaved();
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Nombre del item</FieldLabel>
          <TextInput value={nombre} onChange={setNombre} placeholder="wing of storm..." />
        </div>
        <div>
          <FieldLabel>Nivel (0 a 15)</FieldLabel>
          <TextInput value={nivel} onChange={setNivel} type="number" min={0} max={15} />
        </div>
      </div>

      <div>
        <FieldLabel>Raza</FieldLabel>
        <Select<Raza>
          value={raza}
          onChange={(v) => setRaza(v)}
          options={[
            { value: "Knight", label: "Knight" },
            { value: "Wizard", label: "Wizard" },
            { value: "Elf", label: "Elf" },
            { value: "Gladiator", label: "Gladiator" },
            { value: "Lord", label: "Lord" },
            { value: "Summoner", label: "Summoner" },
          ]}
          placeholder="—"
        />
      </div>

      <div>
        <FieldLabel>Opciones</FieldLabel>
        <div className="grid sm:grid-cols-3 gap-2">
          <Checkbox checked={ignore} onChange={setIgnore} label="Ignore" hint="Ignora defensa" />
          <Checkbox checked={returnOpc} onChange={setReturnOpc} label="Return" hint="Refleja daño" />
          <Checkbox checked={lifeRecovery} onChange={setLifeRecovery} label="Life Recovery" hint="Recupera HP" />
        </div>
      </div>

      <div>
        <FieldLabel>¿Tiene Luck?</FieldLabel>
        <PillToggle value={luck} onChange={setLuck} />
      </div>

      <PriceFooter
        precioCompraCalc={precioCompraFinal}
        precioVentaCalc={precioVentaCalc}
        dueno={dueno}
        setDueno={setDueno}
        precioCompraOverride={precioCompraOverride}
        setPrecioCompraOverride={setPrecioCompraOverride}
        onSave={guardar}
        saving={saving}
        canSave={!!nombre && precioVentaCalc !== null}
      />
    </div>
  );
}

// =====================================================
// COMPONENTE: SocketSelector
// =====================================================
function SocketSelector({
  value, onChange, disabled,
}: {
  value: number; onChange: (n: number) => void; disabled: boolean;
}) {
  return (
    <div className={`inline-flex bg-bg-card border border-border-base rounded p-0.5 gap-0.5 w-full ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
      {[0, 1, 2, 3].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`flex-1 px-2 py-1.5 rounded font-numeric text-sm font-bold transition-all ${
            value === n ? "bg-neon-cyan text-bg-deep" : "text-text-secondary hover:text-text-primary"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
