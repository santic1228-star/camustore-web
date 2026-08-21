"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Evento {
  id: string;
  tipo: string;
  item_categoria: string | null;
  item_nombre: string | null;
  item_tipo: string | null;
  item_precio: number | null;
  created_at: string;
}

type Periodo = "7d" | "30d" | "todo";

export default function SeccionAnalytics() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<Periodo>("30d");

  useEffect(() => {
    async function cargar() {
      setLoading(true);
      let q = supabase.from("eventos").select("*").order("created_at", { ascending: false });
      if (periodo !== "todo") {
        const dias = periodo === "7d" ? 7 : 30;
        const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();
        q = q.gte("created_at", desde);
      }
      const { data, error } = await q;
      if (error) console.warn("Error cargando eventos:", error.message);
      setEventos((data as Evento[]) || []);
      setLoading(false);
    }
    cargar();
  }, [periodo]);

  // Métricas derivadas
  const consultasItems = eventos.filter((e) => e.tipo === "consultar_item");
  const consultasJewels = eventos.filter((e) => e.tipo === "consultar_jewel");
  const cotizaciones = eventos.filter((e) => e.tipo === "cotizar");

  // Top items consultados (agrupa por nombre)
  const topItems = agruparPorNombre(consultasItems);
  const topJewels = agruparPorNombre(consultasJewels);
  const topCotizaciones = agruparPorNombre(cotizaciones);

  // Eventos por día (para el gráfico)
  const porDia = agruparPorDia(eventos);

  return (
    <div className="space-y-8">
      {/* Header con selector de período */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display font-bold text-2xl text-text-primary">📊 Analytics</h2>
        <div className="flex gap-2">
          {([
            { v: "7d", l: "7 días" },
            { v: "30d", l: "30 días" },
            { v: "todo", l: "Todo" },
          ] as const).map((opt) => (
            <button
              key={opt.v}
              onClick={() => setPeriodo(opt.v)}
              className={`px-3 py-1.5 rounded font-body text-xs uppercase tracking-wider transition-colors ${
                periodo === opt.v
                  ? "bg-neon-cyan/15 border border-neon-cyan/60 text-neon-cyan"
                  : "bg-bg-card border border-border-base text-text-secondary hover:border-border-strong"
              }`}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="font-body text-text-secondary animate-pulse">Cargando…</p>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Consultas de items" value={consultasItems.length} icon="🛡" />
            <KpiCard label="Consultas jewels/seeds" value={consultasJewels.length} icon="💎" />
            <KpiCard label="Cotizaciones" value={cotizaciones.length} icon="🧮" />
            <KpiCard label="Total eventos" value={eventos.length} icon="📈" />
          </div>

          {/* Nota sobre Vercel */}
          <div className="gamer-card rounded-lg p-4 border border-neon-cyan/30">
            <p className="font-body text-xs text-text-secondary">
              💡 Estas métricas muestran las <strong className="text-text-primary">acciones comerciales</strong> (consultas y cotizaciones).
              Para <strong className="text-text-primary">visitas, páginas vistas, países y dispositivos</strong>, mirá el dashboard de Vercel Analytics
              (vercel.com → tu proyecto → pestaña Analytics).
            </p>
          </div>

          {/* Gráfico de eventos por día */}
          {porDia.length > 0 && (
            <div className="gamer-card rounded-lg p-5">
              <h3 className="font-display font-bold text-lg text-text-primary mb-4">Actividad por día</h3>
              <BarChart data={porDia} />
            </div>
          )}

          {/* Top items consultados */}
          <TopList
            titulo="🛡 Items más consultados"
            items={topItems}
            emptyMsg="Todavía no hay consultas de items."
          />

          {/* Top jewels/seeds consultados */}
          <TopList
            titulo="💎 Jewels & Seeds más consultados"
            items={topJewels}
            emptyMsg="Todavía no hay consultas de jewels/seeds."
          />

          {/* Top cotizaciones */}
          <TopList
            titulo="🧮 Lo que más cotizan los jugadores"
            items={topCotizaciones}
            emptyMsg="Todavía no hay cotizaciones registradas."
          />
        </>
      )}
    </div>
  );
}

// =====================================================
// HELPERS
// =====================================================
function agruparPorNombre(eventos: Evento[]): { nombre: string; count: number }[] {
  const map = new Map<string, number>();
  for (const e of eventos) {
    const nombre = e.item_nombre || "(sin nombre)";
    map.set(nombre, (map.get(nombre) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([nombre, count]) => ({ nombre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function agruparPorDia(eventos: Evento[]): { dia: string; count: number }[] {
  const map = new Map<string, number>();
  for (const e of eventos) {
    const dia = new Date(e.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
    map.set(dia, (map.get(dia) || 0) + 1);
  }
  // Ordenar cronológicamente (los últimos 14 días con actividad)
  return Array.from(map.entries())
    .map(([dia, count]) => ({ dia, count }))
    .reverse()
    .slice(-14);
}

// =====================================================
// COMPONENTES
// =====================================================
function KpiCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="gamer-card rounded-lg p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <p className="text-[10px] font-body text-text-muted uppercase tracking-wider">{label}</p>
      </div>
      <p className="font-numeric font-bold text-3xl neon-text-cyan">{value.toLocaleString("es-AR")}</p>
    </div>
  );
}

function TopList({ titulo, items, emptyMsg }: { titulo: string; items: { nombre: string; count: number }[]; emptyMsg: string }) {
  const max = items.length > 0 ? items[0].count : 1;
  return (
    <div className="gamer-card rounded-lg p-5">
      <h3 className="font-display font-bold text-lg text-text-primary mb-4">{titulo}</h3>
      {items.length === 0 ? (
        <p className="font-body text-text-muted text-sm">{emptyMsg}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="font-numeric text-text-muted text-xs w-5 text-right">{idx + 1}</span>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-body text-sm text-text-primary truncate">{item.nombre}</span>
                  <span className="font-numeric font-bold text-neon-cyan text-sm ml-2">{item.count}</span>
                </div>
                <div className="h-1.5 bg-bg-card rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neon-cyan/60 rounded-full transition-all"
                    style={{ width: `${(item.count / max) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BarChart({ data }: { data: { dia: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1.5 h-32">
      {data.map((d, idx) => (
        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex items-end justify-center" style={{ height: "100px" }}>
            <div
              className="w-full bg-neon-cyan/50 hover:bg-neon-cyan/80 rounded-t transition-colors relative group"
              style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? "4px" : "0" }}
              title={`${d.dia}: ${d.count} eventos`}
            >
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-numeric text-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity">
                {d.count}
              </span>
            </div>
          </div>
          <span className="text-[9px] font-body text-text-muted">{d.dia}</span>
        </div>
      ))}
    </div>
  );
}
