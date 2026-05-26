"use client";

import { useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { FieldLabel, TextInput, Select, Checkbox, PillToggle } from "@/components/ui/FormField";
import { precioArmadura, precioArma, precioAlas } from "@/lib/precios";
import { getRaza } from "@/lib/razas";
import type { Categoria, TipoItem, Raza } from "@/lib/database.types";

// Tipo del item para editar (campos que vienen de la DB)
export interface EditableItem {
  id: string;
  categoria: Categoria;
  nombre: string;
  parte: string | null;
  raza: string | null;
  nivel: number;
  tipo: TipoItem;
  socket: number | null;
  hp_dd_ref?: boolean | null;
  luck?: boolean | null;
  exe_rate?: boolean | null;
  dmg_lvl_20?: boolean | null;
  dmg_2pct?: boolean | null;
  speed_7?: boolean | null;
  skill?: boolean | null;
  opc_ignore?: boolean | null;
  opc_return?: boolean | null;
  opc_life_recov?: boolean | null;
  precio_compra: number | null;
  precio_venta: number;
  dueno: string | null;
}

interface Props {
  onClose: () => void;
  onSaved: () => void;
  editItem?: EditableItem;  // si está presente, modo edición
}

type Tab = "armadura" | "arma" | "ala";

export default function ItemFormModal({ onClose, onSaved, editItem }: Props) {
  const initialTab: Tab = editItem ? (editItem.categoria as Tab) : "armadura";
  const [tab, setTab] = useState<Tab>(initialTab);
  const isEdit = !!editItem;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-bg-base border border-border-strong rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-bg-base border-b border-border-base px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-display font-bold text-xl text-text-primary">
            {isEdit ? `Editar: ${editItem.nombre}` : "Nuevo item"}
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs (solo en modo nuevo) */}
        {!isEdit && (
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
        )}

        {/* Form */}
        <div className="p-6">
          {tab === "armadura" && <FormArmadura onClose={onClose} onSaved={onSaved} editItem={editItem} />}
          {tab === "arma" && <FormArma onClose={onClose} onSaved={onSaved} editItem={editItem} />}
          {tab === "ala" && <FormAla onClose={onClose} onSaved={onSaved} editItem={editItem} />}
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
  precioCompraCalc, precioVentaCalc, dueno, setDueno, precioCompraOverride, setPrecioCompraOverride, onSave, saving, canSave, saveLabel,
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
  saveLabel?: string;
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
        {saving ? "Guardando..." : (saveLabel || "Guardar item")}
      </button>
    </div>
  );
}

// =====================================================
// FORM: ARMADURA
// =====================================================
function FormArmadura({ onSaved, onClose, editItem }: { onClose: () => void; onSaved: () => void; editItem?: EditableItem }) {
  const isEdit = !!editItem;
  const [nombre, setNombre] = useState(editItem?.nombre || "");
  const [parte, setParte] = useState(editItem?.parte || "");
  const [raza, setRaza] = useState<"" | Raza>((editItem?.raza as Raza) || "");
  const [nivel, setNivel] = useState(String(editItem?.nivel ?? 10));
  const [hpDdRef, setHpDdRef] = useState(editItem?.hp_dd_ref ?? true);
  const [tipo, setTipo] = useState<"" | TipoItem>(editItem?.tipo || "");
  const [socket, setSocket] = useState(editItem?.socket || 2);
  const [luck, setLuck] = useState(editItem?.luck ?? true);
  const [dueno, setDueno] = useState(editItem?.dueno || "");
  const [precioCompraOverride, setPrecioCompraOverride] = useState(
    editItem?.precio_compra ? String(editItem.precio_compra) : ""
  );
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
    const payload = {
      categoria: "armadura" as Categoria,
      nombre: nombre.trim(),
      parte: parte.trim() || null,
      raza: raza || null,
      nivel: Number(nivel),
      tipo: tipo as TipoItem,
      socket: tipo === "400" ? socket : 0,
      hp_dd_ref: hpDdRef,
      luck,
      precio_compra: precioCompraFinal,
      precio_venta: precioVentaCalc,
      dueno: dueno.trim() || null,
    };
    const { error } = isEdit
      ? await supabase.from("items").update(payload).eq("id", editItem!.id)
      : await supabase.from("items").insert({ ...payload, estado: "activo" });
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
          <FieldLabel>Sockets {tipo === "400" ? "· mín. 2" : "· solo 400"}</FieldLabel>
          <SocketSelector value={socket} onChange={setSocket} disabled={tipo !== "400"} min={2} />
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
        saveLabel={isEdit ? "Guardar cambios" : "Guardar item"}
      />
    </div>
  );
}

// =====================================================
// FORM: ARMA
// =====================================================
function FormArma({ onSaved, onClose, editItem }: { onClose: () => void; onSaved: () => void; editItem?: EditableItem }) {
  const isEdit = !!editItem;
  const [nombre, setNombre] = useState(editItem?.nombre || "");
  const [parte, setParte] = useState(editItem?.parte || "");
  const [raza, setRaza] = useState<"" | Raza>((editItem?.raza as Raza) || "");
  const [nivel, setNivel] = useState(String(editItem?.nivel ?? 9));
  const [exeRate, setExeRate] = useState(editItem?.exe_rate ?? true);
  const [dmgLvl20, setDmgLvl20] = useState(editItem?.dmg_lvl_20 ?? false);
  const [dmg2pct, setDmg2pct] = useState(editItem?.dmg_2pct ?? true);
  const [speed7, setSpeed7] = useState(editItem?.speed_7 ?? true);
  const [tipo, setTipo] = useState<"" | TipoItem>(editItem?.tipo || "");
  const [socket, setSocket] = useState(editItem?.socket || 0);
  const [luck, setLuck] = useState(editItem?.luck ?? true);
  const [skill, setSkill] = useState(editItem?.skill ?? true);
  const [dueno, setDueno] = useState(editItem?.dueno || "");
  const [precioCompraOverride, setPrecioCompraOverride] = useState(
    editItem?.precio_compra ? String(editItem.precio_compra) : ""
  );
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
    const payload = {
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
    };
    const { error } = isEdit
      ? await supabase.from("items").update(payload).eq("id", editItem!.id)
      : await supabase.from("items").insert({ ...payload, estado: "activo" });
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
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => { setSpeed7(false); setDmgLvl20(false); }}
            className={`px-3 py-2.5 rounded font-body text-xs uppercase tracking-wider border transition-colors ${
              !speed7 && !dmgLvl20
                ? "bg-bg-card-hover border-border-strong text-text-primary"
                : "bg-bg-card border-border-base text-text-muted hover:border-border-strong"
            }`}
          >
            Ninguna
          </button>
          <button
            type="button"
            onClick={() => { setSpeed7(true); setDmgLvl20(false); }}
            className={`px-3 py-2.5 rounded font-body text-xs uppercase tracking-wider border transition-colors ${
              speed7
                ? "bg-neon-cyan/15 border-neon-cyan/60 text-neon-cyan"
                : "bg-bg-card border-border-base text-text-secondary hover:border-border-strong"
            }`}
          >
            speed +7
          </button>
          <button
            type="button"
            onClick={() => { setDmgLvl20(true); setSpeed7(false); }}
            className={`px-3 py-2.5 rounded font-body text-xs uppercase tracking-wider border transition-colors ${
              dmgLvl20
                ? "bg-neon-cyan/15 border-neon-cyan/60 text-neon-cyan"
                : "bg-bg-card border-border-base text-text-secondary hover:border-border-strong"
            }`}
          >
            dmg lvl/20
          </button>
        </div>
        {precioVentaCalc === null && exeRate && dmg2pct && (
          <p className="text-[10px] font-body text-neon-orange/80 mt-1.5">
            Esta combinación no se compra con las reglas actuales (revisá tipo, luck, skill o sockets).
          </p>
        )}
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
        saveLabel={isEdit ? "Guardar cambios" : "Guardar item"}
      />
    </div>
  );
}

// =====================================================
// FORM: ALA
// =====================================================
function FormAla({ onSaved, onClose, editItem }: { onClose: () => void; onSaved: () => void; editItem?: EditableItem }) {
  const isEdit = !!editItem;
  const [nombre, setNombre] = useState(editItem?.nombre || "");
  const [nivel, setNivel] = useState(String(editItem?.nivel ?? 0));
  const [ignore, setIgnore] = useState(editItem?.opc_ignore ?? false);
  const [returnOpc, setReturnOpc] = useState(editItem?.opc_return ?? false);
  const [lifeRecovery, setLifeRecovery] = useState(editItem?.opc_life_recov ?? false);
  const [luck, setLuck] = useState(editItem?.luck ?? true);
  const [raza, setRaza] = useState<"" | Raza>((editItem?.raza as Raza) || "");
  const [dueno, setDueno] = useState(editItem?.dueno || "");
  const [precioCompraOverride, setPrecioCompraOverride] = useState(
    editItem?.precio_compra ? String(editItem.precio_compra) : ""
  );
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
    const payload = {
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
    };
    const { error } = isEdit
      ? await supabase.from("items").update(payload).eq("id", editItem!.id)
      : await supabase.from("items").insert({ ...payload, estado: "activo" });
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
        saveLabel={isEdit ? "Guardar cambios" : "Guardar item"}
      />
    </div>
  );
}

// =====================================================
// COMPONENTE: SocketSelector
// =====================================================
function SocketSelector({
  value, onChange, disabled, min = 0,
}: {
  value: number; onChange: (n: number) => void; disabled: boolean; min?: number;
}) {
  const opciones = [0, 1, 2, 3].filter((n) => n >= min);
  return (
    <div className={`inline-flex bg-bg-card border border-border-base rounded p-0.5 gap-0.5 w-full ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
      {opciones.map((n) => (
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
