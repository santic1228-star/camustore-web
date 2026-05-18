"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FieldLabel, TextInput, Select, PillToggle } from "@/components/ui/FormField";
import { JEWEL_PRECIOS, JEWEL_LABELS, SEED_LABELS } from "@/lib/precios";
import type { TipoJewel, TipoSeed } from "@/lib/database.types";

interface Jewel {
  id: string;
  tipo: TipoJewel;
  bundles: number;
  dueno: string | null;
  estado: string;
  created_at: string;
}

interface Seed {
  id: string;
  tipo: TipoSeed;
  ensamblada_penta: boolean;
  cantidad: number;
  dueno: string | null;
  estado: string;
  created_at: string;
}

export default function SeccionStock() {
  const [jewels, setJewels] = useState<Jewel[]>([]);
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [loading, setLoading] = useState(true);

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

  async function eliminar(table: "jewels_stock" | "seeds_stock", id: string) {
    if (!confirm("¿Eliminar registro?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) alert("Error: " + error.message);
    else cargar();
  }

  return (
    <div className="space-y-10">
      {/* JEWELS */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-2xl text-text-primary">💎 Jewels</h2>
        </div>

        <NuevoJewelForm onSaved={cargar} />

        {loading ? (
          <p className="font-body text-text-secondary animate-pulse mt-6">Cargando…</p>
        ) : jewels.length === 0 ? (
          <p className="font-body text-text-muted text-center py-8 mt-4">No hay jewels en stock.</p>
        ) : (
          <table className="w-full text-sm mt-6">
            <thead>
              <tr className="border-b border-border-base text-left font-body text-xs uppercase tracking-wider text-text-muted">
                <th className="py-2 pr-3">Tipo</th>
                <th className="py-2 pr-3 text-right">Bundles</th>
                <th className="py-2 pr-3 text-right">Total jewels</th>
                <th className="py-2 pr-3 hidden sm:table-cell">Dueño</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {jewels.map((j) => (
                <tr key={j.id} className="border-b border-border-base/40 font-body">
                  <td className="py-2 pr-3 text-text-primary">{JEWEL_LABELS[j.tipo]}</td>
                  <td className="py-2 pr-3 text-right font-numeric text-neon-cyan">{j.bundles}</td>
                  <td className="py-2 pr-3 text-right font-numeric text-text-secondary">{(j.bundles * 30).toLocaleString("es-AR")}</td>
                  <td className="py-2 pr-3 hidden sm:table-cell text-text-secondary">{j.dueno || "—"}</td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => eliminar("jewels_stock", j.id)}
                      className="px-2 py-1 rounded font-body text-xs text-text-secondary hover:text-danger-red border border-border-base hover:border-danger-red/50 transition-colors"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* SEEDS */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-2xl text-text-primary">🌱 Seeds</h2>
        </div>

        <NuevoSeedForm onSaved={cargar} />

        {loading ? null : seeds.length === 0 ? (
          <p className="font-body text-text-muted text-center py-8 mt-4">No hay seeds en stock.</p>
        ) : (
          <table className="w-full text-sm mt-6">
            <thead>
              <tr className="border-b border-border-base text-left font-body text-xs uppercase tracking-wider text-text-muted">
                <th className="py-2 pr-3">Tipo</th>
                <th className="py-2 pr-3">Penta</th>
                <th className="py-2 pr-3 text-right">Cantidad</th>
                <th className="py-2 pr-3 hidden sm:table-cell">Dueño</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {seeds.map((s) => (
                <tr key={s.id} className="border-b border-border-base/40 font-body">
                  <td className="py-2 pr-3 text-text-primary">{SEED_LABELS[s.tipo]}</td>
                  <td className="py-2 pr-3">
                    {s.ensamblada_penta ? (
                      <span className="badge bg-luck-gold/15 text-luck-gold border border-luck-gold/40">Penta</span>
                    ) : (
                      <span className="text-text-muted text-xs">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-right font-numeric text-neon-cyan">{s.cantidad}</td>
                  <td className="py-2 pr-3 hidden sm:table-cell text-text-secondary">{s.dueno || "—"}</td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => eliminar("seeds_stock", s.id)}
                      className="px-2 py-1 rounded font-body text-xs text-text-secondary hover:text-danger-red border border-border-base hover:border-danger-red/50 transition-colors"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

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
      tipo, bundles: bundlesNum, dueno: dueno.trim() || null, estado: "activo",
    });
    setSaving(false);
    if (error) alert("Error: " + error.message);
    else {
      setTipo(""); setBundles("1"); setDueno("");
      onSaved();
    }
  }

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
          <TextInput value={dueno} onChange={setDueno} placeholder="Nick" />
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
          {bundlesNum} bundle{bundlesNum === 1 ? "" : "s"} = {(bundlesNum * 30).toLocaleString("es-AR")} jewels · valor compra: {(JEWEL_PRECIOS[tipo] * bundlesNum).toLocaleString("es-AR")} WC
        </p>
      )}
    </div>
  );
}

function NuevoSeedForm({ onSaved }: { onSaved: () => void }) {
  const [tipo, setTipo] = useState<"" | TipoSeed>("");
  const [ensamblada, setEnsamblada] = useState(false);
  const [cantidad, setCantidad] = useState("1");
  const [dueno, setDueno] = useState("");
  const [saving, setSaving] = useState(false);

  async function guardar() {
    if (!tipo) return;
    setSaving(true);
    const { error } = await supabase.from("seeds_stock").insert({
      tipo, ensamblada_penta: ensamblada,
      cantidad: Math.max(1, Number(cantidad) || 1),
      dueno: dueno.trim() || null, estado: "activo",
    });
    setSaving(false);
    if (error) alert("Error: " + error.message);
    else {
      setTipo(""); setEnsamblada(false); setCantidad("1"); setDueno("");
      onSaved();
    }
  }

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
          <TextInput value={dueno} onChange={setDueno} placeholder="Nick" />
        </div>
      </div>
      <div className="flex justify-end mt-3">
        <button
          onClick={guardar}
          disabled={!tipo || saving}
          className="btn-primary px-6 py-2 rounded font-body text-xs uppercase tracking-widest disabled:opacity-40"
        >
          {saving ? "..." : "Agregar"}
        </button>
      </div>
    </div>
  );
}
