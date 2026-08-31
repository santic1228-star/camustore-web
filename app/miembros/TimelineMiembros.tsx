"use client";

/**
 * Timeline de miembros — la zig-zag compartida (components/TimelineZig) con:
 *   - el calendario efectivo (catálogo + overrides del admin),
 *   - los PRIVADOS intercalados (Gaion / Kundun / Cryonox),
 *   - "Me apunto" por ocurrencia puntual en los eventos apuntables
 *     (Tier 3 y 2 por default; editable por evento desde el admin),
 *   - "Me apunto" también en los PRIVADOS (31/08): va a `eventos_asistencias`
 *     por registro vigente, la MISMA lista que muestra la tarjeta de carga.
 */

import { useEffect, useMemo, useState } from "react";
import TimelineZig from "@/components/TimelineZig";
import { DIAS_SEMANA } from "@/lib/eventos-catalogo";
import { aplicarConfig, cargarConfigEventos, type ValoresEventosConfig } from "@/lib/eventos-config";
import { diaSemanaDe, itinerario24h, proximosSemanales } from "@/lib/itinerario";
import {
  intercalarPrivados,
  itemsDeCalendario,
  type ItemTimeline,
} from "@/lib/timeline-items";
import {
  apuntarse,
  apuntarseCalendario,
  cargarAsistenciasCalendario,
  desapuntarse,
  desapuntarseCalendario,
  type SesionMiembro,
} from "@/lib/miembros";
import { indiceDiaServidor } from "@/lib/registros";
import type {
  AsistenciaRow,
  CalAsistenciaRow,
  EventoRegistroRow,
  Raza,
  TipoEventoRegistro,
} from "@/lib/database.types";
import type { ApuntadoTimeline } from "@/components/TimelineZig";

interface Props {
  sesion: SesionMiembro;
  miRaza: Raza | null;
  /** Registros vigentes por tipo (los carga ZonaMiembros). */
  vigentes: Partial<Record<TipoEventoRegistro, EventoRegistroRow>>;
  /** Apuntados de los registros privados por registro_id (los carga ZonaMiembros). */
  asistenciasRegistros?: Record<string, AsistenciaRow[]>;
  /** Avisar a ZonaMiembros que cambió una asistencia privada (recarga). */
  onCambioAsistencia?: () => void;
}

export default function TimelineMiembros({
  sesion,
  miRaza,
  vigentes,
  asistenciasRegistros = {},
  onCambioAsistencia,
}: Props) {
  const [ahora, setAhora] = useState<number | null>(null);
  const [valoresConfig, setValoresConfig] = useState<ValoresEventosConfig>({});
  const [asis, setAsis] = useState<Record<string, CalAsistenciaRow[]>>({});
  const [errorAsis, setErrorAsis] = useState<string | null>(null);
  const [cambiando, setCambiando] = useState<string | null>(null);
  const [asisCargadas, setAsisCargadas] = useState(false);

  useEffect(() => {
    setAhora(Date.now());
    const t = setInterval(() => setAhora(Date.now()), 1000);
    cargarConfigEventos().then((c) => setValoresConfig(c.valores)).catch(() => {});
    return () => clearInterval(t);
  }, []);

  async function refrescarAsis(base: number) {
    try {
      setAsis(await cargarAsistenciasCalendario(base - 2 * 3_600_000, base + 24 * 3_600_000));
      setErrorAsis(null);
    } catch (e) {
      setErrorAsis(e instanceof Error ? e.message : "No se pudieron leer los apuntados.");
    }
  }
  useEffect(() => {
    if (ahora !== null && !asisCargadas) {
      setAsisCargadas(true);
      void refrescarAsis(ahora);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ahora, asisCargadas]);

  const catalogo = useMemo(() => aplicarConfig(valoresConfig), [valoresConfig]);

  const items = useMemo<ItemTimeline[]>(() => {
    if (ahora === null) return [];
    return intercalarPrivados(itemsDeCalendario(itinerario24h(ahora, catalogo)), vigentes, ahora);
  }, [ahora, catalogo, vigentes]);

  /** Apuntados por clave: ocurrencias del calendario + privados (`priv-<tipo>` → registro vigente). */
  const apuntadosPorClave = useMemo<Record<string, ApuntadoTimeline[]>>(() => {
    const out: Record<string, ApuntadoTimeline[]> = { ...asis };
    for (const it of items) {
      if (it.clase !== "privado") continue;
      const reg = vigentes[it.tipo];
      if (reg) out[it.clave] = asistenciasRegistros[reg.id] ?? [];
    }
    return out;
  }, [asis, items, vigentes, asistenciasRegistros]);

  const semanales = useMemo(
    () => (ahora === null ? [] : proximosSemanales(ahora, catalogo)),
    [ahora, catalogo],
  );

  if (ahora === null) {
    return <p className="font-body text-sm text-text-secondary">Cargando la timeline…</p>;
  }

  async function toggleVoy(it: ItemTimeline) {
    const yoVoy = (apuntadosPorClave[it.clave] ?? []).some((a) => a.email === sesion.email);
    setCambiando(it.clave);
    try {
      if (it.clase === "privado") {
        // Misma tabla que la tarjeta de carga: apuntarse acá = apuntarse allá.
        const reg = vigentes[it.tipo];
        if (!reg) throw new Error("No hay registro vigente para apuntarse.");
        if (yoVoy) await desapuntarse(reg.id, sesion.email);
        else await apuntarse(reg.id, sesion, miRaza);
        onCambioAsistencia?.();
      } else {
        if (yoVoy) await desapuntarseCalendario(it.oc.evento.id, it.oc.inicioMs, sesion.email);
        else await apuntarseCalendario(it.oc.evento.id, it.oc.inicioMs, sesion, miRaza);
        await refrescarAsis(ahora!);
      }
    } catch (e) {
      setErrorAsis(e instanceof Error ? e.message : "No se pudo.");
    } finally {
      setCambiando(null);
    }
  }

  return (
    <div className="space-y-3">
      {/* Semanales que quedan lejos */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {semanales
          .filter((s) => s.proxima && s.proxima.diasExtra > 0)
          .map(({ evento, proxima }) => (
            <p key={evento.id} className="font-body text-xs text-text-secondary">
              <span className="text-text-primary font-bold">{evento.nombre}</span>:{" "}
              {DIAS_SEMANA[diaSemanaDe(indiceDiaServidor(proxima!.inicioMs))]}{" "}
              <span className="font-numeric">{proxima!.hm}</span>
            </p>
          ))}
      </div>

      {errorAsis && (
        <p className="font-body text-xs text-danger-red">
          {errorAsis} (¿está corrido el SQL de la Tanda B?)
        </p>
      )}

      <TimelineZig
        items={items}
        ahora={ahora}
        apuntados={apuntadosPorClave}
        yo={sesion.email}
        onVoy={toggleVoy}
        cambiando={cambiando}
      />

      <p className="font-body text-[11px] text-text-muted">
        Verde = dato de la guild (no está en la timeline pública). Tocá una tarjeta para enfocarla;
        apuntarse es intención, no compromiso.
      </p>
    </div>
  );
}
