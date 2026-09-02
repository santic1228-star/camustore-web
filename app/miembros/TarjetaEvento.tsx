"use client";

import { useMemo, useState } from "react";
import CampoHud from "@/components/ui/CampoHud";
import { mascaraHora, parseHoraServidor } from "@/lib/tiempo";
import { mascaraStandby, parseStandby } from "@/lib/gaion";
import {
  MOTIVOS_PELEA,
  epochDesdeHoraServidor,
  etiquetaDiaServidor,
  fechaCortaServidor,
  hmServidor,
  mensajeRegistro,
  nuevoRegistroBoss,
  nuevoRegistroGaion,
  textoFaltaRegistro,
  textoHace,
  textoSePelea,
  vistaDeRegistro,
  type EventoConfig,
  type RegistroNuevo,
} from "@/lib/registros";
import { apuntarse, desapuntarse, insertarRegistro, type MapaAvatares, type SesionMiembro } from "@/lib/miembros";
import AvatarRaza from "@/components/ui/AvatarRaza";
import type { AsistenciaRow, EventoRegistroRow, MotivoPelea, Raza } from "@/lib/database.types";

// =====================================================
// Una tarjeta por evento (Gaion / Kundun / Cryonox):
//   arriba, el registro vigente que cargó alguien de la guild, en vivo;
//   abajo, el form para cargar uno nuevo (lo ven todos al instante).
// =====================================================

interface Props {
  config: EventoConfig;
  registro: EventoRegistroRow | undefined;
  /** Epoch ms del reloj del dispositivo; null hasta hidratar. */
  ahora: number | null;
  sesion: SesionMiembro;
  /** Apuntados al registro vigente (27/08). */
  asistencias: AsistenciaRow[];
  /** Avatar del logueado, para el snapshot al apuntarse. */
  miRaza: Raza | null;
  /** email → foto de avatar de cada miembro (M4, 31/08). */
  avatares?: MapaAvatares;
  onGuardado: () => void;
  onCambioAsistencia: () => void;
}

export default function TarjetaEvento({
  config, registro, ahora, sesion, asistencias, miRaza, avatares = {}, onGuardado, onCambioAsistencia,
}: Props) {
  const esGaion = config.tipo === "gaion";
  const [formAbierto, setFormAbierto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // ---------- Estado del registro vigente ----------
  const vista = useMemo(() => {
    if (!registro || ahora === null) return null;
    return vistaDeRegistro(config, registro, ahora);
  }, [registro, ahora, config]);

  const mostrarForm = formAbierto || !registro;

  const extras = {
    sePelea: registro?.se_pelea ?? false,
    sePeleaMotivo: registro?.se_pelea_motivo ?? null,
    van: asistencias.map((a) => a.personaje),
  };
  const yoVoy = asistencias.some((a) => a.email === sesion.email);
  const [cambiandoAsis, setCambiandoAsis] = useState(false);
  const [errorAsis, setErrorAsis] = useState<string | null>(null);

  async function toggleVoy() {
    if (!registro) return;
    setCambiandoAsis(true);
    setErrorAsis(null);
    try {
      if (yoVoy) await desapuntarse(registro.id, sesion.email);
      else await apuntarse(registro.id, sesion, miRaza);
      onCambioAsistencia();
    } catch (e) {
      setErrorAsis(e instanceof Error ? e.message : String(e));
    } finally {
      setCambiandoAsis(false);
    }
  }

  async function copiar() {
    if (!vista) return;
    try {
      await navigator.clipboard.writeText(mensajeRegistro(config, vista.estado, extras));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      // sin clipboard
    }
  }

  async function compartir() {
    if (!vista) return;
    const text = mensajeRegistro(config, vista.estado, extras);
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // canceló
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  const aviso = vista?.estado.aviso ?? null;
  const borde =
    aviso === 5
      ? "border-neon-orange shadow-[0_0_25px_rgba(255,107,53,0.35)]"
      : aviso === 15
        ? "neon-border-cyan"
        : "";

  return (
    <section
      className={`gamer-card rounded-lg p-4 sm:p-6 transition-all ${borde}`}
      aria-labelledby={`ev-${config.tipo}-titulo`}
    >
      {/* ============ Cabecera ============ */}
      <header className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-3xl leading-none select-none" aria-hidden>
            {config.icono}
          </span>
          <div className="min-w-0">
            <h2
              id={`ev-${config.tipo}-titulo`}
              className="font-display font-bold text-2xl sm:text-3xl text-text-primary leading-none"
            >
              {config.nombre}
            </h2>
            <p className="font-body text-xs text-text-secondary mt-1 truncate">{config.detalle}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
        {registro?.se_pelea && !vista?.desconocido && (
          <span
            className="badge whitespace-nowrap border bg-danger-red/15 text-danger-red border-danger-red/50"
            title="Creemos que otros guilds saben el horario"
          >
            {textoSePelea(registro.se_pelea_motivo)}
          </span>
        )}
        {aviso !== null && (
          <span
            className={`badge whitespace-nowrap animate-pulse border ${
              aviso === 5
                ? "bg-neon-orange/20 text-neon-orange border-neon-orange/60"
                : "bg-neon-cyan/15 text-neon-cyan border-neon-cyan/50"
            }`}
          >
            ⚠ en menos de {aviso} min
          </span>
        )}
        </div>
      </header>

      {/* ============ Registro vigente ============ */}
      <div className="text-center" aria-live="polite">
        <p className="font-body text-xs uppercase tracking-[0.3em] text-text-muted mb-2">
          {vista?.desconocido ? `${config.nombre} · próxima apertura` : `${config.nombre} ${config.etiquetaResultado}`}
        </p>

        {vista && registro && vista.desconocido ? (
          <>
            <p className="font-numeric font-black text-5xl sm:text-6xl tracking-wider tabular-nums text-text-muted/40 select-none">
              ??:??:??
            </p>
            <p className="font-body font-bold text-xl sm:text-2xl text-neon-orange mt-3">
              Horario desconocido
            </p>
            <p className="font-body text-sm text-text-secondary mt-2">
              Última apertura conocida:{" "}
              <span className="font-numeric text-text-primary tabular-nums">{hmServidor(vista.estado.resultadoMs)}</span>
              {vista.estado.diasExtra !== 0 && (
                <span className="text-text-muted"> ({fechaCortaServidor(vista.estado.resultadoMs)})</span>
              )}
              {ahora !== null && <> · abrió {textoHace(vista.estado.resultadoMs, ahora)}</>}
            </p>
            <p className="font-body text-xs text-text-muted mt-3 max-w-md mx-auto">
              El cooldown de 2 hs corre desde que el evento <span className="text-text-secondary">termina</span>, así
              que la próxima apertura no se puede calcular. Cargá la captura del fin del evento y la ven todos.
            </p>
            <p className="font-body text-[11px] text-text-muted mt-4">
              Cargó <span className="text-text-secondary">{registro.cargado_por_personaje}</span>{" "}
              {ahora !== null && textoHace(Date.parse(registro.created_at), ahora)}
            </p>
            <div className="flex justify-center mt-4">
              <button
                type="button"
                onClick={() => setFormAbierto((v) => !v)}
                className={`px-4 py-2 rounded font-body text-xs uppercase tracking-widest transition-colors ${
                  formAbierto ? "text-text-muted hover:text-text-secondary" : "btn-primary"
                }`}
              >
                {formAbierto ? "Cancelar" : "Cargar nueva"}
              </button>
            </div>
          </>
        ) : vista && registro ? (
          <>
            <p
              className={`font-numeric font-black text-5xl sm:text-6xl tracking-wider tabular-nums ${
                vista.estado.vencido
                  ? "text-text-muted"
                  : vista.estado.listo
                    ? "text-text-secondary"
                    : aviso === 5
                      ? "neon-text-orange"
                      : "neon-text-cyan"
              }`}
            >
              {vista.estado.hms}
            </p>
            <p className="font-body text-sm text-text-secondary mt-2">
              hora servidor ·{" "}
              <span className={vista.estado.diasExtra !== 0 ? "text-neon-orange" : "text-text-secondary"}>
                {etiquetaDiaServidor(vista.estado.diasExtra)}
              </span>
              {vista.estado.diasExtra !== 0 && (
                <span className="text-text-muted"> ({fechaCortaServidor(vista.estado.resultadoMs)})</span>
              )}
            </p>

            <p
              className={`font-numeric font-bold text-xl sm:text-2xl tabular-nums mt-3 ${
                vista.estado.vencido
                  ? "text-text-muted"
                  : vista.estado.listo
                    ? "text-neon-orange"
                    : "text-success-green"
              }`}
            >
              {textoFaltaRegistro(vista.estado, esGaion ? "Abrió" : "Respawneó")}
            </p>

            {vista.estado.vencido && (
              <p className="font-body text-xs text-neon-orange mt-2">
                Dato viejo (más de un día). Si alguien lo mató, cargá la hora nueva.
              </p>
            )}

            {/* Quién cargó */}
            <p className="font-body text-[11px] text-text-muted mt-4">
              Cargó <span className="text-text-secondary">{registro.cargado_por_personaje}</span>{" "}
              {ahora !== null && textoHace(Date.parse(registro.created_at), ahora)}
              {esGaion && (
                <> · captura de las {hmServidor(Date.parse(registro.hora_evento))}</>
              )}
              {!esGaion && (
                <>
                  {" "}· murió a las {hmServidor(Date.parse(registro.hora_evento))} del{" "}
                  {fechaCortaServidor(Date.parse(registro.hora_evento))}
                </>
              )}
            </p>

            {/* ============ Apuntados (27/08) ============ */}
            {!vista.estado.vencido && (
              <div className="mt-4 rounded-lg border border-border-base bg-bg-deep/40 p-3">
                {asistencias.length === 0 ? (
                  <p className="font-body text-xs text-text-muted">Nadie se apuntó todavía.</p>
                ) : (
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
                    <span className="font-body text-xs uppercase tracking-[0.25em] text-text-muted">
                      {asistencias.length === 1 ? "Va" : "Van"}
                    </span>
                    {asistencias.map((a) => (
                      <span
                        key={a.id}
                        className={`inline-flex items-center gap-1.5 font-body text-sm ${
                          a.email === sesion.email ? "text-neon-cyan" : "text-text-primary"
                        }`}
                      >
                        <AvatarRaza raza={a.raza} src={avatares[a.email.toLowerCase()] ?? null} size={22} />
                        {a.personaje}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-center gap-3 mt-2.5">
                  <button
                    type="button"
                    onClick={toggleVoy}
                    disabled={cambiandoAsis}
                    className={`px-4 py-1.5 rounded font-body text-xs uppercase tracking-widest border transition-colors disabled:opacity-50 ${
                      yoVoy
                        ? "bg-success-green/15 text-success-green border-success-green/50 hover:bg-danger-red/10 hover:text-danger-red hover:border-danger-red/50"
                        : "border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10"
                    }`}
                    title={yoVoy ? "Click para bajarte" : "Un click y te ven apuntado"}
                  >
                    {cambiandoAsis ? "…" : yoVoy ? "✓ Voy" : "Me apunto"}
                  </button>
                </div>
                {errorAsis && <p className="font-body text-xs text-danger-red mt-2">{errorAsis}</p>}
                <p className="font-body text-[11px] text-text-muted mt-2">
                  Apuntarse es intención, no compromiso: alguno puede no llegar.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center mt-4">
              <button
                type="button"
                onClick={copiar}
                className="px-4 py-2 rounded font-body text-xs uppercase tracking-widest border border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10 hover:border-neon-cyan transition-colors"
              >
                {copiado ? "✓ Copiado" : "Copiar"}
              </button>
              <button
                type="button"
                onClick={compartir}
                className="px-4 py-2 rounded font-body text-xs uppercase tracking-widest border border-border-strong text-text-secondary hover:text-neon-cyan hover:border-neon-cyan/60 transition-colors"
              >
                Compartir
              </button>
              <button
                type="button"
                onClick={() => setFormAbierto((v) => !v)}
                className={`px-4 py-2 rounded font-body text-xs uppercase tracking-widest transition-colors ${
                  formAbierto
                    ? "text-text-muted hover:text-text-secondary"
                    : "btn-primary"
                }`}
              >
                {formAbierto ? "Cancelar" : "Cargar nueva"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="font-numeric font-bold text-5xl sm:text-6xl text-text-muted/40 tracking-wider tabular-nums select-none">
              --:--:--
            </p>
            <p className="font-body text-sm text-text-muted mt-2">
              {ahora === null ? "Cargando…" : "Nadie cargó nada todavía. Sé el primero."}
            </p>
          </>
        )}
      </div>

      {/* ============ Form de carga ============ */}
      {mostrarForm && ahora !== null && (
        <div className="mt-5 pt-5 border-t border-border-base">
          {esGaion ? (
            <FormGaion sesion={sesion} config={config} onGuardado={() => { setFormAbierto(false); onGuardado(); }} />
          ) : (
            <FormBoss sesion={sesion} config={config} onGuardado={() => { setFormAbierto(false); onGuardado(); }} />
          )}
        </div>
      )}
    </section>
  );
}

// =====================================================
// Guardar (común)
// =====================================================

function useGuardar(sesion: SesionMiembro, config: EventoConfig, onGuardado: () => void) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(nuevo: RegistroNuevo) {
    setGuardando(true);
    setError(null);
    try {
      await insertarRegistro({
        tipo: config.tipo,
        hora_evento: new Date(nuevo.horaEventoMs).toISOString(),
        standby_seg: nuevo.standbySeg,
        resultado_at: new Date(nuevo.resultadoMs).toISOString(),
        miembro_id: sesion.miembro?.id ?? null,
        cargado_por_email: sesion.email,
        cargado_por_personaje: sesion.personaje,
        se_pelea: nuevo.sePelea ?? false,
        se_pelea_motivo: nuevo.sePelea ? (nuevo.sePeleaMotivo ?? "otro") : null,
      });
      onGuardado();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  return { guardar, guardando, error };
}

interface FormProps {
  sesion: SesionMiembro;
  config: EventoConfig;
  onGuardado: () => void;
}

// =====================================================
// "Se pelea" (27/08): checkbox + motivo, compartido por los dos forms
// =====================================================

interface EstadoPelea {
  sePelea: boolean;
  motivo: MotivoPelea;
}

function usePelea(): [EstadoPelea, (p: EstadoPelea) => void] {
  return useState<EstadoPelea>({ sePelea: false, motivo: "nos_vieron" });
}

function CampoPelea({ valor, onChange }: { valor: EstadoPelea; onChange: (p: EstadoPelea) => void }) {
  return (
    <div className="rounded-lg border border-border-base bg-bg-deep/40 p-3 space-y-2">
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={valor.sePelea}
          onChange={(e) => onChange({ ...valor, sePelea: e.target.checked })}
          className="w-4 h-4 accent-[#ff3366]"
        />
        <span className="font-body text-sm text-text-primary">
          ⚔ <span className="font-bold">Se pelea</span>
          <span className="text-text-muted"> · creemos que otros guilds saben el horario</span>
        </span>
      </label>
      {valor.sePelea && (
        <div className="flex flex-wrap gap-2 pl-6">
          {MOTIVOS_PELEA.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => onChange({ ...valor, motivo: m.value })}
              className={`px-2.5 py-1 rounded font-body text-xs border transition-colors ${
                valor.motivo === m.value
                  ? "bg-danger-red/15 text-danger-red border-danger-red/50"
                  : "border-border-base text-text-secondary hover:border-border-strong"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================================
// Form boss: hora de la muerte (HH:MM) o "Lo acabo de matar"
// =====================================================

function FormBoss({ sesion, config, onGuardado }: FormProps) {
  const [hora, setHora] = useState("");
  const horaP = useMemo(() => parseHoraServidor(hora), [hora]);
  const { guardar, guardando, error } = useGuardar(sesion, config, onGuardado);
  const [pelea, setPelea] = usePelea();
  const conPelea = (r: RegistroNuevo): RegistroNuevo => ({ ...r, sePelea: pelea.sePelea, sePeleaMotivo: pelea.motivo });

  function guardarTipeada() {
    if (horaP.seg === null) return;
    const muerteMs = epochDesdeHoraServidor(horaP.seg, Date.now());
    guardar(conPelea(nuevoRegistroBoss(config, muerteMs)));
  }

  function guardarAhora() {
    guardar(conPelea(nuevoRegistroBoss(config, Date.now())));
  }

  return (
    <div className="space-y-3">
      <p className="font-body text-xs uppercase tracking-[0.3em] text-text-muted">
        Cargar la muerte · lo ven todos
      </p>
      <CampoPelea valor={pelea} onChange={setPelea} />
      <button
        type="button"
        onClick={guardarAhora}
        disabled={guardando}
        className="btn-primary w-full px-5 py-3 rounded font-body text-sm uppercase tracking-widest disabled:opacity-50"
      >
        {guardando ? "Guardando…" : `💀 ${config.botonAhora} (ahora)`}
      </button>
      <p className="font-body text-[11px] text-text-muted text-center">o si fue hace un rato, cargá la hora Server:</p>
      <div className="rounded-lg border border-border-strong bg-[#1c1c24] p-3 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)]">
        <CampoHud
          id={`ev-${config.tipo}-hora`}
          etiqueta={config.etiquetaHecho}
          tonoEtiqueta="gold"
          valor={hora}
          placeholder="21:45"
          maxLength={8}
          onChange={(v) => setHora(mascaraHora(v))}
          estado={horaP.estado}
          ayudaIncompleto="Formato HH:MM (los segundos son opcionales)"
          ayudaInvalido="Hora inválida (00–23 h, 00–59 min y seg)"
          ayudaNormal="Hora servidor · con HH:MM alcanza · si esa hora todavía no llegó hoy, se toma como ayer"
        />
      </div>
      <button
        type="button"
        onClick={guardarTipeada}
        disabled={horaP.seg === null || guardando}
        className="w-full px-5 py-2.5 rounded font-body text-sm uppercase tracking-widest border border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10 hover:border-neon-cyan transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Guardar esa hora
      </button>
      {error && <p className="font-body text-xs text-danger-red">{error}</p>}
    </div>
  );
}

// =====================================================
// Form Gaion: hora Server + Standby de la captura
// =====================================================

function FormGaion({ sesion, config, onGuardado }: FormProps) {
  const [hora, setHora] = useState("");
  const [standby, setStandby] = useState("");
  const horaP = useMemo(() => parseHoraServidor(hora), [hora]);
  const standbyP = useMemo(() => parseStandby(standby), [standby]);
  const { guardar, guardando, error } = useGuardar(sesion, config, onGuardado);
  const [pelea, setPelea] = usePelea();

  const listo = horaP.seg !== null && standbyP.seg !== null;

  // Vista previa de la apertura antes de guardar.
  const preview = useMemo(() => {
    if (horaP.seg === null || standbyP.seg === null) return null;
    const capturaMs = epochDesdeHoraServidor(horaP.seg, Date.now());
    return nuevoRegistroGaion(capturaMs, standbyP.seg);
  }, [horaP.seg, standbyP.seg]);

  function guardarCaptura() {
    if (!preview) return;
    guardar({ ...preview, sePelea: pelea.sePelea, sePeleaMotivo: pelea.motivo });
  }

  return (
    <div className="space-y-3">
      <p className="font-body text-xs uppercase tracking-[0.3em] text-text-muted">
        Cargar la captura del fin del Gaion · lo ven todos
      </p>
      <div className="rounded-lg border border-border-strong bg-[#1c1c24] p-3 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] space-y-3">
        <CampoHud
          id="ev-gaion-hora"
          etiqueta="Server:"
          tonoEtiqueta="gold"
          valor={hora}
          placeholder="21:45:47"
          maxLength={8}
          onChange={(v) => setHora(mascaraHora(v))}
          estado={horaP.estado}
          ayudaIncompleto="Formato HH:MM:SS"
          ayudaInvalido="Hora inválida (00–23 h, 00–59 min y seg)"
          ayudaNormal="La hora Server que muestra la captura"
        />
        <CampoHud
          id="ev-gaion-standby"
          etiqueta="Standby Time"
          tonoEtiqueta="green"
          valor={standby}
          placeholder="30:30"
          maxLength={6}
          onChange={(v) => setStandby(mascaraStandby(v))}
          estado={standbyP.estado}
          ayudaIncompleto="Formato MM:SS (o MMM:SS si pasa de 99 min)"
          ayudaInvalido="Segundos inválidos (00–59)"
          ayudaNormal="El Standby Time de la captura · ignorá el número entre paréntesis"
        />
      </div>
      <CampoPelea valor={pelea} onChange={setPelea} />
      {preview && (
        <p className="font-body text-xs text-text-secondary text-center">
          Se guarda: abre a las{" "}
          <span className="font-numeric text-neon-cyan">{hmServidor(preview.resultadoMs)}</span> hora servidor
        </p>
      )}
      <button
        type="button"
        onClick={guardarCaptura}
        disabled={!listo || guardando}
        className="btn-primary w-full px-5 py-3 rounded font-body text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {guardando ? "Guardando…" : "Guardar para todos"}
      </button>
      {error && <p className="font-body text-xs text-danger-red">{error}</p>}
    </div>
  );
}
