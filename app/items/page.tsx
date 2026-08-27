"use client";

import { useState, useMemo, useEffect } from "react";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import ItemCard from "@/components/ItemCard";
import WhatsAppButton from "@/components/WhatsAppButton";
import JewelCard from "@/components/JewelCard";
import SeedCard from "@/components/SeedCard";
import GemaCard from "@/components/GemaCard";
import JoyaCard from "@/components/JoyaCard";
import { supabase } from "@/lib/supabase";
import { getRaza } from "@/lib/razas";
import { SEED_LABELS, escudoLabel } from "@/lib/precios";
import { useCfg } from "@/lib/precios-contexto";
import type { ConfigPrecios } from "@/lib/precios-config";
import type { Item } from "@/lib/types";
import type { ItemPublico, JewelPublico, SeedPublico, GemaPublico, JoyaPublico, TipoJewel, TipoSeed, TipoGema } from "@/lib/database.types";

type Tab = "items" | "consumibles" | "gemas" | "joyeria";

// =====================================================
// Adaptador de ItemPublico → Item (formato que ItemCard espera)
// =====================================================
function adaptar(it: ItemPublico): Item {
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
  } else if (it.categoria === "escudo") {
    const opts: string[] = ["hp, dd, ref"];
    if (it.skill) opts.push("skill");
    opciones = opts.join(", ");
  }

  // Para escudos, el nombre guardado es un código → traducir a label
  const nombreMostrar = it.categoria === "escudo" ? escudoLabel(it.nombre) : it.nombre;

  return {
    id: it.id,
    nombre: nombreMostrar,
    parte: it.categoria === "escudo" ? "" : (it.parte || ""),
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

// =====================================================
// Agrupación de jewels/seeds por tipo
// =====================================================
import { esJewelEspecial, jewelPrecioVenta, precioVentaSeed, precioVentaGema } from "@/lib/precios";

interface JewelGroup {
  tipo: TipoJewel;
  esEspecial: boolean;
  totalUnidades: number;        // bundles (regular) o cantidad (especial)
  precioUnitario: number;       // por bundle (regular) o por jewel (especial)
}
interface SeedGroup {
  tipo: TipoSeed;
  ensamblada_penta: boolean;
  totalCantidad: number;
  precioUnidad: number;
}
interface GemaGroup {
  tipo: TipoGema;
  totalCantidad: number;
  precioUnitario: number;
}

function agruparJewels(stocks: JewelPublico[], cfg: ConfigPrecios): JewelGroup[] {
  const map = new Map<TipoJewel, JewelGroup>();
  for (const s of stocks) {
    const especial = esJewelEspecial(s.tipo);
    const unidades = especial ? s.cantidad : s.bundles;
    if (unidades <= 0) continue;

    const ex = map.get(s.tipo);
    if (ex) {
      ex.totalUnidades += unidades;
    } else {
      map.set(s.tipo, {
        tipo: s.tipo,
        esEspecial: especial,
        totalUnidades: unidades,
        precioUnitario: jewelPrecioVenta(s.tipo, cfg),
      });
    }
  }
  return Array.from(map.values()).filter((g) => g.totalUnidades > 0);
}

function agruparSeeds(stocks: SeedPublico[], cfg: ConfigPrecios): SeedGroup[] {
  const map = new Map<string, SeedGroup>();
  for (const s of stocks) {
    const key = `${s.tipo}::${s.ensamblada_penta}`;
    const ex = map.get(key);
    if (ex) {
      ex.totalCantidad += s.cantidad;
    } else {
      const venta = precioVentaSeed(s.tipo, s.ensamblada_penta, cfg) ?? 0;
      map.set(key, {
        tipo: s.tipo,
        ensamblada_penta: s.ensamblada_penta,
        totalCantidad: s.cantidad,
        precioUnidad: venta,
      });
    }
  }
  return Array.from(map.values()).filter((g) => g.totalCantidad > 0);
}

function agruparGemas(stocks: GemaPublico[], cfg: ConfigPrecios): GemaGroup[] {
  const map = new Map<TipoGema, GemaGroup>();
  for (const s of stocks) {
    if (s.cantidad <= 0) continue;
    const ex = map.get(s.tipo);
    if (ex) {
      ex.totalCantidad += s.cantidad;
    } else {
      map.set(s.tipo, {
        tipo: s.tipo,
        totalCantidad: s.cantidad,
        precioUnitario: precioVentaGema(s.tipo, cfg) ?? 0,
      });
    }
  }
  return Array.from(map.values()).filter((g) => g.totalCantidad > 0);
}

// =====================================================
// PÁGINA PRINCIPAL
// =====================================================
export default function ItemsPage() {
  const cfg = useCfg();
  const [tab, setTab] = useState<Tab>("items");
  const [query, setQuery] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("");
  const [filterCategoria, setFilterCategoria] = useState<string>("");
  const [items, setItems] = useState<Item[]>([]);
  // Se guardan los stocks CRUDOS: los grupos (y sus precios) se derivan con la
  // config vigente, así un cambio de coeficientes se ve sin recargar la página.
  const [jewelsRaw, setJewelsRaw] = useState<JewelPublico[]>([]);
  const [seedsRaw, setSeedsRaw] = useState<SeedPublico[]>([]);
  const [gemasRaw, setGemasRaw] = useState<GemaPublico[]>([]);
  const [joyas, setJoyas] = useState<JoyaPublico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      try {
        setLoading(true);
        const [resItems, resJewels, resSeeds, resGemas, resJoyas] = await Promise.all([
          supabase.from("items_publicos").select("*").order("created_at", { ascending: false }),
          supabase.from("jewels_publicos").select("*"),
          supabase.from("seeds_publicos").select("*"),
          supabase.from("gemas_publicos").select("*"),
          supabase.from("joyeria_publicos").select("*").order("created_at", { ascending: false }),
        ]);

        if (resItems.error) throw resItems.error;
        setItems((resItems.data || []).map(adaptar));

        if (resJewels.data) setJewelsRaw(resJewels.data as JewelPublico[]);
        if (resSeeds.data) setSeedsRaw(resSeeds.data as SeedPublico[]);
        if (resGemas.data) setGemasRaw(resGemas.data as GemaPublico[]);
        if (resJoyas.data) setJoyas(resJoyas.data as JoyaPublico[]);
      } catch (err) {
        console.error("Error cargando catálogo:", err);
        setError("No pudimos cargar el catálogo. Probá refrescando.");
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  const jewels = useMemo(() => agruparJewels(jewelsRaw, cfg), [jewelsRaw, cfg]);
  const seeds = useMemo(() => agruparSeeds(seedsRaw, cfg), [seedsRaw, cfg]);
  const gemas = useMemo(() => agruparGemas(gemasRaw, cfg), [gemasRaw, cfg]);

  const filtrados = useMemo(() => {
    let result = items;
    if (filterCategoria) result = result.filter((i) => i.categoria === filterCategoria);
    if (filterTipo) result = result.filter((i) => i.tipo === filterTipo);
    result = searchItems(result, query);
    return result;
  }, [items, query, filterTipo, filterCategoria]);

  const totalConsumibles = jewels.length + seeds.length;

  return (
    <>
      <Navbar />
      <main className="px-4 sm:px-6 py-8 sm:py-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-text-primary mb-2">
              Catálogo
            </h1>
            <p className="font-body text-sm sm:text-base text-text-secondary">
              {loading
                ? "Cargando..."
                : "Tocá Consultar para reservar por WhatsApp."}
            </p>
          </div>

          {/* TABS */}
          <div className="flex gap-2 mb-6 border-b border-border-base">
            <button
              onClick={() => setTab("items")}
              className={`px-4 py-2.5 font-body text-xs sm:text-sm uppercase tracking-widest border-b-2 transition-colors ${
                tab === "items"
                  ? "border-neon-cyan text-neon-cyan"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              📦 Items <span className="opacity-60">({items.length})</span>
            </button>
            <button
              onClick={() => setTab("consumibles")}
              className={`px-4 py-2.5 font-body text-xs sm:text-sm uppercase tracking-widest border-b-2 transition-colors ${
                tab === "consumibles"
                  ? "border-neon-cyan text-neon-cyan"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              💎🌱 Jewels & Seeds <span className="opacity-60">({totalConsumibles})</span>
            </button>
            <button
              onClick={() => setTab("gemas")}
              className={`px-4 py-2.5 font-body text-xs sm:text-sm uppercase tracking-widest border-b-2 transition-colors ${
                tab === "gemas"
                  ? "border-neon-cyan text-neon-cyan"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              🔮 Gemas y otros <span className="opacity-60">({gemas.length})</span>
            </button>
            <button
              onClick={() => setTab("joyeria")}
              className={`px-4 py-2.5 font-body text-xs sm:text-sm uppercase tracking-widest border-b-2 transition-colors ${
                tab === "joyeria"
                  ? "border-neon-cyan text-neon-cyan"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              💍 Joyería <span className="opacity-60">({joyas.length})</span>
            </button>
          </div>

          {/* ERROR */}
          {error && (
            <div className="text-center py-12 font-body text-danger-red border border-danger-red/30 rounded-lg bg-danger-red/5">
              <p>{error}</p>
            </div>
          )}

          {/* LOADING */}
          {loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="gamer-card rounded-lg p-4 h-56 animate-pulse">
                  <div className="h-6 w-2/3 bg-border-base rounded mb-3" />
                  <div className="h-4 w-1/2 bg-border-base rounded mb-6" />
                </div>
              ))}
            </div>
          )}

          {/* TAB: ITEMS */}
          {!loading && !error && tab === "items" && (
            <>
              <div className="mb-4">
                <SearchBar value={query} onChange={setQuery} placeholder="Buscar: queen, Wizard, 400, helm..." />
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <FilterChip label="Todas" active={!filterCategoria} onClick={() => setFilterCategoria("")} />
                <FilterChip label="🛡 Armaduras" active={filterCategoria === "armadura"} onClick={() => setFilterCategoria("armadura")} />
                <FilterChip label="⚔ Armas" active={filterCategoria === "arma"} onClick={() => setFilterCategoria("arma")} />
                <FilterChip label="🪽 Alas" active={filterCategoria === "ala"} onClick={() => setFilterCategoria("ala")} />
                <FilterChip label="🛡 Escudos" active={filterCategoria === "escudo"} onClick={() => setFilterCategoria("escudo")} />

                <div className="w-full sm:w-px sm:h-7 sm:bg-border-base sm:mx-2" />

                <FilterChip label="Todos" active={!filterTipo} onClick={() => setFilterTipo("")} small />
                <FilterChip label="s3" active={filterTipo === "s3"} onClick={() => setFilterTipo("s3")} small />
                <FilterChip label="380" active={filterTipo === "380"} onClick={() => setFilterTipo("380")} small />
                <FilterChip label="400" active={filterTipo === "400"} onClick={() => setFilterTipo("400")} small />
              </div>

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

          {/* TAB: CONSUMIBLES */}
          {!loading && !error && tab === "consumibles" && (
            <div className="space-y-8 animate-fade-in">
              {/* JEWELS */}
              <section>
                <h2 className="font-display font-bold text-xl text-text-primary mb-3">
                  💎 Jewels
                </h2>
                {jewels.length === 0 ? (
                  <p className="font-body text-text-muted text-center py-8 border border-border-base rounded-lg">
                    Sin stock de jewels disponible.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {jewels.map((j) => (
                      <JewelCard key={j.tipo} group={j} />
                    ))}
                  </div>
                )}
              </section>

              {/* SEEDS */}
              <section>
                <h2 className="font-display font-bold text-xl text-text-primary mb-3">
                  🌱 Seeds
                </h2>
                {seeds.length === 0 ? (
                  <p className="font-body text-text-muted text-center py-8 border border-border-base rounded-lg">
                    Sin stock de seeds disponible.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {seeds.map((s, idx) => (
                      <SeedCard key={idx} group={s} />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB: GEMAS */}
          {!loading && !error && tab === "gemas" && (
            <div className="animate-fade-in">
              {gemas.length === 0 ? (
                <div className="text-center py-16 font-body text-text-secondary">
                  <p className="text-2xl mb-2">🔮</p>
                  <p>Todavía no hay gemas ni otros items cargados.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gemas.map((g) => (
                    <GemaCard key={g.tipo} group={g} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: JOYERÍA */}
          {!loading && !error && tab === "joyeria" && (
            <div className="animate-fade-in">
              {joyas.length === 0 ? (
                <div className="text-center py-16 font-body text-text-secondary">
                  <p className="text-2xl mb-2">💍</p>
                  <p>Todavía no hay joyería cargada.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {joyas.map((j) => (
                    <JoyaCard key={j.id} joya={j} />
                  ))}
                </div>
              )}
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
