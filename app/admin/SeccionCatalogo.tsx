"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { Categoria, TipoItem, Raza, EstadoItem } from "@/lib/database.types";
import ItemFormModal, { EditableItem } from "./ItemFormModal";

interface ItemAdmin {
  id: string;
  categoria: Categoria;
  nombre: string;
  parte: string | null;
  raza: Raza | null;
  nivel: number;
  tipo: TipoItem;
  socket: number | null;
  hp_dd_ref: boolean;
  exe_rate: boolean;
  dmg_lvl_20: boolean;
  dmg_2pct: boolean;
  speed_7: boolean;
  skill: boolean;
  opc_ignore: boolean;
  opc_return: boolean;
  opc_life_recov: boolean;
  luck: boolean;
  precio_compra: number | null;
  precio_venta: number;
  dueno: string | null;
  estado: EstadoItem;
  created_at: string;
}

type OrdenItem = "reciente" | "antiguo" | "nombre" | "venta_desc" | "dueno";
type FiltroAntig = "todas" | "recientes" | "viejos";

// =====================================================
// HELPERS
// =====================================================
function tiempoRelativo(fechaIso: string): string {
  const ms = Date.now() - new Date(fechaIso).getTime();
  const seg = Math.floor(ms / 1000);
  const min = Math.floor(seg / 60);
  const hor = Math.floor(min / 60);
  const dia = Math.floor(hor / 24);
  const mes = Math.floor(dia / 30);
  const anio = Math.floor(dia / 365);
  if (seg < 60) return "hace segundos";
  if (min < 60) return `hace ${min} min`;
  if (hor < 24) return `hace ${hor}h`;
  if (dia < 30) return `hace ${dia}d`;
  if (mes < 12) return `hace ${mes} ${mes === 1 ? "mes" : "meses"}`;
  return `hace ${anio} ${anio === 1 ? "año" : "años"}`;
}

function fechaCompleta(fechaIso: string): string {
  const d = new Date(fechaIso);
  return d.toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function diasDesde(fechaIso: string): number {
  return Math.floor((Date.now() - new Date(fechaIso).getTime()) / (1000 * 60 * 60 * 24));
}

export default function SeccionCatalogo() {
  const [items, setItems] = useState<ItemAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<EditableItem | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<EstadoItem | "todos">("activo");
  const [filtroAntig, setFiltroAntig] = useState<FiltroAntig>("todas");
  const [filtroDueno, setFiltroDueno] = useState<string>("todos");
  const [orden, setOrden] = useState<OrdenItem>("reciente");
  const [query, setQuery] = useState("");

  async function cargar() {
    setLoading(true);
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error cargando items:", error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  }

  useEffect(() => { cargar(); }, []);

  async function cambiarEstado(id: string, nuevoEstado: EstadoItem) {
    const { error } = await supabase
      .from("items")
      .update({ estado: nuevoEstado })
      .eq("id", id);
    if (error) {
      alert("Error al cambiar estado: " + error.message);
    } else {
      cargar();
    }
  }

  async function eliminarItem(id: string, nombre: string) {
    if (!confirm(`¿Eliminar "${nombre}" del catálogo? Esto es permanente.`)) return;
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) {
      alert("Error al eliminar: " + error.message);
    } else {
      cargar();
    }
  }

  // Lista única de dueños para el selector
  const duenosDisponibles = useMemo(() => {
    const set = new Set<string>();
    for (const i of items) {
      if (i.dueno) set.add(i.dueno);
    }
    return Array.from(set).sort();
  }, [items]);

  const visibles = useMemo(() => {
    let result = items.filter((i) => {
      if (filtroEstado !== "todos" && i.estado !== filtroEstado) return false;
      if (filtroDueno !== "todos" && i.dueno !== filtroDueno) return false;
      if (filtroAntig !== "todas") {
        const d = diasDesde(i.created_at);
        if (filtroAntig === "recientes" && d > 7) return false;
        if (filtroAntig === "viejos" && d < 30) return false;
      }
      if (query.trim()) {
        const q = query.toLowerCase();
        const haystack = [
          i.nombre, i.parte, i.raza, String(i.nivel),
          i.tipo, i.categoria, i.dueno, i.estado,
          i.luck ? "luck" : "",
          i.socket ? `${i.socket} socket` : "",
        ].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    // Ordenamiento
    result = [...result].sort((a, b) => {
      switch (orden) {
        case "reciente":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "antiguo":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "nombre":
          return a.nombre.localeCompare(b.nombre);
        case "venta_desc":
          return b.precio_venta - a.precio_venta;
        case "dueno":
          return (a.dueno || "").localeCompare(b.dueno || "");
      }
    });

    return result;
  }, [items, filtroEstado, filtroAntig, filtroDueno, query, orden]);

  const stats = {
    activo: items.filter((i) => i.estado === "activo").length,
    vendido: items.filter((i) => i.estado === "vendido").length,
    retirado: items.filter((i) => i.estado === "retirado").length,
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-display font-bold text-2xl text-text-primary mb-1">
            Catálogo de items
          </h2>
          <p className="font-body text-xs text-text-secondary">
            {stats.activo} activos · {stats.vendido} vendidos · {stats.retirado} retirados
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary px-5 py-2.5 rounded font-body text-xs uppercase tracking-widest"
        >
          + Nuevo item
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar: nombre, parte, raza, tipo, nivel, dueño..."
          className="w-full bg-bg-card border border-border-base focus:border-neon-cyan rounded px-3 py-2.5 font-body text-text-primary placeholder:text-text-muted outline-none transition-colors"
        />
        {query && (
          <p className="text-[10px] font-body text-text-muted mt-1.5 uppercase tracking-wider">
            {visibles.length} {visibles.length === 1 ? "resultado" : "resultados"}
          </p>
        )}
      </div>

      {/* Dropdowns: orden + dueño */}
      <div className="flex flex-wrap gap-3 mb-3">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-body uppercase tracking-widest text-text-muted mb-1">
            Ordenar por
          </label>
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value as OrdenItem)}
            className="w-full bg-bg-card border border-border-base focus:border-neon-cyan rounded px-3 py-2 font-body text-sm text-text-primary outline-none transition-colors cursor-pointer"
          >
            <option value="reciente">📅 Más nuevos primero</option>
            <option value="antiguo">⌛ Más antiguos primero</option>
            <option value="nombre">🔤 Nombre A-Z</option>
            <option value="venta_desc">💰 Precio venta (mayor)</option>
            <option value="dueno">👤 Por dueño</option>
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-body uppercase tracking-widest text-text-muted mb-1">
            Dueño
          </label>
          <select
            value={filtroDueno}
            onChange={(e) => setFiltroDueno(e.target.value)}
            className="w-full bg-bg-card border border-border-base focus:border-neon-cyan rounded px-3 py-2 font-body text-sm text-text-primary outline-none transition-colors cursor-pointer"
          >
            <option value="todos">Todos</option>
            {duenosDisponibles.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtro estado */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="text-[10px] font-body uppercase tracking-widest text-text-muted self-center mr-1">Estado:</span>
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

      {/* Filtro antigüedad */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-[10px] font-body uppercase tracking-widest text-text-muted self-center mr-1">Antigüedad:</span>
        {([
          { v: "todas", l: "Todas" },
          { v: "recientes", l: "Recientes (<7d)" },
          { v: "viejos", l: "Viejos (>30d)" },
        ] as const).map((opt) => (
          <button
            key={opt.v}
            onClick={() => setFiltroAntig(opt.v)}
            className={`px-3 py-1.5 rounded font-body text-xs uppercase tracking-wider transition-colors ${
              filtroAntig === opt.v
                ? "bg-neon-cyan/15 border border-neon-cyan/60 text-neon-cyan"
                : "bg-bg-card border border-border-base text-text-secondary hover:border-border-strong"
            }`}
          >
            {opt.l}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="font-body text-text-secondary animate-pulse">Cargando items…</p>
      ) : visibles.length === 0 ? (
        <div className="text-center py-16 font-body text-text-secondary">
          <p className="text-3xl mb-2">📦</p>
          <p>No hay items con ese filtro.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-base text-left font-body text-xs uppercase tracking-wider text-text-muted">
                <th className="py-2 pr-3">Item</th>
                <th className="py-2 pr-3 hidden sm:table-cell">Tipo</th>
                <th className="py-2 pr-3 hidden md:table-cell">Lvl</th>
                <th className="py-2 pr-3 hidden lg:table-cell">Dueño</th>
                <th className="py-2 pr-3 text-right">Compra</th>
                <th className="py-2 pr-3 text-right">Venta</th>
                <th className="py-2 pr-3 hidden md:table-cell">Carga</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((it) => (
                <tr key={it.id} className="border-b border-border-base/40 font-body hover:bg-bg-card/30">
                  <td className="py-2 pr-3">
                    <div className="font-bold text-text-primary">
                      {it.nombre} {it.parte}
                    </div>
                    <div className="text-[10px] text-text-muted uppercase">
                      {it.categoria}{it.luck ? " · luck" : ""}
                    </div>
                  </td>
                  <td className="py-2 pr-3 hidden sm:table-cell font-numeric text-neon-cyan">
                    {it.tipo}{it.socket ? `·${it.socket}s` : ""}
                  </td>
                  <td className="py-2 pr-3 hidden md:table-cell font-numeric">{it.nivel}</td>
                  <td className="py-2 pr-3 hidden lg:table-cell text-text-secondary">
                    {it.dueno || "—"}
                  </td>
                  <td className="py-2 pr-3 text-right font-numeric text-text-secondary">
                    {it.precio_compra?.toLocaleString("es-AR") || "—"}
                  </td>
                  <td className="py-2 pr-3 text-right font-numeric font-bold text-neon-orange">
                    {it.precio_venta.toLocaleString("es-AR")}
                  </td>
                  <td
                    className="py-2 pr-3 hidden md:table-cell text-text-muted text-xs"
                    title={fechaCompleta(it.created_at)}
                  >
                    {tiempoRelativo(it.created_at)}
                  </td>
                  <td className="py-2 pr-3">
                    <EstadoBadge estado={it.estado} />
                  </td>
                  <td className="py-2 text-right">
                    <ItemActions
                      item={it}
                      onCambiarEstado={cambiarEstado}
                      onEliminar={() => eliminarItem(it.id, `${it.nombre} ${it.parte || ""}`)}
                      onEditar={() => setEditItem(it as EditableItem)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(showModal || editItem) && (
        <ItemFormModal
          editItem={editItem || undefined}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSaved={() => {
            setShowModal(false);
            setEditItem(null);
            cargar();
          }}
        />
      )}
    </>
  );
}

function EstadoBadge({ estado }: { estado: EstadoItem }) {
  const colors: Record<EstadoItem, string> = {
    activo: "bg-success-green/15 text-success-green border-success-green/40",
    vendido: "bg-text-muted/15 text-text-muted border-text-muted/40",
    retirado: "bg-danger-red/15 text-danger-red border-danger-red/40",
  };
  return (
    <span className={`badge ${colors[estado]} border`}>
      {estado}
    </span>
  );
}

function ItemActions({
  item, onCambiarEstado, onEliminar, onEditar,
}: {
  item: ItemAdmin;
  onCambiarEstado: (id: string, estado: EstadoItem) => void;
  onEliminar: () => void;
  onEditar: () => void;
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
            <button
              onClick={() => { setOpen(false); onEditar(); }}
              className="w-full text-left px-3 py-2 font-body text-xs uppercase tracking-wider text-neon-cyan hover:bg-bg-card-hover"
            >
              ✏ Editar
            </button>
            <div className="border-t border-border-base my-1" />
            {item.estado !== "vendido" && (
              <button
                onClick={() => { setOpen(false); onCambiarEstado(item.id, "vendido"); }}
                className="w-full text-left px-3 py-2 font-body text-xs uppercase tracking-wider text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"
              >
                Marcar vendido
              </button>
            )}
            {item.estado !== "activo" && (
              <button
                onClick={() => { setOpen(false); onCambiarEstado(item.id, "activo"); }}
                className="w-full text-left px-3 py-2 font-body text-xs uppercase tracking-wider text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"
              >
                Reactivar
              </button>
            )}
            {item.estado !== "retirado" && (
              <button
                onClick={() => { setOpen(false); onCambiarEstado(item.id, "retirado"); }}
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
