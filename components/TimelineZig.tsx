"use client";

/**
 * Timeline zig-zag interactiva (boceto de Santi, 28/08).
 *
 * Eje central; las tarjetas salen en ramas alternadas (la 1.ª a la derecha)
 * con la HORA del lado opuesto, pegada al eje. Espaciado proporcional al
 * tiempo con tope (lib/timeline-items.ts).
 *
 * Foco: se agranda el más próximo solo (autofoco); tap en otro lo enfoca
 * (tap de nuevo vuelve al autofoco); en desktop el hover manda mientras dura.
 * Tier 3 enfocado = animación jugosa (entrada con rebote + glow pulsante,
 * definidas en globals.css); el resto, transiciones sutiles. Con foco en uno,
 * los demás se achican un toque.
 *
 * La usan la free (sin apuntados) y la de miembros (apuntados + Me apunto).
 */

import { useState } from "react";
import AvatarRaza from "@/components/ui/AvatarRaza";
import {
  DIAS_SEMANA,
  esApuntable,
  horariosParciales,
  TIER_LABEL,
  TIPO_LABEL,
} from "@/lib/eventos-catalogo";
import { diaSemanaDe } from "@/lib/itinerario";
import {
  diasExtraDe,
  enCursoDe,
  gapsDe,
  inicioDe,
  ladoDe,
  type ItemTimeline,
} from "@/lib/timeline-items";
import { fechaCortaServidor, indiceDiaServidor } from "@/lib/registros";
import { formatDuracion } from "@/lib/tiempo";
import type { CalAsistenciaRow } from "@/lib/database.types";

interface Props {
  items: ItemTimeline[];
  ahora: number;
  /** Solo miembros: apuntados por clave de ocurrencia. */
  apuntados?: Record<string, CalAsistenciaRow[]>;
  /** Solo miembros: email propio (pinta tu nombre en cyan). */
  yo?: string;
  /** Solo miembros: apuntarse/bajarse de una ocurrencia de calendario. */
  onVoy?: (it: Extract<ItemTimeline, { clase: "calendario" }>) => void;
  /** Clave con el guardado en curso (deshabilita ese botón). */
  cambiando?: string | null;
}

export default function TimelineZig({ items, ahora, apuntados, yo, onVoy, cambiando }: Props) {
  const [focoTap, setFocoTap] = useState<string | null>(null);
  const [focoHover, setFocoHover] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="gamer-card rounded-lg p-6 text-center font-body text-sm text-text-secondary">
        No hay nada en las próximas 24 hs.
      </div>
    );
  }

  // hover (desktop) > tap > autofoco (el más próximo = el primero)
  const focoAuto = items[0].clave;
  const foco = focoHover ?? focoTap ?? focoAuto;
  const gaps = gapsDe(items, ahora);

  return (
    <ol className="relative">
      {/* el eje */}
      <span className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-border-strong" aria-hidden />
      {/* marcador de "ahora" */}
      <li className="relative flex justify-center">
        <span className="font-body text-[9px] uppercase tracking-[0.3em] text-neon-cyan bg-bg-deep px-2 py-0.5 border border-neon-cyan/40 rounded-full z-10">
          ahora
        </span>
      </li>
      {items.map((it, i) => (
        <Fila
          key={it.clave}
          it={it}
          gap={gaps[i]}
          lado={ladoDe(i)}
          anterior={i > 0 ? items[i - 1] : null}
          enfocada={foco === it.clave}
          hayOtroFoco={foco !== it.clave}
          apuntados={apuntados?.[it.clave] ?? []}
          yo={yo}
          cambiando={cambiando === it.clave}
          onTap={() => setFocoTap(focoTap === it.clave ? null : it.clave)}
          onHover={(dentro) => setFocoHover(dentro ? it.clave : null)}
          onVoy={onVoy && it.clase === "calendario" ? () => onVoy(it) : undefined}
        />
      ))}
    </ol>
  );
}

// =====================================================
// Una fila del zig-zag
// =====================================================

function grupoDe(it: ItemTimeline): string {
  return enCursoDe(it) ? "en-curso" : `dia-${diasExtraDe(it)}`;
}

const LABEL_GRUPO: Record<string, string> = {
  "en-curso": "En curso",
};

const DOT: Record<number | string, string> = {
  3: "w-4 h-4 bg-luck-gold shadow-[0_0_10px_rgba(255,215,0,0.5)]",
  2: "w-3 h-3 bg-neon-cyan",
  1: "w-2 h-2 bg-text-muted",
  privado: "w-3.5 h-3.5 bg-success-green shadow-[0_0_8px_rgba(80,250,123,0.45)]",
};

function Fila({
  it,
  gap,
  lado,
  anterior,
  enfocada,
  hayOtroFoco,
  apuntados,
  yo,
  cambiando,
  onTap,
  onHover,
  onVoy,
}: {
  it: ItemTimeline;
  gap: number;
  lado: "der" | "izq";
  anterior: ItemTimeline | null;
  enfocada: boolean;
  hayOtroFoco: boolean;
  apuntados: CalAsistenciaRow[];
  yo?: string;
  cambiando: boolean;
  onTap: () => void;
  onHover: (dentro: boolean) => void;
  onVoy?: () => void;
}) {
  const inicioMs = inicioDe(it);
  const cambiaGrupo = !anterior || grupoDe(anterior) !== grupoDe(it);
  const tier3 = it.clase === "calendario" && it.oc.evento.tier === 3;

  return (
    <>
      {cambiaGrupo && (
        <li className="relative flex justify-center pt-3 pb-1">
          <span
            className={`font-body text-[10px] uppercase tracking-[0.3em] bg-bg-deep px-2 z-10 ${
              grupoDe(it) === "en-curso" ? "text-success-green" : "text-text-muted"
            }`}
          >
            {LABEL_GRUPO[grupoDe(it)] ??
              `${diasExtraDe(it) === 0 ? "Hoy" : "Mañana"} · ${
                DIAS_SEMANA[diaSemanaDe(indiceDiaServidor(inicioMs))]
              } ${fechaCortaServidor(inicioMs)}`}
          </span>
        </li>
      )}
      <li className="relative" style={{ marginTop: cambiaGrupo ? 4 : gap }}>
        {/* punto en el eje */}
        <span
          className={`absolute left-1/2 -translate-x-1/2 top-2 rounded-full z-10 ${
            DOT[it.clase === "privado" ? "privado" : it.oc.evento.tier]
          } ${enCursoDe(it) ? "animate-pulse" : ""}`}
        />
        {/* la hora, del lado opuesto a la tarjeta */}
        <span
          className={`absolute top-1.5 font-numeric text-sm z-10 ${
            it.clase === "privado" ? "text-success-green" : tier3 ? "text-luck-gold" : "text-neon-cyan"
          } ${lado === "der" ? "right-[calc(50%+0.9rem)]" : "left-[calc(50%+0.9rem)]"}`}
        >
          {it.clase === "calendario" ? it.oc.hm : it.hm}
        </span>

        {/* la tarjeta */}
        <div
          onMouseEnter={() => onHover(true)}
          onMouseLeave={() => onHover(false)}
          onClick={onTap}
          className={`relative cursor-pointer rounded-lg border transition-all duration-200 ease-out ${
            lado === "der" ? "ml-auto" : "mr-auto"
          } ${enfocada ? "w-[calc(58%)] z-20" : "w-[calc(50%-0.9rem)]"} ${
            enfocada
              ? tier3
                ? "tarjeta-tier3-foco border-luck-gold/70 bg-bg-deep"
                : "scale-[1.03] border-neon-cyan/60 bg-bg-deep shadow-[0_0_14px_rgba(0,229,255,0.12)]"
              : hayOtroFoco
                ? "scale-[0.97] opacity-75 border-border-base bg-bg-deep/60"
                : "border-border-base bg-bg-deep/60"
          } ${it.clase === "privado" && enfocada ? "border-success-green/60" : ""} p-2.5 sm:p-3`}
        >
          <CuerpoTarjeta
            it={it}
            enfocada={enfocada}
            apuntados={apuntados}
            yo={yo}
            cambiando={cambiando}
            onVoy={onVoy}
          />
        </div>
      </li>
    </>
  );
}

function CuerpoTarjeta({
  it,
  enfocada,
  apuntados,
  yo,
  cambiando,
  onVoy,
}: {
  it: ItemTimeline;
  enfocada: boolean;
  apuntados: CalAsistenciaRow[];
  yo?: string;
  cambiando: boolean;
  onVoy?: () => void;
}) {
  if (it.clase === "privado") {
    return (
      <>
        <p className="font-body text-sm font-bold text-text-primary leading-tight">
          {it.icono} {it.nombre}
          <span className="font-body text-[9px] uppercase tracking-wider text-success-green ml-1.5">
            guild
          </span>
        </p>
        <Countdown enCurso={false} faltanSeg={Math.round((it.inicioMs - Date.now()) / 1000)} />
        {enfocada && (
          <p className="font-body text-[11px] text-text-secondary mt-1">
            {it.texto} · dato nuestro, no está en la timeline pública.
          </p>
        )}
      </>
    );
  }

  const { oc } = it;
  const ev = oc.evento;
  const yoVoy = yo !== undefined && apuntados.some((a) => a.email === yo);

  return (
    <>
      <p
        className={`font-body text-text-primary leading-tight ${
          ev.tier === 3 ? "text-sm sm:text-base font-bold" : ev.tier === 1 ? "text-xs sm:text-sm" : "text-sm font-bold"
        }`}
      >
        {ev.nombre}
        {horariosParciales(ev) && (
          <span className="text-luck-gold ml-1" title="Puede haber más horarios">±</span>
        )}
      </p>
      <p className="font-body text-[9px] uppercase tracking-wider text-text-muted mt-0.5">
        {TIER_LABEL[ev.tier]} · {TIPO_LABEL[ev.tipo]}
      </p>
      <Countdown enCurso={oc.enCurso} faltanSeg={oc.faltanSeg} terminaEnSeg={oc.terminaEnSeg} />

      {/* avatares compactos sin enfocar */}
      {!enfocada && apuntados.length > 0 && (
        <span className="flex items-center gap-1 mt-1.5">
          {apuntados.slice(0, 5).map((a) => (
            <AvatarRaza key={a.id} raza={a.raza} size={16} />
          ))}
          <span className="font-body text-[10px] text-text-secondary ml-0.5">
            {apuntados.length}
          </span>
        </span>
      )}

      {enfocada && (
        <div className="mt-2 pt-2 border-t border-border-base/60">
          {(ev.mapa || ev.drop) && (
            <p className="font-body text-[11px] text-text-secondary">
              {[ev.mapa, ev.drop].filter(Boolean).join(" · ")}
            </p>
          )}
          {ev.nota && <p className="font-body text-[10px] text-text-muted mt-1">{ev.nota}</p>}

          {/* apuntados con nombre (solo miembros) */}
          {yo !== undefined && esApuntable(ev) && (
            <>
              {apuntados.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5">
                  {apuntados.map((a) => (
                    <span
                      key={a.id}
                      className={`inline-flex items-center gap-1 font-body text-xs ${
                        a.email === yo ? "text-neon-cyan" : "text-text-primary"
                      }`}
                    >
                      <AvatarRaza raza={a.raza} size={16} />
                      {a.personaje}
                    </span>
                  ))}
                </div>
              )}
              {onVoy && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // que el botón no cambie el foco
                    onVoy();
                  }}
                  disabled={cambiando}
                  className={`mt-2 px-3 py-1 rounded font-body text-[10px] uppercase tracking-widest border transition-colors disabled:opacity-50 ${
                    yoVoy
                      ? "bg-success-green/15 text-success-green border-success-green/50 hover:bg-danger-red/10 hover:text-danger-red hover:border-danger-red/50"
                      : "border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10"
                  }`}
                >
                  {cambiando ? "…" : yoVoy ? "✓ Voy" : "Me apunto"}
                </button>
              )}
            </>
          )}
          {yo !== undefined && !esApuntable(ev) && (
            <p className="font-body text-[10px] text-text-muted mt-1.5">No se apunta.</p>
          )}
        </div>
      )}
    </>
  );
}

function Countdown({
  enCurso,
  faltanSeg,
  terminaEnSeg,
}: {
  enCurso: boolean;
  faltanSeg: number;
  terminaEnSeg?: number;
}) {
  return (
    <p className="font-body text-[11px] mt-0.5">
      {enCurso ? (
        <span className="text-success-green font-bold">
          EN CURSO
          {terminaEnSeg !== undefined && terminaEnSeg > 0 && (
            <span className="font-normal text-success-green/80">
              {" "}· quedan <span className="font-numeric">{formatDuracion(terminaEnSeg)}</span>
            </span>
          )}
        </span>
      ) : faltanSeg < 5 * 60 ? (
        // como la ventana del juego: lo inminente (<5 min) se pinta verde
        <span className="text-success-green font-bold">
          en <span className="font-numeric">{formatDuracion(faltanSeg)}</span>
        </span>
      ) : (
        <span className="text-text-secondary">
          en <span className="text-text-primary font-numeric">{formatDuracion(faltanSeg)}</span>
        </span>
      )}
    </p>
  );
}
