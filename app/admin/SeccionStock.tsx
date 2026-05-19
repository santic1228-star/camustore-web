"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FieldLabel, TextInput, Select, PillToggle } from "@/components/ui/FormField";
import { JEWEL_PRECIOS, JEWEL_LABELS, SEED_LABELS } from "@/lib/precios";
import type { TipoJewel, TipoSeed, EstadoItem } from "@/lib/database.types";

interface Jewel {
  id: string;
  tipo: TipoJewel;
  bundles: number;
  dueno: string | null;
  estado: EstadoItem;
  created_at: string;
}

interface Seed {
  id: string;
  tipo: TipoSeed;
  ensamblada_penta: boolean;
  cantidad: number;
  dueno: string | null;
  estado: EstadoItem;
  created_at: string;
}

// =====================================================
// Cálculos de precios
// =====================================================
function precioCompraJewel(tipo: TipoJewel, bundles: number): number {
  return JEWEL_PRECIOS[tipo] * bundles;
}
function precioVentaJewel(tipo: TipoJewel, bundles: number): number {
  return Math.round(precioCompraJewel(tipo, bundles) * 2); // ×2
}

function precioCompraSeed(tipo: TipoSeed, ensamblada_penta: boolean, cantidad: number): number {
  const base = tipo === "max_life" ? 35000 : 40000;
  const unit = ensamblada_penta ? base + 5000 : base;
  return unit * cantidad;
}
function precioVentaSeed(tipo: TipoSeed, ensamblada_penta: boolean, cantidad: number): number {
  return Math.round(precioCompraSeed(tipo, ensamblada_penta, cantidad) * 3.5); // ×3.5
}

// =====================================================
// PÁGINA
// =====================================================
export default function SeccionStock() {
  const [jewels, setJewels] = useState<Jewel[]>([]);
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<EstadoItem | "todos">("activo");
  const [query, setQuery] = useState("");

  async function cargar() {
    setLoading(true);
    const [j, s] = await Promise.all([
      supabase.from("jewels_stock").select("*").order("created_at", { ascending: false }),
      supabase.from("seeds_stock").select("*").order("created_at", { ascending: false }),
    ]);
    if (j.data) setJewels(j.data as Jewel[]);
    if (s.data) setSeeds(s.data as Seed[]);
    setLoading(false);
  }
  useEffect(() => { cargar(); }, []);

  async function cambiarEstadoJewel(id: string, estado: EstadoItem) {
    const { error } = await supabase.from("jewels_stock").update({ estado }).eq("id", id);
    if (error) alert("Error: " + error.message);
    else cargar();
  }
  async function cambiarEstadoSeed(id: string, estado: EstadoItem) {
    const { error } = await supabase.from("seeds_stock").update({ estado }).eq("id", id);
    if (error) alert("Error: " + error.message);
    else cargar();
  }

  async function eliminar(table: "jewels_stock" | "seeds_stock", id: string) {
    if (!confirm("¿Eliminar registro? Esto es permanente.")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) alert("Error: " + error.message);
    else cargar();
  }

  // Filtros aplicados
  const jewelsVisibles = jewels.filter((j) => {
    if (filtroEstado !== "todos" && j.estado !== filtroEstado) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      const h = [JEWEL_LABELS[j.tipo], j.dueno, j.estado].filter(Boolean).join(" ").toLowerCase();
      if (!h.includes(q)) return false;
    }
    return true;
  });

  const seedsVisibles = seeds.filter((s) => {
    if (filtroEstado !== "todos" && s.estado !== filtroEstado) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      const h = [SEED_LABELS[s.tipo], s.dueno, s.estado, s.ensamblada_penta ? "penta" : ""].filter(Boolean).join(" ").toLowerCase();
      if (!h.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-10">
      {/* Buscador y filtros (globales) */}
      <div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar: bless, soul, max life, penta, Camus..."
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

      {/* JEWELS */}
      <section>
        <h2 className="font-display font-bold text-2xl text-text-primary mb-3">💎 Jewels</h2>

        <NuevoJewelForm onSaved={cargar} />

        {loading ? (
          <p className="font-body text-text-secondary animate-pulse mt-6">Cargando…</p>
        ) : jewelsVisibles.length === 0 ? (
          <p className="font-body text-text-muted text-center py-8 mt-4">
            {jewels.length === 0 ? "No hay jewels cargados." : "Sin resultados con esos filtros."}
          </p>
        ) : (
          <div className="overflow-x-auto mt-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-base text-left font-body text-xs uppercase tracking-wider text-text-muted">
                  <th className="py-2 pr-3">Tipo</th>
                  <th className="py-2 pr-3 text-right">Bundles</th>
                  <th className="py-2 pr-3 text-right hidden sm:table-cell">Jewels</th>
                  <th className="py-2 pr-3 text-right">Compra</th>
                  <th className="py-2 pr-3 text-right">Venta</th>
                  <th className="py-2 pr-3 hidden md:table-cell">Dueño</th>
                  <th className="py-2 pr-3">Estado</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {jewelsVisibles.map((j) => (
                  <tr key={j.id} className="border-b border-border-base/40 font-body hover:bg-bg-card/30">
                    <td className="py-2 pr-3 text-text-primary">{JEWEL_LABELS[j.tipo]}</td>
                    <td className="py-2 pr-3 text-right font-numeric text-neon-cyan">{j.bundles}</td>
                    <td className="py-2 pr-3 text-right font-numeric text-text-secondary hidden sm:table-cell">
                      {(j.bundles * 30).toLocaleString("es-AR")}
                    </td>
                    <td className="py-2 pr-3 text-right font-numeric text-text-secondary">
                      {precioCompraJewel(j.tipo, j.bundles).toLocaleString("es-AR")}
                    </td>
                    <td className="py-2 pr-3 text-right font-numeric font-bold text-neon-orange">
                      {precioVentaJewel(j.tipo, j.bundles).toLocaleString("es-AR")}
                    </td>
                    <td className="py-2 pr-3 text-text-secondary hidden md:table-cell">{j.dueno || "—"}</td>
                    <td className="py-2 pr-3"><EstadoBadge estado={j.estado} /></td>
                    <td className="py-2 text-right">
                      <ActionsMenu
                        estado={j.estado}
                        onCambiarEstado={(e) => cambiarEstadoJewel(j.id, e)}
                        onEliminar={() => eliminar("jewels_stock", j.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SEEDS */}
      <section>
        <h2 className="font-display font-bold text-2xl text-text-primary mb-3">🌱 Seeds</h2>

        <NuevoSeedForm onSaved={cargar} />

        {loading ? null : seedsVisibles.length === 0 ? (
          <p className="font-body text-text-muted text-center py-8 mt-4">
            {seeds.length === 0 ? "No hay seeds cargadas." : "Sin resultados con esos filtros."}
          </p>
        ) : (
          <div className="overflow-x-auto mt-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-base text-left font-body text-xs uppercase tracking-wider text-text-muted">
                  <th className="py-2 pr-3">Tipo</th>
                  <th className="py-2 pr-3">Penta</th>
                  <th className="py-2 pr-3 text-right">Cantidad</th>
                  <th className="py-2 pr-3 text-right">Compra</th>
                  <th className="py-2 pr-3 text-right">Venta</th>
                  <th className="py-2 pr-3 hidden md:table-cell">Dueño</th>
                  <th className="py-2 pr-3">Estado</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {seedsVisibles.map((s) => (
                  <tr key={s.id} className="border-b border-border-base/40 font-body hover:bg-bg-card/30">
                    <td className="py-2 pr-3 text-text-primary">{SEED_LABELS[s.tipo]}</td>
                    <td className="py-2 pr-3">
                      {s.ensamblada_penta ? (
                        <span className="badge bg-luck-gold/15 text-luck-gold border border-luck-gold/40">Penta</span>
                      ) : (
                        <span className="text-text-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-right font-numeric text-neon-cyan">{s.cantidad}</td>
                    <td className="py-2 pr-3 text-right font-numeric text-text-secondary">
                      {precioCompraSeed(s.tipo, s.ensamblada_penta, s.cantidad).toLocaleString("es-AR")}
                    </td>
                    <td className="py-2 pr-3 text-right font-numeric font-bold text-neon-orange">
                      {precioVentaSeed(s.tipo, s.ensamblada_penta, s.cantidad).toLocaleString("es-AR")}
                    </td>
                    <td className="py-2 pr-3 text-text-secondary hidden md:table-cell">{s.dueno || "—"}</td>
                    <td className="py-2 pr-3"><EstadoBadge estado={s.estado} /></td>
                    <td className="py-2 text-right">
                      <ActionsMenu
                        estado={s.estado}
                        onCambiarEstado={(e) => cambiarEstadoSeed(s.id, e)}
                        onEliminar={() => eliminar("seeds_stock", s.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// =====================================================
// SHARED COMPONENTS
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
              <button
                onClick={() => { setOpen(false); onCambiarEstado("vendido"); }}
                className="w-full text-left px-3 py-2 font-body text-xs uppercase tracking-wider text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"
              >
                Marcar vendido
              </button>
            )}
            {estado !== "activo" && (
              <button
                onClick={() => { setOpen(false); onCambiarEstado("activo"); }}
                className="w-full text-left px-3 py-2 font-body text-xs uppercase tracking-wider text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"
              >
                Reactivar
              </button>
            )}
            {estado !== "retirado" && (
              <button
                onClick={() => { setOpen(false); onCambiarEstado("retirado"); }}
                className="w-full text-left px-3 py-2 font-body text-xs uppercase tracking-wider text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"
              >
                Retirar
              </button>
            )}
            <div className="border-t border-border-base my-1" />
            <button
              onClick={() => { setOpen(false); onEliminar(); }}
              className="w-full text-left px-3 py-2 font-body text-xs uppercase tracking-wider text-danger-red hover:bg-danger-red/10"
            >
              Eliminar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// =====================================================
// FORM NUEVO JEWEL
// =====================================================
function NuevoJewelForm({ onSaved }: { onSaved: () => void }) {
  const [tipo, setTipo] = useState<"" | TipoJewel>("");
  const [bundles, setBundles] = useState("1");
  const [dueno, setDueno] = useState("");
  const [saving, setSaving] = useState(false);
  const bundlesNum = Math.max(0, Math.min(99, Number(bundles) || 0));

  async function guardar() {
    if (!tipo || bundlesNum < 1) return;
    setSaving(true);
    const { error } = await supabase.from("jewels_stock").insert({
      tipo, bundles: bundlesNum, dueno: dueno.trim() || "Camus", estado: "activo",
    });
    setSaving(false);
    if (error) alert("Error: " + error.message);
    else {
      setTipo(""); setBundles("1"); setDueno("");
      onSaved();
    }
  }

  const compra = tipo ? precioCompraJewel(tipo, bundlesNum) : 0;
  const venta = tipo ? precioVentaJewel(tipo, bundlesNum) : 0;

  return (
    <div className="gamer-card rounded-lg p-4">
      <p className="font-body text-xs uppercase tracking-widest text-text-secondary mb-3">Agregar al stock</p>
      <div className="grid sm:grid-cols-4 gap-3">
        <div>
          <FieldLabel>Tipo</FieldLabel>
          <Select<TipoJewel>
            value={tipo}
            onChange={(v) => setTipo(v)}
            options={[
              { value: "chaos", label: "Chaos" },
              { value: "creation", label: "Creation" },
              { value: "soul", label: "Soul" },
              { value: "bless", label: "Bless" },
              { value: "harmony", label: "Harmony" },
              { value: "life", label: "Life" },
            ]}
            placeholder="—"
          />
        </div>
        <div>
          <FieldLabel>Bundles (0-99)</FieldLabel>
          <TextInput value={bundles} onChange={setBundles} type="number" min={1} max={99} />
        </div>
        <div>
          <FieldLabel>Dueño (opcional)</FieldLabel>
          <TextInput value={dueno} onChange={setDueno} placeholder="Camus" />
        </div>
        <div className="flex items-end">
          <button
            onClick={guardar}
            disabled={!tipo || bundlesNum < 1 || saving}
            className="btn-primary w-full px-4 py-2.5 rounded font-body text-xs uppercase tracking-widest disabled:opacity-40"
          >
            {saving ? "..." : "Agregar"}
          </button>
        </div>
      </div>
      {tipo && bundlesNum > 0 && (
        <p className="font-body text-xs text-text-muted mt-3">
          {bundlesNum} bundle{bundlesNum === 1 ? "" : "s"} ({(bundlesNum * 30).toLocaleString("es-AR")} jewels) ·
          compra: <span className="text-text-secondary">{compra.toLocaleString("es-AR")} WC</span> ·
          venta: <span className="text-neon-orange font-bold">{venta.toLocaleString("es-AR")} WC</span>
        </p>
      )}
    </div>
  );
}

// =====================================================
// FORM NUEVO SEED
// =====================================================
function NuevoSeedForm({ onSaved }: { onSaved: () => void }) {
  const [tipo, setTipo] = useState<"" | TipoSeed>("");
  const [ensamblada, setEnsamblada] = useState(false);
  const [cantidad, setCantidad] = useState("1");
  const [dueno, setDueno] = useState("");
  const [saving, setSaving] = useState(false);
  const cantidadNum = Math.max(1, Number(cantidad) || 1);

  async function guardar() {
    if (!tipo) return;
    setSaving(true);
    const { error } = await supabase.from("seeds_stock").insert({
      tipo, ensamblada_penta: ensamblada,
      cantidad: cantidadNum,
      dueno: dueno.trim() || "Camus", estado: "activo",
    });
    setSaving(false);
    if (error) alert("Error: " + error.message);
    else {
      setTipo(""); setEnsamblada(false); setCantidad("1"); setDueno("");
      onSaved();
    }
  }

  const compra = tipo ? precioCompraSeed(tipo, ensamblada, cantidadNum) : 0;
  const venta = tipo ? precioVentaSeed(tipo, ensamblada, cantidadNum) : 0;

  return (
    <div className="gamer-card rounded-lg p-4">
      <p className="font-body text-xs uppercase tracking-widest text-text-secondary mb-3">Agregar al stock</p>
      <div className="grid sm:grid-cols-4 gap-3">
        <div>
          <FieldLabel>Tipo</FieldLabel>
          <Select<TipoSeed>
            value={tipo}
            onChange={(v) => setTipo(v)}
            options={[
              { value: "max_life", label: "Max Life" },
              { value: "damage_reduction", label: "Damage Reduction" },
            ]}
            placeholder="—"
          />
        </div>
        <div>
          <FieldLabel>Penta Sphere</FieldLabel>
          <PillToggle value={ensamblada} onChange={setEnsamblada} />
        </div>
        <div>
          <FieldLabel>Cantidad</FieldLabel>
          <TextInput value={cantidad} onChange={setCantidad} type="number" min={1} />
        </div>
        <div>
          <FieldLabel>Dueño</FieldLabel>
          <TextInput value={dueno} onChange={setDueno} placeholder="Camus" />
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        {tipo && (
          <p className="font-body text-xs text-text-muted">
            compra: <span className="text-text-secondary">{compra.toLocaleString("es-AR")} WC</span> ·
            venta: <span className="text-neon-orange font-bold">{venta.toLocaleString("es-AR")} WC</span>
          </p>
        )}
        <button
          onClick={guardar}
          disabled={!tipo || saving}
          className="btn-primary ml-auto px-6 py-2 rounded font-body text-xs uppercase tracking-widest disabled:opacity-40"
        >
          {saving ? "..." : "Agregar"}
        </button>
      </div>
    </div>
  );
}
