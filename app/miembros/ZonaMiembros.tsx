"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import { cargarRegistros, eliminarRegistro, type RegistrosCargados, type SesionMiembro } from "@/lib/miembros";
import {
  EVENTOS,
  eventoPorTipo,
  fechaCortaServidor,
  hmServidor,
  textoHace,
} from "@/lib/registros";
import TarjetaEvento from "./TarjetaEvento";

// =====================================================
// Zona de miembros: los tres timers compartidos + historial.
// - Tick de 1 s para el "cuánto falta".
// - Recarga de la DB cada 30 s y cada vez que la pestaña vuelve al frente.
// =====================================================

const INTERVALO_RECARGA_MS = 30 * 1000;

interface Props {
  sesion: SesionMiembro;
}

export default function ZonaMiembros({ sesion }: Props) {
  const [datos, setDatos] = useState<RegistrosCargados | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ultimaCarga, setUltimaCarga] = useState<number | null>(null);
  // null hasta montar en el cliente (evita diferencias servidor/cliente al hidratar).
  const [ahora, setAhora] = useState<number | null>(null);

  const recargar = useCallback(async () => {
    try {
      const d = await cargarRegistros();
      setDatos(d);
      setError(null);
      setUltimaCarga(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los registros.");
    }
  }, []);

  // Tick de 1 s.
  useEffect(() => {
    setAhora(Date.now());
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Carga inicial + recarga periódica + al volver a la pestaña.
  useEffect(() => {
    recargar();
    const t = setInterval(recargar, INTERVALO_RECARGA_MS);
    function onVisible() {
      if (document.visibilityState === "visible") recargar();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [recargar]);

  async function borrar(id: string) {
    if (!confirm("¿Borrar este registro? Solo el admin puede hacerlo.")) return;
    try {
      await eliminarRegistro(id);
      recargar();
    } catch (e) {
      alert("Error: " + (e instanceof Error ? e.message : e));
    }
  }

  return (
    <main className="px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        {/* ============ Cabecera ============ */}
        <div className="mb-6 sm:mb-8 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="inline-block font-body text-xs tracking-[0.3em] uppercase text-neon-orange mb-3 px-3 py-1 border border-neon-orange/30 rounded">
              Miembros · con login
            </p>
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-text-primary leading-none">
              Timers compartidos
            </h1>
            <p className="font-body text-sm text-text-secondary mt-3 leading-relaxed">
              Lo que carga uno lo ven todos. Horas en{" "}
              <span className="text-luck-gold font-bold">hora servidor</span>; la cuenta regresiva usa
              el reloj de tu dispositivo.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="badge bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40">
              {sesion.personaje}
            </span>
            <button
              onClick={() => signOut().then(() => location.reload())}
              className="px-3 py-1.5 rounded font-body text-xs uppercase tracking-wider text-text-secondary hover:text-danger-red border border-border-base hover:border-danger-red/50 transition-colors"
            >
              Salir
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-danger-red/40 bg-danger-red/10 p-3 font-body text-sm text-danger-red">
            {error}{" "}
            <button onClick={recargar} className="underline">
              Reintentar
            </button>
          </div>
        )}

        {/* ============ Las tres tarjetas ============ */}
        <div className="space-y-4 sm:space-y-6">
          {EVENTOS.map((config) => (
            <TarjetaEvento
              key={config.tipo}
              config={config}
              registro={datos?.vigentes[config.tipo]}
              ahora={datos ? ahora : null}
              sesion={sesion}
              onGuardado={recargar}
            />
          ))}
        </div>

        <p className="font-body text-[11px] text-text-muted text-center mt-4">
          Se actualiza solo cada 30 s
          {ultimaCarga !== null && ahora !== null && <> · última actualización {textoHace(ultimaCarga, ahora)}</>}
          {" "}·{" "}
          <button onClick={recargar} className="underline hover:text-text-secondary">
            actualizar ahora
          </button>
        </p>

        {/* ============ Historial ============ */}
        <section className="mt-8 sm:mt-10 gamer-card rounded-lg p-5 sm:p-6">
          <h2 className="font-display font-bold text-base mb-3 text-text-primary">Historial</h2>
          {!datos ? (
            <p className="font-body text-sm text-text-muted animate-pulse">Cargando…</p>
          ) : datos.historial.length === 0 ? (
            <p className="font-body text-sm text-text-muted">Todavía no hay registros.</p>
          ) : (
            <ul className="divide-y divide-border-base/60">
              {datos.historial.slice(0, 15).map((r) => {
                const c = eventoPorTipo(r.tipo);
                const resultadoMs = Date.parse(r.resultado_at);
                const creadoMs = Date.parse(r.created_at);
                const vigente = datos.vigentes[r.tipo]?.id === r.id;
                return (
                  <li key={r.id} className="py-2 flex items-center gap-3 font-body text-sm">
                    <span className="text-lg leading-none" aria-hidden>
                      {c.icono}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-text-primary">
                        {c.nombre} {c.etiquetaResultado}{" "}
                        <span className="font-numeric text-neon-cyan">{hmServidor(resultadoMs)}</span>
                        <span className="text-text-muted"> del {fechaCortaServidor(resultadoMs)}</span>
                        {vigente && (
                          <span className="ml-2 badge bg-success-green/15 text-success-green border border-success-green/40">
                            vigente
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-text-muted truncate">
                        cargó {r.cargado_por_personaje}
                        {ahora !== null && <> · {textoHace(creadoMs, ahora)}</>}
                        {r.tipo !== "gaion" && <> · murió {hmServidor(Date.parse(r.hora_evento))}</>}
                        {r.tipo === "gaion" && r.standby_seg !== null && (
                          <> · captura {hmServidor(Date.parse(r.hora_evento))}</>
                        )}
                      </p>
                    </div>
                    {sesion.esAdmin && (
                      <button
                        onClick={() => borrar(r.id)}
                        className="px-2 py-1 rounded text-xs text-text-muted hover:text-danger-red transition-colors"
                        title="Borrar (solo admin)"
                      >
                        ✕
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ============ Cómo funciona ============ */}
        <section className="mt-4 rounded-lg border border-dashed border-border-strong p-5 sm:p-6">
          <ul className="font-body text-sm text-text-secondary space-y-2.5">
            <li className="flex gap-3">
              <span className="text-neon-cyan font-bold">·</span>
              <span>
                Cada carga es un registro nuevo; el último de cada evento es el{" "}
                <span className="text-success-green">vigente</span>. Si alguien se equivocó, cargá la hora
                correcta y listo.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-neon-cyan font-bold">·</span>
              <span>
                El Gaion avanza solo: pasada una apertura, la tarjeta muestra la siguiente (cada 2 hs) hasta
                que alguien cargue una captura nueva.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-neon-cyan font-bold">·</span>
              <span>
                Cuando faltan <span className="text-text-primary">15</span> y{" "}
                <span className="text-text-primary">5</span> minutos la tarjeta se resalta. Avisos con la
                pestaña cerrada: próximamente.
              </span>
            </li>
          </ul>
          <p className="font-body text-[11px] text-text-muted mt-4">
            Las calculadoras gratis siguen en{" "}
            <Link href="/herramientas" className="underline hover:text-text-secondary">
              /herramientas
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
