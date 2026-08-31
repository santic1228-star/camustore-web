"use client";

/**
 * Admin · Eventos — edita el calendario sin deploy (Tanda B, 28/08).
 *
 * El catálogo en código es el default; acá se pisan tier / visible / horarios /
 * duración / nota por evento. Guardar inserta una fila nueva en `eventos_config`
 * (append-only, como Precios): la más reciente rige y el historial permite
 * volver atrás. Nació del rebalanceo del server del 28/08.
 */

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  DIAS_SEMANA,
  EVENTOS_CATALOGO,
  TIPO_LABEL,
  type EventoCatalogo,
  type ReglaHorario,
  type Tier,
} from "@/lib/eventos-catalogo";
import {
  aplicarConfig,
  cargarConfigEventos,
  guardarConfigEventos,
  listarHistorialEventos,
  overrideVacio,
  type OverrideEvento,
  type ValoresEventosConfig,
} from "@/lib/eventos-config";
import { formatHMS } from "@/lib/tiempo";
import { normalizarTier } from "@/lib/eventos-overrides";
import type { EventosConfigRow } from "@/lib/database.types";

const TIERS: { id: Tier; label: string }[] = [
  { id: 3, label: "Tier 3 · top" },
  { id: 2, label: "Tier 2" },
  { id: 1, label: "Tier 1" },
];

const hm = (seg: number) => formatHMS(seg).slice(0, 5);

function parseHM(txt: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(txt.trim());
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh > 23 || mm > 59) return null;
  return hh * 3600 + mm * 60;
}

export default function SeccionEventos({ user }: { user: User }) {
  const [valores, setValores] = useState<ValoresEventosConfig>({});
  const [cargado, setCargado] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [sucio, setSucio] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [notaGuardado, setNotaGuardado] = useState("");
  const [historial, setHistorial] = useState<EventosConfigRow[]>([]);
  const [abierto, setAbierto] = useState<string | null>(null);

  useEffect(() => {
    cargarConfigEventos().then((c) => {
      setValores(c.valores);
      setErrorCarga(c.error);
      setCargado(true);
    });
    listarHistorialEventos().then((h) => setHistorial(h.filas));
  }, []);

  const efectivos = useMemo(() => aplicarConfig(valores), [valores]);
  const efectivoPorId = useMemo(() => {
    const m = new Map<string, EventoCatalogo>();
    for (const e of efectivos) m.set(e.id, e);
    return m;
  }, [efectivos]);

  function setOverride(id: string, patch: Partial<OverrideEvento>) {
    setValores((prev) => {
      const o: OverrideEvento = { ...(prev[id] ?? {}), ...patch };
      const next = { ...prev };
      // undefined en el patch = sacar ese campo del override
      for (const k of Object.keys(patch) as (keyof OverrideEvento)[]) {
        if (patch[k] === undefined) delete o[k];
      }
      if (overrideVacio(o)) delete next[id];
      else next[id] = o;
      return next;
    });
    setSucio(true);
    setMsg(null);
  }

  async function guardar() {
    setGuardando(true);
    setMsg(null);
    const r = await guardarConfigEventos(valores, user.email ?? "admin", notaGuardado);
    setGuardando(false);
    if (!r.ok) {
      setMsg(`✗ No se guardó: ${r.error}`);
      return;
    }
    setSucio(false);
    setNotaGuardado("");
    setMsg("✓ Guardado. Rige al toque en la timeline free y en la de miembros.");
    listarHistorialEventos().then((h) => setHistorial(h.filas));
  }

  function restaurar(fila: EventosConfigRow) {
    setValores((fila.valores as ValoresEventosConfig) ?? {});
    setSucio(true);
    setMsg(`Cargada la versión del ${new Date(fila.created_at).toLocaleString("es-AR")}. Guardá para que rija.`);
  }

  if (!cargado) {
    return <p className="font-body text-sm text-text-secondary p-4">Cargando configuración…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="gamer-card rounded-lg p-4 sm:p-5">
        <h2 className="font-display font-bold text-lg text-text-primary">Calendario de eventos</h2>
        <p className="font-body text-xs text-text-secondary mt-1 leading-relaxed">
          El catálogo en código es el default (planilla del admin del 28/08). Lo que toques acá lo
          pisa <span className="text-luck-gold font-bold">sin deploy</span> — para cuando el server
          rebalancee de nuevo. Los cambios rigen al guardar, en la timeline free y en la de miembros.
        </p>
        {errorCarga && (
          <p className="font-body text-xs text-danger-red mt-2">
            No se pudo leer la config guardada ({errorCarga}); estás viendo el default. ¿Corriste el
            SQL de la Tanda B?
          </p>
        )}
      </div>

      {EVENTOS_CATALOGO.map((base) => {
        const o = valores[base.id] ?? {};
        const ef = efectivoPorId.get(base.id); // undefined si está oculto
        const oculto = o.visible === false;
        const conCambios = !overrideVacio(o);
        const expandido = abierto === base.id;
        return (
          <div
            key={base.id}
            className={`gamer-card rounded-lg p-3 sm:p-4 ${oculto ? "opacity-60" : ""}`}
          >
            <button
              type="button"
              onClick={() => setAbierto(expandido ? null : base.id)}
              className="w-full flex items-center justify-between gap-2 text-left"
            >
              <span className="font-body text-sm text-text-primary font-bold">
                {base.nombre}
                <span className="font-body text-[10px] uppercase tracking-wider text-text-muted ml-2">
                  {TIPO_LABEL[base.tipo]}
                </span>
                {conCambios && (
                  <span className="text-luck-gold text-[10px] uppercase tracking-wider ml-2">
                    · editado
                  </span>
                )}
                {oculto && (
                  <span className="text-danger-red text-[10px] uppercase tracking-wider ml-2">
                    · oculto
                  </span>
                )}
              </span>
              <span className="font-body text-xs text-text-muted shrink-0">
                {resumenRegla(ef?.regla ?? base.regla)} {expandido ? "▲" : "▼"}
              </span>
            </button>

            {expandido && (
              <FormEvento
                base={base}
                override={o}
                onChange={(patch) => setOverride(base.id, patch)}
              />
            )}
          </div>
        );
      })}

      {/* Guardar */}
      <div className="gamer-card rounded-lg p-4 sm:p-5 sticky bottom-2">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <input
            type="text"
            value={notaGuardado}
            onChange={(e) => setNotaGuardado(e.target.value)}
            placeholder="Nota del cambio (ej: rebalanceo del server)"
            className="flex-1 bg-bg-deep border border-border-base rounded px-3 py-2 font-body text-sm text-text-primary placeholder:text-text-muted"
          />
          <button
            type="button"
            onClick={guardar}
            disabled={!sucio || guardando}
            className="px-4 py-2 rounded font-body text-xs uppercase tracking-widest border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10 disabled:opacity-40 transition-colors"
          >
            {guardando ? "Guardando…" : sucio ? "Guardar cambios" : "Sin cambios"}
          </button>
        </div>
        {msg && <p className="font-body text-xs text-text-secondary mt-2">{msg}</p>}
      </div>

      {/* Historial */}
      {historial.length > 0 && (
        <div className="gamer-card rounded-lg p-4 sm:p-5">
          <h3 className="font-display font-bold text-base text-text-primary mb-2">Historial</h3>
          <ul className="space-y-1.5">
            {historial.map((f, i) => (
              <li key={f.id} className="flex items-center justify-between gap-2 font-body text-xs">
                <span className="text-text-secondary truncate">
                  {new Date(f.created_at).toLocaleString("es-AR")} · {f.creado_por_email}
                  {f.nota ? ` · ${f.nota}` : ""}
                  {i === 0 ? " · (vigente)" : ""}
                </span>
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => restaurar(f)}
                    className="shrink-0 px-2 py-1 rounded border border-border-strong text-text-secondary hover:text-neon-cyan hover:border-neon-cyan/50 transition-colors"
                  >
                    Cargar
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// =====================================================
// Resumen y formulario de un evento
// =====================================================

function resumenRegla(r: ReglaHorario): string {
  if (r.clase === "lista_diaria") {
    const n = r.horasSeg.length;
    return `${n} ${n === 1 ? "horario" : "horarios"}/día${r.listaCompleta ? "" : " ±"}`;
  }
  const n = r.ocurrencias.length;
  return `semanal (${n})${r.listaCompleta ? "" : " ±"}`;
}

function FormEvento({
  base,
  override,
  onChange,
}: {
  base: EventoCatalogo;
  override: OverrideEvento;
  onChange: (patch: Partial<OverrideEvento>) => void;
}) {
  const [nuevaHora, setNuevaHora] = useState("");
  const [nuevoDia, setNuevoDia] = useState(0);

  const regla: ReglaHorario = override.regla ?? base.regla;
  const tier: Tier = normalizarTier(override.tier) ?? base.tier;
  const visible = override.visible !== false;
  const apuntable = override.seApunta ?? (base.seApunta ?? tier >= 2);
  const duracion =
    override.duracionMin === undefined ? (base.duracionMin ?? null) : override.duracionMin;
  const nota = override.nota === undefined ? (base.nota ?? "") : (override.nota ?? "");

  function setRegla(r: ReglaHorario) {
    onChange({ regla: r });
  }

  function agregarHora() {
    const seg = parseHM(nuevaHora);
    if (seg === null) return;
    if (regla.clase === "lista_diaria") {
      if (regla.horasSeg.includes(seg)) return;
      setRegla({ ...regla, horasSeg: [...regla.horasSeg, seg].sort((a, b) => a - b) });
    } else {
      setRegla({
        ...regla,
        ocurrencias: [...regla.ocurrencias, { dia: nuevoDia, horaSeg: seg }].sort(
          (a, b) => a.dia - b.dia || a.horaSeg - b.horaSeg,
        ),
      });
    }
    setNuevaHora("");
  }

  const esDefault = overrideVacio(override);

  return (
    <div className="mt-3 pt-3 border-t border-border-base space-y-3">
      {/* Tier + visible */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-body text-[10px] uppercase tracking-[0.25em] text-text-muted">Tier</span>
        {TIERS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange({ tier: t.id === base.tier ? undefined : t.id })}
            className={`px-2.5 py-1 rounded border font-body text-xs transition-colors ${
              tier === t.id
                ? "border-neon-cyan text-neon-cyan bg-neon-cyan/10"
                : "border-border-base text-text-secondary hover:border-border-strong"
            }`}
          >
            {t.label}
          </button>
        ))}
        <label className="ml-auto inline-flex items-center gap-2 font-body text-xs text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={apuntable}
            onChange={(e) => {
              const def = base.seApunta ?? tier >= 2;
              onChange({ seApunta: e.target.checked === def ? undefined : e.target.checked });
            }}
          />
          Con &quot;Me apunto&quot;
        </label>
        <label className="inline-flex items-center gap-2 font-body text-xs text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => onChange({ visible: e.target.checked ? undefined : false })}
          />
          Visible
        </label>
      </div>

      {/* Horarios */}
      <div>
        <p className="font-body text-[10px] uppercase tracking-[0.25em] text-text-muted mb-1.5">
          Horarios (hora servidor)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {regla.clase === "lista_diaria"
            ? regla.horasSeg.map((seg) => (
                <span
                  key={seg}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border-base font-numeric text-xs text-text-primary"
                >
                  {hm(seg)}
                  <button
                    type="button"
                    onClick={() =>
                      setRegla({ ...regla, horasSeg: regla.horasSeg.filter((s) => s !== seg) })
                    }
                    className="text-danger-red hover:text-danger-red/70"
                    title="Sacar este horario"
                  >
                    ✕
                  </button>
                </span>
              ))
            : regla.ocurrencias.map((o, i) => (
                <span
                  key={`${o.dia}-${o.horaSeg}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border-base font-body text-xs text-text-primary"
                >
                  {DIAS_SEMANA[o.dia]} <span className="font-numeric">{hm(o.horaSeg)}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setRegla({
                        ...regla,
                        ocurrencias: regla.ocurrencias.filter((_, j) => j !== i),
                      })
                    }
                    className="text-danger-red hover:text-danger-red/70"
                    title="Sacar esta ocurrencia"
                  >
                    ✕
                  </button>
                </span>
              ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {regla.clase === "semanal" && (
            <select
              value={nuevoDia}
              onChange={(e) => setNuevoDia(Number(e.target.value))}
              className="bg-bg-deep border border-border-base rounded px-2 py-1.5 font-body text-xs text-text-primary"
            >
              {DIAS_SEMANA.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          )}
          <input
            type="text"
            value={nuevaHora}
            onChange={(e) => setNuevaHora(e.target.value)}
            placeholder="HH:MM"
            className="w-20 bg-bg-deep border border-border-base rounded px-2 py-1.5 font-numeric text-xs text-text-primary placeholder:text-text-muted"
          />
          <button
            type="button"
            onClick={agregarHora}
            disabled={parseHM(nuevaHora) === null}
            className="px-2.5 py-1.5 rounded border border-neon-cyan/50 text-neon-cyan font-body text-xs hover:bg-neon-cyan/10 disabled:opacity-40 transition-colors"
          >
            + Agregar
          </button>
          <label className="inline-flex items-center gap-2 font-body text-xs text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={!regla.listaCompleta}
              onChange={(e) => setRegla({ ...regla, listaCompleta: !e.target.checked })}
            />
            Lista incompleta (muestra ±)
          </label>
        </div>
      </div>

      {/* Duración + nota */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 font-body text-xs text-text-secondary">
          Dura (min, vacío = 20):
          <input
            type="number"
            min={0}
            value={duracion ?? ""}
            onChange={(e) => {
              const v = e.target.value === "" ? null : Number(e.target.value);
              onChange({
                duracionMin: v === (base.duracionMin ?? null) ? undefined : v,
              });
            }}
            placeholder="20"
            className="w-16 bg-bg-deep border border-border-base rounded px-2 py-1.5 font-numeric text-xs text-text-primary"
          />
        </label>
        <input
          type="text"
          value={nota}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ nota: v === (base.nota ?? "") ? undefined : v || null });
          }}
          placeholder="Nota visible (opcional)"
          className="flex-1 min-w-40 bg-bg-deep border border-border-base rounded px-3 py-1.5 font-body text-xs text-text-primary placeholder:text-text-muted"
        />
        {!esDefault && (
          <button
            type="button"
            onClick={() =>
              onChange({
                tier: undefined,
                seApunta: undefined,
                visible: undefined,
                regla: undefined,
                duracionMin: undefined,
                nota: undefined,
              })
            }
            className="px-2.5 py-1.5 rounded border border-border-strong text-text-secondary font-body text-xs hover:text-luck-gold hover:border-luck-gold/50 transition-colors"
          >
            Restaurar default
          </button>
        )}
      </div>
    </div>
  );
}
