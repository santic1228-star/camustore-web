"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import ItemCard from "@/components/ItemCard";
import WhatsAppButton from "@/components/WhatsAppButton";
import { ITEMS_MOCK, searchItems } from "@/lib/items-mock";

export default function ItemsPage() {
  const [query, setQuery] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("");
  const [filterCategoria, setFilterCategoria] = useState<string>("");

  const items = useMemo(() => {
    let result = ITEMS_MOCK;
    if (filterCategoria) result = result.filter(i => i.categoria === filterCategoria);
    if (filterTipo) result = result.filter(i => i.tipo === filterTipo);
    result = searchItems(result, query);
    return result;
  }, [query, filterTipo, filterCategoria]);

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
              {ITEMS_MOCK.length} items disponibles. Tocá Consultar para reservar por WhatsApp.
            </p>
          </div>

          {/* Buscador */}
          <div className="mb-4">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="Buscar: queen, Wizard, 400, helm…"
            />
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2 mb-6">
            <FilterChip
              label="Todas"
              active={!filterCategoria}
              onClick={() => setFilterCategoria("")}
            />
            <FilterChip
              label="🛡 Armaduras"
              active={filterCategoria === "armadura"}
              onClick={() => setFilterCategoria("armadura")}
            />
            <FilterChip
              label="⚔ Armas"
              active={filterCategoria === "arma"}
              onClick={() => setFilterCategoria("arma")}
            />
            <FilterChip
              label="🪽 Alas"
              active={filterCategoria === "ala"}
              onClick={() => setFilterCategoria("ala")}
            />

            <div className="w-full sm:w-px sm:h-7 sm:bg-border-base sm:mx-2" />

            <FilterChip
              label="Todos"
              active={!filterTipo}
              onClick={() => setFilterTipo("")}
              small
            />
            <FilterChip label="s3" active={filterTipo === "s3"} onClick={() => setFilterTipo("s3")} small />
            <FilterChip label="380" active={filterTipo === "380"} onClick={() => setFilterTipo("380")} small />
            <FilterChip label="400" active={filterTipo === "400"} onClick={() => setFilterTipo("400")} small />
          </div>

          {/* Contador */}
          <p className="font-body text-xs text-text-muted mb-4">
            {items.length} {items.length === 1 ? "resultado" : "resultados"}
          </p>

          {/* Grid de items */}
          {items.length === 0 ? (
            <div className="text-center py-16 font-body text-text-secondary">
              <p className="text-2xl mb-2">🔍</p>
              <p>No encontramos items con esos filtros.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
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
