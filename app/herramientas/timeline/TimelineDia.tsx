"use client";

/**
 * La timeline vertical de las próximas 24 hs (versión free, sin login).
 *
 * Toda la cuenta vive en lib/itinerario.ts (puro, testeado contra las
 * capturas). Acá solo hay estado de UI: el tick del reloj y el filtro.
 * El tamaño del pin sale del tier (DECISIONES §11): alto > medio > bajo.
 */

import { useEffect, useMemo, useState } from "react";
import {
  DIAS_SEMANA,
  horariosParciales,
  TIPO_LABEL,
  type TipoEvento,
} from "@/lib/eventos-catalogo";
import {
  diaSemanaDe,
  itinerario24h,
  proximosSemanales,
  type Ocurrencia,
} from "@/lib/itinerario";
import { fechaCortaServidor, hmsServidor, indiceDiaServidor } from "@/lib/registros";
import { formatDuracion } from "@/lib/tiempo";

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

  useEffect(() => {
    setAhora(Date.now());
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const ocurrencias = useMemo(() => (ahora === null ? [] : itinerario24h(ahora)), [ahora]);
  const semanales = useMemo(() => (ahora === null ? [] : proximosSemanales(ahora)), [ahora]);

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

      {/* La timeline vertical */}
      {visibles.length === 0 ? (
        <div className="gamer-card rounded-lg p-6 text-center font-body text-sm text-text-secondary">
          No hay nada de esta categoría en las próximas 24 hs.
        </div>
      ) : (
        <ol className="relative border-l-2 border-border-base ml-2 sm:ml-3">
          {visibles.map((o, i) => (
            <ItemTimeline
              key={`${o.evento.id}@${o.inicioMs}`}
              o={o}
              anterior={i > 0 ? visibles[i - 1] : null}
            />
          ))}
        </ol>
      )}
    </div>
  );
}

// =====================================================
// Separador de día + un ítem
// =====================================================

function grupoDe(o: Ocurrencia): string {
  return o.enCurso ? "en-curso" : `dia-${o.diasExtra}`;
}

function SeparadorDia({ o }: { o: Ocurrencia }) {
  const texto = o.enCurso
    ? "En curso"
    : `${o.diasExtra === 0 ? "Hoy" : "Mañana"} · ${
        DIAS_SEMANA[diaSemanaDe(indiceDiaServidor(o.inicioMs))]
      } ${fechaCortaServidor(o.inicioMs)}`;
  return (
    <li className="ml-4 sm:ml-5 pt-1 pb-2 first:pt-0">
      <p
        className={`font-body text-[10px] uppercase tracking-[0.3em] ${
          o.enCurso ? "text-success-green" : "text-text-muted"
        }`}
      >
        {texto}
      </p>
    </li>
  );
}

const PIN: Record<string, string> = {
  alto: "w-4 h-4 -left-[9px] bg-luck-gold shadow-[0_0_10px_rgba(255,215,0,0.5)]",
  medio: "w-3 h-3 -left-[7px] bg-neon-cyan",
  bajo: "w-2 h-2 -left-[5px] bg-text-muted",
};

function ItemTimeline({ o, anterior }: { o: Ocurrencia; anterior: Ocurrencia | null }) {
  const ev = o.evento;
  const esAlto = ev.tier === "alto";
  const esBajo = ev.tier === "bajo";
  const cambiaGrupo = !anterior || grupoDe(anterior) !== grupoDe(o);

  return (
    <>
      {cambiaGrupo && <SeparadorDia o={o} />}
      <li className={`relative ml-4 sm:ml-5 ${esBajo ? "pb-3" : "pb-4 sm:pb-5"}`}>
        <span
          className={`absolute top-1.5 rounded-full ${PIN[ev.tier]} ${
            o.enCurso ? "animate-pulse" : ""
          }`}
        />
        <div className="flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            <p
              className={`font-body text-text-primary ${
                esAlto ? "text-base sm:text-lg font-bold" : esBajo ? "text-sm" : "text-sm sm:text-base font-bold"
              }`}
            >
              <span className={`font-numeric mr-2 ${esAlto ? "text-luck-gold" : "text-neon-cyan"}`}>
                {o.hm}
              </span>
              {ev.nombre}
              {horariosParciales(ev) && (
                <span
                  className="text-luck-gold ml-1.5"
                  title="Horarios relevados a medias: puede haber más"
                >
                  ±
                </span>
              )}
              <span className="font-body text-[10px] uppercase tracking-wider text-text-muted ml-2">
                {TIPO_LABEL[ev.tipo]}
              </span>
            </p>
            {!esBajo && (ev.mapa || ev.drop) && (
              <p className="font-body text-xs text-text-secondary mt-0.5 truncate">
                {[ev.mapa, ev.drop].filter(Boolean).join(" · ")}
              </p>
            )}
            {esAlto && ev.nota && (
              <p className="font-body text-[11px] text-text-muted mt-0.5">{ev.nota}</p>
            )}
          </div>
          <p className="font-body text-xs whitespace-nowrap shrink-0">
            {o.enCurso ? (
              <span className="text-success-green font-bold">EN CURSO</span>
            ) : (
              <span className="text-text-secondary">
                en <span className="text-text-primary">{formatDuracion(o.faltanSeg)}</span>
              </span>
            )}
          </p>
        </div>
      </li>
    </>
  );
}
