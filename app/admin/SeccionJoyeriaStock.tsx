"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FieldLabel, TextInput, Select, Checkbox, PillToggle } from "@/components/ui/FormField";
import { precioJoya, precioVentaJoya, JOYA_LABELS, TipoJoya, ANILLO_NOMBRES, PENDIENTE_NOMBRES, joyaLabel, esJoyaBarata } from "@/lib/precios";
import { useCfg } from "@/lib/precios-contexto";
import type { EstadoItem, OpcionVariableJoya } from "@/lib/database.types";

interface Joya {
  id: string;
  tipo: TipoJoya;
  nombre: string | null;
  nivel: number;
  life_recovery: number;
  hp_dd_ref: boolean;
  exe_rate: boolean;
  dmg_2pct: boolean;
  tercera_opcion: string | null;
  opcion_variable: OpcionVariableJoya | null;
  raza: string | null;
  dueno: string | null;
  precio_compra: number;
  precio_venta: number;
  estado: EstadoItem;
  created_at: string;
}

export default function SeccionJoyeriaStock() {
  const [joyas, setJoyas] = useState<Joya[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<EstadoItem | "todos">("activo");
  const [query, setQuery] = useState("");

  async function cargar() {
    setLoading(true);
    const { data } = await supabase
      .from("joyeria_stock")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setJoyas(data as Joya[]);
    setLoading(false);
  }
  useEffect(() => { cargar(); }, []);

  async function cambiarEstado(id: string, estado: EstadoItem) {
    const { error } = await supabase.from("joyeria_stock").update({ estado }).eq("id", id);
    if (error) alert("Error: " + error.message);
    else cargar();
  }
  async function eliminar(id: string) {
    if (!confirm("¿Eliminar registro? Esto es permanente.")) return;
    const { error } = await supabase.from("joyeria_stock").delete().eq("id", id);
    if (error) alert("Error: " + error.message);
    else cargar();
  }

  const visibles = joyas.filter((j) => {
    if (filtroEstado !== "todos" && j.estado !== filtroEstado) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      const h = [joyaLabel(j.tipo, j.nombre), j.raza, j.dueno, j.estado].filter(Boolean).join(" ").toLowerCase();
      if (!h.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-2xl text-text-primary">💍 Joyería</h2>

      <NuevaJoyaForm onSaved={cargar} />

      <div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar: anillo, pendiente, nombre, dueño..."
          className="w-full bg-bg-card border border-border-base focus:border-neon-cyan rounded px-3 py-2.5 font-body text-text-primary placeholder:text-text-muted outline-none transition-colors mb-3"
        />
        <div className="flex flex-wrap gap-2">
          {(["activo", "vendido", "retirado", "todos"] as const).map((e) => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1.5 rounded font-body text-xs uppercase tracking-wider transition-colors ${
                filtroEstado === e
                  ? "bg-neon-cyan/15 border border-neon-cyan/60 text-neon-cyan"
                  : "bg-bg-card border border-border-base text-text-secondary hover:border-border-strong"
              }`}
            >
              {e === "todos" ? "Todos" : e}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="font-body text-text-secondary animate-pulse">Cargando…</p>
      ) : visibles.length === 0 ? (
        <p className="font-body text-text-muted text-center py-8">
          {joyas.length === 0 ? "No hay joyas cargadas." : "Sin resultados con esos filtros."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-base text-left font-body text-xs uppercase tracking-wider text-text-muted">
                <th className="py-2 pr-3">Joya</th>
                <th className="py-2 pr-3 text-right">Nivel</th>
                <th className="py-2 pr-3 text-right">Life</th>
                <th className="py-2 pr-3 text-right">Compra</th>
                <th className="py-2 pr-3 text-right">Venta</th>
                <th className="py-2 pr-3 hidden md:table-cell">Dueño</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((j) => (
                <tr key={j.id} className="border-b border-border-base/40 font-body hover:bg-bg-card/30">
                  <td className="py-2 pr-3 text-text-primary">
                    {joyaLabel(j.tipo, j.nombre)}
                  </td>
                  <td className="py-2 pr-3 text-right font-numeric text-text-secondary">+{j.nivel}</td>
                  <td className="py-2 pr-3 text-right font-numeric text-neon-cyan">{j.life_recovery}%</td>
                  <td className="py-2 pr-3 text-right font-numeric text-text-secondary">{j.precio_compra.toLocaleString("es-AR")}</td>
                  <td className="py-2 pr-3 text-right font-numeric font-bold text-neon-orange">{j.precio_venta.toLocaleString("es-AR")}</td>
                  <td className="py-2 pr-3 text-text-secondary hidden md:table-cell">{j.dueno || "—"}</td>
                  <td className="py-2 pr-3"><EstadoBadge estado={j.estado} /></td>
                  <td className="py-2 text-right">
                    <ActionsMenu
                      estado={j.estado}
                      onCambiarEstado={(e) => cambiarEstado(j.id, e)}
                      onEliminar={() => eliminar(j.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =====================================================
function EstadoBadge({ estado }: { estado: EstadoItem }) {
  const colors: Record<EstadoItem, string> = {
    activo: "bg-success-green/15 text-success-green border-success-green/40",
    vendido: "bg-text-muted/15 text-text-muted border-text-muted/40",
    retirado: "bg-danger-red/15 text-danger-red border-danger-red/40",
  };
  return <span className={`badge ${colors[estado]} border`}>{estado}</span>;
}

function ActionsMenu({
  estado, onCambiarEstado, onEliminar,
}: {
  estado: EstadoItem;
  onCambiarEstado: (e: EstadoItem) => void;
  onEliminar: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="px-2 py-1 rounded font-body text-xs text-text-secondary hover:text-neon-cyan border border-border-base hover:border-neon-cyan/50 transition-colors"
      >
        ⋯
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-44 bg-bg-card border border-border-strong rounded shadow-xl z-20 py-1">
            {estado !== "vendido" && (
              <button onClick={() => { setOpen(false); onCambiarEstado("vendido"); }}
                className="w-full text-left px-3 py-2 font-body text-xs uppercase tracking-wider text-text-secondary hover:bg-bg-card-hover hover:text-text-primary">
                Marcar vendido
              </button>
            )}
            {estado !== "activo" && (
              <button onClick={() => { setOpen(false); onCambiarEstado("activo"); }}
                className="w-full text-left px-3 py-2 font-body text-xs uppercase tracking-wider text-text-secondary hover:bg-bg-card-hover hover:text-text-primary">
                Reactivar
              </button>
            )}
            {estado !== "retirado" && (
              <button onClick={() => { setOpen(false); onCambiarEstado("retirado"); }}
                className="w-full text-left px-3 py-2 font-body text-xs uppercase tracking-wider text-text-secondary hover:bg-bg-card-hover hover:text-text-primary">
                Retirar
              </button>
            )}
            <div className="border-t border-border-base my-1" />
            <button onClick={() => { setOpen(false); onEliminar(); }}
              className="w-full text-left px-3 py-2 font-body text-xs uppercase tracking-wider text-danger-red hover:bg-danger-red/10">
              Eliminar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function NuevaJoyaForm({ onSaved }: { onSaved: () => void }) {
  const cfg = useCfg();
  const [tipo, setTipo] = useState<"" | TipoJoya>("");
  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState("0");
  const [lifeRecovery, setLifeRecovery] = useState(1);
  const [tieneLife, setTieneLife] = useState(true);
  const [hpDdRef, setHpDdRef] = useState(true);
  const [exeRate, setExeRate] = useState(true);
  const [dmg2pct, setDmg2pct] = useState(true);
  const [tercera, setTercera] = useState<"speed7" | "dmglvl20">("speed7");
  const [raza, setRaza] = useState("");
  const [dueno, setDueno] = useState("");
  const [saving, setSaving] = useState(false);

  const input = {
    tipo: tipo || null,
    nombre: nombre || null,
    nivel: Number(nivel) || 0,
    lifeRecovery,
    tieneLife,
    hpDdRef,
    exeRate, dmg2pct, tercera,
  };
  const compra = tipo ? precioJoya(input, cfg) : null;
  const venta = tipo ? precioVentaJoya(input, cfg) : null;
  const sePuede = compra !== null;

  async function guardar() {
    if (!tipo || !nombre || compra === null || venta === null) return;
    setSaving(true);
    const { error } = await supabase.from("joyeria_stock").insert({
      tipo,
      nombre: nombre || null,
      nivel: Number(nivel) || 0,
      life_recovery: lifeRecovery,
      hp_dd_ref: tipo === "anillo" ? hpDdRef : false,
      exe_rate: tipo === "pendiente" ? exeRate : false,
      dmg_2pct: tipo === "pendiente" ? dmg2pct : false,
      tercera_opcion: tipo === "pendiente" ? tercera : null,
      opcion_variable: "life",  // siempre life (solo compramos esos)
      raza: raza.trim() || null,
      dueno: dueno.trim() || "Camus",
      precio_compra: compra,
      precio_venta: venta,
      estado: "activo",
    });
    setSaving(false);
    if (error) alert("Error: " + error.message);
    else {
      setTipo(""); setNombre(""); setNivel("0"); setLifeRecovery(1); setTieneLife(true);
      setHpDdRef(true); setExeRate(true); setDmg2pct(true); setTercera("speed7");
      setRaza(""); setDueno("");
      onSaved();
    }
  }

  return (
    <div className="gamer-card rounded-lg p-4 space-y-3">
      <p className="font-body text-xs uppercase tracking-widest text-text-secondary">Agregar al stock</p>

      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <FieldLabel>Tipo</FieldLabel>
          <Select<TipoJoya>
            value={tipo}
            onChange={(v) => { setTipo(v); setNombre(""); }}
            options={[
              { value: "anillo", label: "Anillo" },
              { value: "pendiente", label: "Pendiente" },
            ]}
            placeholder="—"
          />
        </div>
        <div>
          <FieldLabel>Nombre</FieldLabel>
          <Select<string>
            value={nombre}
            onChange={(v) => setNombre(v)}
            options={tipo === "anillo" ? ANILLO_NOMBRES : tipo === "pendiente" ? PENDIENTE_NOMBRES : []}
            placeholder={tipo ? "Elegí" : "Tipo primero"}
          />
        </div>
        <div>
          <FieldLabel>Nivel (0-15)</FieldLabel>
          <TextInput value={nivel} onChange={setNivel} type="number" min={0} max={15} />
        </div>
      </div>

      {tipo === "anillo" && (
        <Checkbox checked={hpDdRef} onChange={setHpDdRef} label="HP + DD + REF" hint="Sin esto, no se compra" />
      )}

      {tipo === "pendiente" && (
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel>Opciones obligatorias</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              <Checkbox checked={exeRate} onChange={setExeRate} label="exe rate 10%" />
              <Checkbox checked={dmg2pct} onChange={setDmg2pct} label="dmg +2%" />
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
                  className={`px-3 py-2 rounded font-body text-xs uppercase tracking-wider border transition-colors ${
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
        </div>
      )}

      {/* Life Recovery */}
      {tipo && (
        <div className="grid sm:grid-cols-2 gap-3 items-start">
          <div>
            <FieldLabel>¿Tiene Life Recovery?</FieldLabel>
            <PillToggle value={tieneLife} onChange={setTieneLife} trueLabel="Sí" falseLabel="No (AG/Mana)" />
          </div>
          {tieneLife && (
            <div>
              <FieldLabel>Life Recovery: {lifeRecovery}%</FieldLabel>
              <input
                type="range" min={1} max={7} value={lifeRecovery}
                onChange={(e) => setLifeRecovery(Number(e.target.value))}
                className="w-full accent-neon-cyan mt-2.5"
              />
            </div>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-3 items-end">
        <div>
          <FieldLabel>Raza (opcional)</FieldLabel>
          <TextInput value={raza} onChange={setRaza} placeholder="ej. todas" />
        </div>
        <div>
          <FieldLabel>Dueño (opcional)</FieldLabel>
          <TextInput value={dueno} onChange={setDueno} placeholder="Camus" />
        </div>
        <button
          onClick={guardar}
          disabled={!tipo || !nombre || !sePuede || saving}
          className="btn-primary px-4 py-2.5 rounded font-body text-xs uppercase tracking-widest disabled:opacity-40"
        >
          {saving ? "..." : "Agregar"}
        </button>
      </div>

      {tipo && (
        sePuede ? (
          <p className="font-body text-xs text-text-muted">
            compra: <span className="text-text-secondary">{compra!.toLocaleString("es-AR")} WC</span> ·
            venta: <span className="text-neon-orange font-bold">{venta!.toLocaleString("es-AR")} WC</span>
          </p>
        ) : (
          <p className="font-body text-xs text-neon-orange/80">
            {!tieneLife
              ? "Solo compramos joyas con Life Recovery."
              : `Con estos datos no se compra (revisá: ${tipo === "anillo" ? "HP+DD+REF" : "exe rate + 2% + tercera opción"}).`}
          </p>
        )
      )}
    </div>
  );
}
