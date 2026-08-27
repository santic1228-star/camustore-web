"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FieldLabel, TextInput, Select } from "@/components/ui/FormField";
import { gemaPrecioCompra, GEMA_LABELS, precioVentaGema as precioVentaGemaLib, GemaTipo } from "@/lib/precios";
import { useCfg } from "@/lib/precios-contexto";
import type { ConfigPrecios } from "@/lib/precios-config";
import type { EstadoItem } from "@/lib/database.types";

interface Gema {
  id: string;
  tipo: GemaTipo;
  cantidad: number;
  dueno: string | null;
  estado: EstadoItem;
  created_at: string;
}

function precioCompraGema(tipo: GemaTipo, cantidad: number, cfg: ConfigPrecios): number {
  return gemaPrecioCompra(tipo, cfg) * cantidad;
}
function precioVentaGema(tipo: GemaTipo, cantidad: number, cfg: ConfigPrecios): number {
  return (precioVentaGemaLib(tipo, cfg) ?? 0) * cantidad;
}

export default function SeccionGemasStock() {
  const cfg = useCfg();
  const [gemas, setGemas] = useState<Gema[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<EstadoItem | "todos">("activo");
  const [query, setQuery] = useState("");

  async function cargar() {
    setLoading(true);
    const { data } = await supabase
      .from("gemas_stock")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setGemas(data as Gema[]);
    setLoading(false);
  }
  useEffect(() => { cargar(); }, []);

  async function cambiarEstado(id: string, estado: EstadoItem) {
    const { error } = await supabase.from("gemas_stock").update({ estado }).eq("id", id);
    if (error) alert("Error: " + error.message);
    else cargar();
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar registro? Esto es permanente.")) return;
    const { error } = await supabase.from("gemas_stock").delete().eq("id", id);
    if (error) alert("Error: " + error.message);
    else cargar();
  }

  const visibles = gemas.filter((g) => {
    if (filtroEstado !== "todos" && g.estado !== filtroEstado) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      const h = [GEMA_LABELS[g.tipo], g.dueno, g.estado].filter(Boolean).join(" ").toLowerCase();
      if (!h.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-2xl text-text-primary">🔮 Gemas y otros</h2>

      <NuevaGemaForm onSaved={cargar} />

      {/* Buscador y filtros */}
      <div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar: gema, box, ring, Camus..."
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
          {gemas.length === 0 ? "No hay gemas cargadas." : "Sin resultados con esos filtros."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-base text-left font-body text-xs uppercase tracking-wider text-text-muted">
                <th className="py-2 pr-3">Tipo</th>
                <th className="py-2 pr-3 text-right">Cantidad</th>
                <th className="py-2 pr-3 text-right">Compra</th>
                <th className="py-2 pr-3 text-right">Venta</th>
                <th className="py-2 pr-3 hidden md:table-cell">Dueño</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((g) => (
                <tr key={g.id} className="border-b border-border-base/40 font-body hover:bg-bg-card/30">
                  <td className="py-2 pr-3 text-text-primary">{GEMA_LABELS[g.tipo]}</td>
                  <td className="py-2 pr-3 text-right font-numeric text-neon-cyan">{g.cantidad}</td>
                  <td className="py-2 pr-3 text-right font-numeric text-text-secondary">
                    {precioCompraGema(g.tipo, g.cantidad, cfg).toLocaleString("es-AR")}
                  </td>
                  <td className="py-2 pr-3 text-right font-numeric font-bold text-neon-orange">
                    {precioVentaGema(g.tipo, g.cantidad, cfg).toLocaleString("es-AR")}
                  </td>
                  <td className="py-2 pr-3 text-text-secondary hidden md:table-cell">{g.dueno || "—"}</td>
                  <td className="py-2 pr-3"><EstadoBadge estado={g.estado} /></td>
                  <td className="py-2 text-right">
                    <ActionsMenu
                      estado={g.estado}
                      onCambiarEstado={(e) => cambiarEstado(g.id, e)}
                      onEliminar={() => eliminar(g.id)}
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

function NuevaGemaForm({ onSaved }: { onSaved: () => void }) {
  const cfg = useCfg();
  const [tipo, setTipo] = useState<"" | GemaTipo>("");
  const [cantidad, setCantidad] = useState("1");
  const [dueno, setDueno] = useState("");
  const [saving, setSaving] = useState(false);
  const cantNum = Math.max(1, Number(cantidad) || 1);

  async function guardar() {
    if (!tipo) return;
    setSaving(true);
    const { error } = await supabase.from("gemas_stock").insert({
      tipo, cantidad: cantNum, dueno: dueno.trim() || "Camus", estado: "activo",
    });
    setSaving(false);
    if (error) alert("Error: " + error.message);
    else {
      setTipo(""); setCantidad("1"); setDueno("");
      onSaved();
    }
  }

  const compra = tipo ? precioCompraGema(tipo, cantNum, cfg) : 0;
  const venta = tipo ? precioVentaGema(tipo, cantNum, cfg) : 0;

  const opciones = (Object.keys(GEMA_LABELS) as GemaTipo[]).map((k) => ({
    value: k, label: GEMA_LABELS[k],
  }));

  return (
    <div className="gamer-card rounded-lg p-4">
      <p className="font-body text-xs uppercase tracking-widest text-text-secondary mb-3">Agregar al stock</p>
      <div className="grid sm:grid-cols-4 gap-3">
        <div>
          <FieldLabel>Tipo</FieldLabel>
          <Select<GemaTipo> value={tipo} onChange={(v) => setTipo(v)} options={opciones} placeholder="—" />
        </div>
        <div>
          <FieldLabel>Cantidad</FieldLabel>
          <TextInput value={cantidad} onChange={setCantidad} type="number" min={1} />
        </div>
        <div>
          <FieldLabel>Dueño (opcional)</FieldLabel>
          <TextInput value={dueno} onChange={setDueno} placeholder="Camus" />
        </div>
        <div className="flex items-end">
          <button
            onClick={guardar}
            disabled={!tipo || saving}
            className="btn-primary w-full px-4 py-2.5 rounded font-body text-xs uppercase tracking-widest disabled:opacity-40"
          >
            {saving ? "..." : "Agregar"}
          </button>
        </div>
      </div>
      {tipo && (
        <p className="font-body text-xs text-text-muted mt-3">
          {cantNum} unidad{cantNum === 1 ? "" : "es"} ·
          compra: <span className="text-text-secondary">{compra.toLocaleString("es-AR")} WC</span> ·
          venta: <span className="text-neon-orange font-bold">{venta.toLocaleString("es-AR")} WC</span>
        </p>
      )}
    </div>
  );
}
