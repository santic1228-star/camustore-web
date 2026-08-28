"use client";

/**
 * La timeline vertical de las próximas 24 hs (versión free, sin login).
 *
 * Toda la cuenta vive en lib/itinerario.ts (puro, testeado contra las
 * capturas). Acá solo hay estado de UI: el tick del reloj y el filtro.
 * El tamaño del pin sale del tier (DECISIONES §11): alto > medio > bajo.
 */

import { useEffect, useMemo, useState } from "react";
import { DIAS_SEMANA, horariosParciales, type TipoEvento } from "@/lib/eventos-catalogo";
import TimelineZig from "@/components/TimelineZig";
import { itemsDeCalendario } from "@/lib/timeline-items";
import { diaSemanaDe, itinerario24h, proximosSemanales } from "@/lib/itinerario";
import { hmsServidor, indiceDiaServidor } from "@/lib/registros";
import { aplicarConfig, cargarConfigEventos, type ValoresEventosConfig } from "@/lib/eventos-config";

type Filtro = "todos" | TipoEvento;

const FILTROS: { id: Filtro; label: string }[] = [
  { id: "todos", label: "Todo" },
  { id: "evento", label: "Eventos" },
  { id: "invasion", label: "Invasiones" },
  { id: "boss", label: "Bosses" },
];

export default function TimelineDia() {
  // null hasta montar: evita el mismatch de hidratación (mismo patrón que BossTimer).
  const [ahora, setAhora] = useState<number | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  // Overrides del admin (eventos_config). Si la BD falla, el catálogo en código alcanza.
  const [valoresConfig, setValoresConfig] = useState<ValoresEventosConfig>({});

  useEffect(() => {
    setAhora(Date.now());
    const t = setInterval(() => setAhora(Date.now()), 1000);
    cargarConfigEventos().then((c) => setValoresConfig(c.valores)).catch(() => {});
    return () => clearInterval(t);
  }, []);

  const catalogo = useMemo(() => aplicarConfig(valoresConfig), [valoresConfig]);
  const ocurrencias = useMemo(
    () => (ahora === null ? [] : itinerario24h(ahora, catalogo)),
    [ahora, catalogo],
  );
  const semanales = useMemo(
    () => (ahora === null ? [] : proximosSemanales(ahora, catalogo)),
    [ahora, catalogo],
  );

  if (ahora === null) {
    return (
      <div className="gamer-card rounded-lg p-6 text-center font-body text-sm text-text-secondary">
        Cargando la timeline…
      </div>
    );
  }

  const visibles = ocurrencias.filter((o) => filtro === "todos" || o.evento.tipo === filtro);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Reloj servidor + filtros */}
      <div className="gamer-card rounded-lg p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-body text-[10px] uppercase tracking-[0.3em] text-text-secondary">
              Hora servidor
            </p>
            <p className="font-numeric text-2xl sm:text-3xl neon-text-cyan mt-1">
              {hmsServidor(ahora)}
            </p>
          </div>
          <p className="font-body text-[11px] text-text-muted text-right leading-relaxed">
            Próximas 24 hs
            <br />
            <span className="text-luck-gold">±</span> = horarios relevados a medias
          </p>
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className={`font-body text-xs px-3 py-1.5 rounded border transition-colors ${
                filtro === f.id
                  ? "border-neon-cyan text-neon-cyan bg-neon-cyan/10"
                  : "border-border-base text-text-secondary hover:border-border-strong"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fijos de la semana (pueden estar a días) */}
      {(filtro === "todos" || semanales.some((s) => s.evento.tipo === filtro)) && (
        <div className="gamer-card rounded-lg p-4 sm:p-5">
          <p className="font-body text-[10px] uppercase tracking-[0.3em] text-text-secondary mb-3">
            Fijos de la semana
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {semanales
              .filter((s) => filtro === "todos" || s.evento.tipo === filtro)
              .map(({ evento, proxima }) => (
                <div key={evento.id} className="rounded border border-border-base px-3 py-2">
                  <p className="font-body text-sm text-text-primary font-bold">
                    {evento.nombre}
                    {horariosParciales(evento) && (
                      <span className="text-luck-gold ml-1" title="Puede haber más horarios">
                        ±
                      </span>
                    )}
                  </p>
                  {proxima ? (
                    <p className="font-body text-xs text-text-secondary mt-0.5">
                      {proxima.enCurso ? (
                        <span className="text-success-green font-bold">EN CURSO</span>
                      ) : (
                        <>
                          {DIAS_SEMANA[diaSemanaDe(indiceDiaServidor(proxima.inicioMs))]}{" "}
                          <span className="font-numeric text-text-primary">{proxima.hm}</span> ·{" "}
                          {proxima.etiqueta}
                        </>
                      )}
                    </p>
                  ) : (
                    <p className="font-body text-xs text-text-muted mt-0.5">Sin horario relevado</p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* La timeline zig-zag */}
      <TimelineZig items={itemsDeCalendario(visibles)} ahora={ahora} />
    </div>
  );
}
