"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import {
  cargarAsistencias,
  cargarAvatares,
  cargarRegistros,
  contarAportes,
  eliminarRegistro,
  quitarMiAvatar,
  setMiRaza,
  subirMiAvatar,
  type Aporte,
  type MapaAvatares,
  type RegistrosCargados,
  type SesionMiembro,
} from "@/lib/miembros";
import AvatarRaza, { RAZAS_AVATAR, RAZA_AVATAR_LABEL } from "@/components/ui/AvatarRaza";
import RecorteAvatar from "@/components/ui/RecorteAvatar";
import { AVATAR_PX } from "@/lib/avatar-imagen";
import type { AsistenciaRow, Raza } from "@/lib/database.types";
import {
  AVISOS_MIN,
  EVENTOS,
  eventoPorTipo,
  fechaCortaServidor,
  hmServidor,
  textoHace,
  textoSePelea,
  vistaDeRegistro,
} from "@/lib/registros";
import {
  avisosActivados,
  desbloquearSonido,
  guardarAvisos,
  notificar,
  pedirPermisoNotificaciones,
  permisoNotificaciones,
  sonarAviso,
  vibrar,
} from "@/lib/avisos";
import TarjetaEvento from "./TarjetaEvento";
import TimelineMiembros from "./TimelineMiembros";

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
  const [aportes, setAportes] = useState<Aporte[] | null>(null);
  /** Apuntados por registro_id, solo de los registros vigentes (27/08). */
  const [asistencias, setAsistencias] = useState<Record<string, AsistenciaRow[]>>({});
  /** Avatar del logueado (se edita acá y se refleja al apuntarse). */
  const [miRaza, setMiRazaLocal] = useState<Raza | null>(sesion.miembro?.raza ?? null);
  const [guardandoRaza, setGuardandoRaza] = useState(false);
  const [errorRaza, setErrorRaza] = useState<string | null>(null);
  /** Foto de avatar propia (M4, 31/08). */
  const [miAvatarUrl, setMiAvatarUrl] = useState<string | null>(sesion.miembro?.avatar_url ?? null);
  /** email → foto de cada miembro, para pintar apuntados. Se recarga junto con los registros. */
  const [avatares, setAvatares] = useState<MapaAvatares>({});
  /** Archivo elegido y todavía sin encuadrar (abre el modal de recorte). */
  const [archivoAvatar, setArchivoAvatar] = useState<File | null>(null);
  const [quitandoAvatar, setQuitandoAvatar] = useState(false);
  const [errorAvatar, setErrorAvatar] = useState<string | null>(null);
  const inputAvatarRef = useRef<HTMLInputElement>(null);
  const [avisosOn, setAvisosOn] = useState(false);
  const [permisoNotif, setPermisoNotif] = useState<string>("default");
  /**
   * Colapsable "Eventos de horario no público" (reorden 31/08, DECISIONES §13).
   * Arranca PLEGADO siempre (Santi, 31/08): con el "Me apunto" ya en los verdes de
   * la timeline, las tarjetas quedan solo para la carga. La regla previa "abierto si
   * hay aviso activo" queda SUPERADA el mismo día.
   */
  const [noPublicoAbierto, setNoPublicoAbierto] = useState(false);
  /** Colapsable "Tu avatar" (al final de la página). Arranca plegado. */
  const [avatarAbierto, setAvatarAbierto] = useState(false);
  /**
   * La timeline también se pliega (Santi, 31/08) para llegar al historial, ranking
   * y avatar sin scrollear todo. Arranca ABIERTA: es la protagonista. Plegada se
   * oculta con CSS (no se desmonta) para no perder el foco ni recargar apuntados.
   */
  const [timelineAbierta, setTimelineAbierta] = useState(true);
  /** Umbrales ya disparados en esta sesión: "tipo:resultadoMs:umbral". */
  const disparadosRef = useRef<Set<string>>(new Set());
  const tituloOriginalRef = useRef<string | null>(null);

  const recargar = useCallback(async () => {
    try {
      const d = await cargarRegistros();
      setDatos(d);
      setError(null);
      setUltimaCarga(Date.now());
      contarAportes().then(setAportes).catch(() => {});
      const ids = Object.values(d.vigentes).map((r) => r.id);
      cargarAsistencias(ids).then(setAsistencias).catch(() => {});
      cargarAvatares().then(setAvatares).catch(() => {});
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

  // Preferencia de avisos guardada.
  useEffect(() => {
    setAvisosOn(avisosActivados());
    setPermisoNotif(permisoNotificaciones());
  }, []);

  async function toggleAvisos() {
    const nuevo = !avisosOn;
    setAvisosOn(nuevo);
    guardarAvisos(nuevo);
    if (nuevo) {
      desbloquearSonido(); // el click desbloquea el audio (y suena un beep de prueba)
      const ok = await pedirPermisoNotificaciones();
      setPermisoNotif(ok ? "granted" : permisoNotificaciones());
    }
  }

  // Disparo de avisos: en cada tick mira los tres eventos y, al cruzar un
  // umbral (15 min · 5 min · momento exacto), avisa UNA vez por umbral.
  useEffect(() => {
    if (ahora === null || !datos) return;
    for (const config of EVENTOS) {
      const registro = datos.vigentes[config.tipo];
      if (!registro) continue;
      const { estado } = vistaDeRegistro(config, registro, ahora);

      // El umbral vigente: el más urgente que aplique.
      let umbral: number | null = null;
      if (estado.listo) {
        if (-estado.faltaSeg <= 120) umbral = 0; // recién abrió/respawneó
      } else {
        for (const m of AVISOS_MIN) {
          if (estado.faltaSeg <= m * 60) umbral = m;
        }
      }
      if (umbral === null) continue;

      const clave = `${config.tipo}:${estado.resultadoMs}:${umbral}`;
      if (disparadosRef.current.has(clave)) continue;
      // Marcar también los umbrales menos urgentes para no encadenar beeps
      // (ej.: si entrás faltando 4 min, suena solo el de 5, no el de 15).
      for (const m of AVISOS_MIN) {
        if (m >= umbral) disparadosRef.current.add(`${config.tipo}:${estado.resultadoMs}:${m}`);
      }
      disparadosRef.current.add(clave);

      if (avisosOn) {
        sonarAviso(umbral);
        vibrar(umbral);
        const titulo = `${config.icono} ${config.nombre}`;
        const cuerpo =
          umbral === 0
            ? `¡${config.tipo === "gaion" ? "Abrió" : "Respawneó"}! (${estado.hms} hora servidor)`
            : `${config.tipo === "gaion" ? "Abre" : "Respawnea"} a las ${estado.hms} hora servidor · faltan ${umbral} min`;
        notificar(titulo, cuerpo, clave);
      }
    }
  }, [ahora, datos, avisosOn]);

  // Título de la pestaña: parpadea con el aviso más urgente cuando estás en otra pestaña.
  useEffect(() => {
    if (ahora === null || !datos) return;
    if (tituloOriginalRef.current === null) tituloOriginalRef.current = document.title;
    const original = tituloOriginalRef.current;

    let masUrgente: { texto: string; falta: number } | null = null;
    for (const config of EVENTOS) {
      const registro = datos.vigentes[config.tipo];
      if (!registro) continue;
      const { estado } = vistaDeRegistro(config, registro, ahora);
      let texto: string | null = null;
      if (estado.listo && -estado.faltaSeg <= 300) {
        texto = `🔥 ¡${config.nombre} AHORA!`;
      } else if (!estado.listo && estado.aviso !== null) {
        texto = `⚠ ${config.nombre} en ${Math.max(1, Math.ceil(estado.faltaSeg / 60))} min`;
      }
      if (texto !== null && (masUrgente === null || estado.faltaSeg < masUrgente.falta)) {
        masUrgente = { texto, falta: estado.faltaSeg };
      }
    }

    if (masUrgente === null || !document.hidden) {
      document.title = original;
      return;
    }
    // Parpadeo: alterna con el tick de 1 s usando la paridad del segundo.
    document.title = Math.floor(ahora / 1000) % 2 === 0 ? masUrgente.texto : original;
    return () => {
      document.title = original;
    };
  }, [ahora, datos]);

  async function elegirRaza(raza: Raza | null) {
    setGuardandoRaza(true);
    setErrorRaza(null);
    try {
      await setMiRaza(raza);
      setMiRazaLocal(raza);
    } catch (e) {
      setErrorRaza(e instanceof Error ? e.message : String(e));
    } finally {
      setGuardandoRaza(false);
    }
  }

  // ============ Foto de avatar (M4, 31/08, DECISIONES §12) ============
  function elegirArchivoAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    e.target.value = ""; // permite volver a elegir el mismo archivo
    setErrorAvatar(null);
    if (f) setArchivoAvatar(f);
  }

  /** Lo llama el modal con la imagen ya recortada a 256×256. */
  async function confirmarAvatar(blob: Blob, extension: "webp" | "jpg") {
    const url = await subirMiAvatar(sesion, blob, extension); // el modal muestra el error si falla
    setMiAvatarUrl(url);
    setAvatares((prev) => ({ ...prev, [sesion.email]: url }));
    setArchivoAvatar(null);
  }

  async function quitarAvatar() {
    setQuitandoAvatar(true);
    setErrorAvatar(null);
    try {
      await quitarMiAvatar(sesion);
      setMiAvatarUrl(null);
      setAvatares((prev) => ({ ...prev, [sesion.email]: null }));
    } catch (e) {
      setErrorAvatar(e instanceof Error ? e.message : String(e));
    } finally {
      setQuitandoAvatar(false);
    }
  }

  // ============ Reorden 31/08 (DECISIONES §13): resumen del título plegado ============
  /** Solo lo que vence en <1 h (o abrió/respawneó hace ≤5 min). */
  const resumenPlegado: string[] = [];
  if (ahora !== null && datos) {
    for (const config of EVENTOS) {
      const registro = datos.vigentes[config.tipo];
      if (!registro) continue;
      const { estado, desconocido } = vistaDeRegistro(config, registro, ahora);
      if (desconocido) continue;
      if (estado.listo) {
        if (-estado.faltaSeg <= 300) resumenPlegado.push(`${config.icono} ¡${config.nombre} ahora!`);
      } else if (estado.faltaSeg < 3600) {
        resumenPlegado.push(
          `${config.icono} ${config.nombre} en ${Math.max(1, Math.ceil(estado.faltaSeg / 60))} min`
        );
      }
    }
  }

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
              Zona de miembros
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

        {/* ============ Avisos ============ */}
        <div className="mb-4 sm:mb-6 rounded-lg border border-border-base bg-bg-card/50 p-3 sm:p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="font-body text-sm text-text-primary">
              🔔 Avisos a los <span className="text-luck-gold font-bold">15</span> y{" "}
              <span className="text-luck-gold font-bold">5</span> min, y al abrir/respawnear
            </p>
            <p className="font-body text-[11px] text-text-muted mt-0.5">
              {avisosOn
                ? permisoNotif === "granted"
                  ? "Sonido ✓ · notificación del sistema ✓ (funciona con la pestaña en segundo plano; con el navegador cerrado no)"
                  : "Sonido ✓ · sin permiso de notificaciones: solo suena con esta pestaña abierta"
                : "Activalos para que suene y te llegue una notificación. La tarjeta y el título de la pestaña avisan igual."}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleAvisos}
            className={`shrink-0 px-4 py-2 rounded font-body text-xs uppercase tracking-widest border transition-colors ${
              avisosOn
                ? "bg-success-green/15 text-success-green border-success-green/50 hover:bg-success-green/25"
                : "border-border-strong text-text-secondary hover:border-neon-cyan hover:text-neon-cyan"
            }`}
          >
            {avisosOn ? "Activados ✓" : "Activar"}
          </button>
        </div>

        {/* ============ Eventos de horario no público (reorden 31/08, §13) ============ */}
        <section className="gamer-card rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setNoPublicoAbierto((v) => !v)}
            aria-expanded={noPublicoAbierto}
            className="w-full text-left p-4 sm:p-5 hover:bg-bg-card/60 transition-colors"
          >
            <span className="flex items-center justify-between gap-3">
              <span className="font-display font-bold text-base text-text-primary">
                🕐 Eventos de horario no público
              </span>
              <span className="shrink-0 text-text-muted" aria-hidden>
                {noPublicoAbierto ? "▾" : "▸"}
              </span>
            </span>
            <span className="block font-body text-[11px] text-text-muted mt-0.5">
              {noPublicoAbierto
                ? "Gaion, Kundun y Cryonox: acá se cargan los registros. En la timeline se ven intercalados."
                : resumenPlegado.length > 0
                  ? <span className="text-luck-gold">{resumenPlegado.join(" · ")}</span>
                  : "Gaion, Kundun y Cryonox · nada por vencer en la próxima hora"}
            </span>
          </button>
          {noPublicoAbierto && (
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4 sm:space-y-6">
              {EVENTOS.map((config) => (
            <TarjetaEvento
              key={config.tipo}
              config={config}
              registro={datos?.vigentes[config.tipo]}
              ahora={datos ? ahora : null}
              sesion={sesion}
              asistencias={(() => {
                const r = datos?.vigentes[config.tipo];
                return r ? asistencias[r.id] ?? [] : [];
              })()}
              miRaza={miRaza}
              avatares={avatares}
                  onGuardado={recargar}
                  onCambioAsistencia={recargar}
                />
              ))}
            </div>
          )}
        </section>

        {/* ============ Timeline de las próximas 24 hs (protagonista, §13; colapsable 31/08) ============ */}
        <section className="mt-8 sm:mt-10 gamer-card rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setTimelineAbierta((v) => !v)}
            aria-expanded={timelineAbierta}
            className="w-full text-left p-5 sm:p-6 hover:bg-bg-card/60 transition-colors"
          >
            <span className="flex items-center justify-between gap-3">
              <span className="font-display font-bold text-base text-text-primary">
                🗓 Timeline · próximas 24 hs
              </span>
              <span className="shrink-0 text-text-muted" aria-hidden>
                {timelineAbierta ? "▾" : "▸"}
              </span>
            </span>
            <span className="block font-body text-xs text-text-secondary mt-1">
              {timelineAbierta
                ? "El calendario completo con los datos de la guild intercalados. Tocá una fila para ver quién va y apuntarte a ese horario puntual."
                : "Plegada · tocá para ver el calendario y los verdes de la guild."}
            </span>
          </button>
          <div className={timelineAbierta ? "px-5 sm:px-6 pb-5 sm:pb-6" : "hidden"}>
            <TimelineMiembros
              sesion={sesion}
              miRaza={miRaza}
              vigentes={datos?.vigentes ?? {}}
              asistenciasRegistros={asistencias}
              avatares={avatares}
              onCambioAsistencia={recargar}
            />
          </div>
        </section>

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
                        {r.se_pelea && (
                          <span className="ml-2 badge bg-danger-red/15 text-danger-red border border-danger-red/40">
                            {textoSePelea(r.se_pelea_motivo)}
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

        {/* ============ Ranking de aportes ============ */}
        <section className="mt-4 gamer-card rounded-lg p-5 sm:p-6">
          <h2 className="font-display font-bold text-base mb-1 text-text-primary">🏆 Ranking de aportes</h2>
          <p className="font-body text-[11px] text-text-muted mb-3">
            Quién compartió más info (registros cargados de Gaion, Kundun y Cryonox, historial completo).
          </p>
          {aportes === null ? (
            <p className="font-body text-sm text-text-muted animate-pulse">Cargando…</p>
          ) : aportes.length === 0 ? (
            <p className="font-body text-sm text-text-muted">Todavía no hay registros. El primero se lleva el 🥇.</p>
          ) : (
            <ol className="space-y-1.5">
              {aportes.slice(0, 10).map((a, i) => {
                const medalla = ["🥇", "🥈", "🥉"][i] ?? null;
                const esYo = a.personaje === sesion.personaje;
                return (
                  <li
                    key={a.personaje}
                    className={`flex items-center gap-3 rounded px-3 py-2 font-body text-sm ${
                      esYo ? "bg-neon-cyan/10 border border-neon-cyan/30" : "bg-bg-card/40"
                    }`}
                  >
                    <span className="w-7 text-center font-numeric text-text-muted">
                      {medalla ?? `${i + 1}º`}
                    </span>
                    <span className={`flex-1 truncate font-bold ${esYo ? "text-neon-cyan" : "text-text-primary"}`}>
                      {a.personaje}
                      {esYo && <span className="font-normal text-text-muted"> (vos)</span>}
                    </span>
                    <span className="font-numeric text-text-secondary tabular-nums">
                      {a.cantidad.toLocaleString("es-AR")}{" "}
                      <span className="text-[11px] text-text-muted">{a.cantidad === 1 ? "registro" : "registros"}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* ============ Tu avatar (colapsable al final, reorden 31/08 §13) ============ */}
        <section className="mt-4 gamer-card rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setAvatarAbierto((v) => !v)}
            aria-expanded={avatarAbierto}
            className="w-full text-left p-4 sm:p-5 hover:bg-bg-card/60 transition-colors"
          >
            <span className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-3 min-w-0">
                <AvatarRaza raza={miRaza} src={miAvatarUrl} size={30} />
                <span className="min-w-0 font-body text-sm text-text-primary">
                  <span className="font-display font-bold">Tu avatar</span>
                  <span className="text-text-muted">
                    {" "}· {sesion.personaje} · {miRaza ? RAZA_AVATAR_LABEL[miRaza] : "sin raza"}
                    {miAvatarUrl ? " · con foto" : ""}
                  </span>
                </span>
              </span>
              <span className="shrink-0 text-text-muted" aria-hidden>
                {avatarAbierto ? "▾" : "▸"}
              </span>
            </span>
          </button>
          {avatarAbierto && (
            <div className="px-4 sm:px-5 pb-4 sm:pb-5">
              {!sesion.miembro && (
                <p className="font-body text-[11px] text-text-muted mb-3">
                  Sos admin sin fila de miembro: agregate desde /admin → Miembros para elegir avatar.
                </p>
              )}

              {/* ---- Foto propia (M4) ---- */}
              {sesion.miembro && (
                <div className="flex items-center gap-4 mb-4">
                  <AvatarRaza raza={miRaza} src={miAvatarUrl} size={72} />
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-[11px] text-text-muted leading-relaxed">
                      {miAvatarUrl
                        ? "Esta es la foto que ven los demás cuando te apuntás. El aro lleva el color de tu raza."
                        : `Subí una foto: se recorta acá, en tu celu, a ${AVATAR_PX}×${AVATAR_PX} (~20 KB). Sin foto se ve el ícono de tu raza.`}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <input
                        ref={inputAvatarRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={elegirArchivoAvatar}
                      />
                      <button
                        type="button"
                        onClick={() => inputAvatarRef.current?.click()}
                        disabled={quitandoAvatar}
                        className="px-3 py-1.5 rounded font-body text-xs uppercase tracking-widest border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10 disabled:opacity-50"
                      >
                        {miAvatarUrl ? "Cambiar foto" : "Subir foto"}
                      </button>
                      {miAvatarUrl && (
                        <button
                          type="button"
                          onClick={quitarAvatar}
                          disabled={quitandoAvatar}
                          className="px-3 py-1.5 rounded font-body text-xs uppercase tracking-widest border border-border-strong text-text-secondary hover:text-danger-red hover:border-danger-red/50 disabled:opacity-50"
                        >
                          {quitandoAvatar ? "Quitando…" : "Quitar foto"}
                        </button>
                      )}
                    </div>
                    {errorAvatar && <p className="font-body text-xs text-danger-red mt-2">{errorAvatar}</p>}
                  </div>
                </div>
              )}

              {sesion.miembro && (
                <p className="font-body text-[11px] text-text-muted mb-2">
                  Tu raza: {miAvatarUrl ? "da el color del aro de tu foto." : "es el ícono que ven los demás cuando te apuntás a un evento."}
                </p>
              )}
              {sesion.miembro && (
                <div className="flex flex-wrap gap-1.5">
                  {RAZAS_AVATAR.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => elegirRaza(r)}
                      disabled={guardandoRaza}
                      title={RAZA_AVATAR_LABEL[r]}
                      className={`rounded-full p-0.5 transition-all disabled:opacity-50 ${
                        miRaza === r ? "ring-2 ring-neon-cyan scale-110" : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      <AvatarRaza raza={r} size={30} />
                    </button>
                  ))}
                </div>
              )}
              {errorRaza && <p className="font-body text-xs text-danger-red mt-2">{errorRaza}</p>}
            </div>
          )}
        </section>

        {archivoAvatar && (
          <RecorteAvatar
            archivo={archivoAvatar}
            raza={miRaza}
            onCancelar={() => setArchivoAvatar(null)}
            onConfirmar={confirmarAvatar}
          />
        )}

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
                El Gaion no se puede adelantar: el cooldown de 2 hs corre desde que el evento{" "}
                <span className="text-text-primary">termina</span> (y el evento dura lo que duren sus stages).
                Pasada la apertura conocida, la tarjeta pasa a{" "}
                <span className="text-neon-orange">Horario desconocido</span> hasta que alguien cargue la
                captura del fin del evento.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-neon-cyan font-bold">·</span>
              <span>
                <span className="text-danger-red">⚔ Se pelea</span> se marca al cargar cuando creemos que otros
                guilds saben el horario (nos vieron entrar, lo perdimos). Con{" "}
                <span className="text-neon-cyan">Me apunto</span> avisás que pensás ir; se ve tu avatar y tu nombre
                debajo del timer. Es intención, no compromiso. Si alguien carga un horario nuevo, hay que apuntarse
                de nuevo.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-neon-cyan font-bold">·</span>
              <span>
                A los <span className="text-text-primary">15</span> y{" "}
                <span className="text-text-primary">5</span> minutos (y al abrir/respawnear) la tarjeta se
                resalta y el título de la pestaña parpadea. Con &quot;Activar&quot; además suena y llega una
                notificación aunque estés en otra pestaña. Con el navegador cerrado no hay aviso (para eso
                vendrá el bot).
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
