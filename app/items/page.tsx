"use client";

import { useState, useMemo, useEffect } from "react";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import ItemCard from "@/components/ItemCard";
import WhatsAppButton from "@/components/WhatsAppButton";
import { supabase } from "@/lib/supabase";
import { getRaza } from "@/lib/razas";
import type { Item } from "@/lib/types";
import type { ItemPublico } from "@/lib/database.types";

// Convierte un ItemPublico (de Supabase) a Item (formato usado por ItemCard).
function adaptar(it: ItemPublico): Item {
  // Construye string de opciones según la categoría
  let opciones = "";
  if (it.categoria === "armadura") {
    opciones = "hp, dd, ref";
  } else if (it.categoria === "arma") {
    const opts: string[] = [];
    if (it.exe_rate) opts.push("exe rate 10%");
    if (it.dmg_2pct) opts.push("dmg +2%");
    if (it.dmg_lvl_20) opts.push("dmg lvl/20");
    if (it.speed_7) opts.push("speed +7");
    if (it.skill) opts.push("skill");
    opciones = opts.join(", ");
  } else if (it.categoria === "ala") {
    const opts: string[] = [];
    if (it.opc_ignore) opts.push("ignore");
    if (it.opc_return) opts.push("return");
    if (it.opc_life_recov) opts.push("life recovery");
    opciones = opts.join(", ");
  }

  return {
    id: it.id,
    nombre: it.nombre,
    parte: it.parte || "",
    raza: it.raza || getRaza(it.nombre),
    nivel: it.nivel,
    opciones,
    luck: it.luck,
    tipo: it.categoria === "ala" ? "alas" : it.tipo,
    socket: it.socket,
    precio_venta: it.precio_venta,
    categoria: it.categoria === "ala" ? "ala" : it.categoria,
  };
}

function searchItems(items: Item[], query: string): Item[] {
  if (!query.trim()) return items;
  const q = query.toLowerCase();
  return items.filter((item) => {
    const haystack = [
      item.nombre, item.parte, item.raza, String(item.nivel),
      item.opciones, item.tipo, item.categoria,
      item.luck ? "luck" : "",
    ].join(" ").toLowerCase();
    return haystack.includes(q);
  });
}

export default function ItemsPage() {
  const [query, setQuery] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("");
  const [filterCategoria, setFilterCategoria] = useState<string>("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("items_publicos")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        const adaptados = (data || []).map(adaptar);
        setItems(adaptados);
      } catch (err) {
        console.error("Error cargando items:", err);
        setError("No pudimos cargar el catálogo. Probá refrescando la página.");
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  const filtrados = useMemo(() => {
    let result = items;
    if (filterCategoria) result = result.filter((i) => i.categoria === filterCategoria);
    if (filterTipo) result = result.filter((i) => i.tipo === filterTipo);
    result = searchItems(result, query);
    return result;
  }, [items, query, filterTipo, filterCategoria]);

  return (
    <>
      <Navbar />
      <main className="px-4 sm:px-6 py-8 sm:py-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-text-primary mb-2">
              Catálogo
            </h1>
            <p className="font-body text-sm sm:text-base text-text-secondary">
              {loading
                ? "Cargando items..."
                : `${items.length} items disponibles. Tocá Consultar para reservar por WhatsApp.`}
            </p>
          </div>

          {/* Buscador */}
          <div className="mb-4">
            <SearchBar value={query} onChange={setQuery} placeholder="Buscar: queen, Wizard, 400, helm..." />
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2 mb-6">
            <FilterChip label="Todas" active={!filterCategoria} onClick={() => setFilterCategoria("")} />
            <FilterChip label="🛡 Armaduras" active={filterCategoria === "armadura"} onClick={() => setFilterCategoria("armadura")} />
            <FilterChip label="⚔ Armas" active={filterCategoria === "arma"} onClick={() => setFilterCategoria("arma")} />
            <FilterChip label="🪽 Alas" active={filterCategoria === "ala"} onClick={() => setFilterCategoria("ala")} />

            <div className="w-full sm:w-px sm:h-7 sm:bg-border-base sm:mx-2" />

            <FilterChip label="Todos" active={!filterTipo} onClick={() => setFilterTipo("")} small />
            <FilterChip label="s3" active={filterTipo === "s3"} onClick={() => setFilterTipo("s3")} small />
            <FilterChip label="380" active={filterTipo === "380"} onClick={() => setFilterTipo("380")} small />
            <FilterChip label="400" active={filterTipo === "400"} onClick={() => setFilterTipo("400")} small />
          </div>

          {/* Estados */}
          {error && (
            <div className="text-center py-12 font-body text-danger-red border border-danger-red/30 rounded-lg bg-danger-red/5">
              <p>{error}</p>
            </div>
          )}

          {loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="gamer-card rounded-lg p-4 h-56 animate-pulse">
                  <div className="h-6 w-2/3 bg-border-base rounded mb-3" />
                  <div className="h-4 w-1/2 bg-border-base rounded mb-6" />
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="h-8 bg-border-base rounded" />
                    <div className="h-8 bg-border-base rounded" />
                    <div className="h-8 bg-border-base rounded" />
                  </div>
                  <div className="h-10 w-1/3 bg-border-base rounded" />
                </div>
              ))}
            </div>
          )}

          {!loading && !error && (
            <>
              <p className="font-body text-xs text-text-muted mb-4">
                {filtrados.length} {filtrados.length === 1 ? "resultado" : "resultados"}
              </p>

              {filtrados.length === 0 ? (
                <div className="text-center py-16 font-body text-text-secondary">
                  <p className="text-2xl mb-2">🔍</p>
                  <p>
                    {items.length === 0
                      ? "Todavía no hay items cargados en el catálogo."
                      : "No encontramos items con esos filtros."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                  {filtrados.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <WhatsAppButton />
    </>
  );
}

function FilterChip({
  label, active, onClick, small,
}: {
  label: string; active: boolean; onClick: () => void; small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`${small ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs sm:text-sm"} rounded font-body uppercase tracking-wider transition-colors ${
        active
          ? "bg-neon-cyan/15 border border-neon-cyan/60 text-neon-cyan"
          : "bg-bg-card border border-border-base text-text-secondary hover:border-border-strong hover:text-text-primary"
      }`}
    >
      {label}
    </button>
  );
}
