"use client";

/**
 * Panel de precios del admin.
 *
 * Las pestañas y los campos NO están escritos a mano: se generan desde
 * `lib/precios-esquema.ts`. Agregar un coeficiente nuevo es sumarlo a
 * `ConfigPrecios`, a los defaults y al esquema; esta pantalla lo dibuja sola.
 *
 * Guardar inserta una fila nueva en `config_precios` (append-only): queda
 * historial completo y "volver atrás" es un click.
 */

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { FieldLabel, PillToggle, TextInput } from "@/components/ui/FormField";
import { useConfigPrecios } from "@/lib/precios-contexto";
import {
  CONFIG_PRECIOS_DEFAULT,
  estadoHotSale,
  isoAInputServidor,
  inputServidorAIso,
  type ConfigPrecios,
} from "@/lib/precios-config";
import {
  GRUPOS_PRECIOS,
  escribirPath,
  leerPath,
  type CampoConfig,
  type GrupoConfig,
} from "@/lib/precios-esquema";
import { filasPreview } from "@/lib/precios-preview";
import { configDeFila, guardarConfig, listarHistorial, restaurarConfig } from "@/lib/config-precios";
import type { ConfigPreciosRow } from "@/lib/database.types";

export default function SeccionPrecios({ user }: { user: User }) {
  const { cfg, cargando, filaVigente, recargar } = useConfigPrecios();

  const [borrador, setBorrador] = useState<ConfigPrecios>(cfg);
  const [tocado, setTocado] = useState(false);
  const [grupoId, setGrupoId] = useState<string>(GRUPOS_PRECIOS[0].id);
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [historial, setHistorial] = useState<ConfigPreciosRow[]>([]);
  const [verHistorial, setVerHistorial] = useState(false);
  const [ahora, setAhora] = useState<number | null>(null);

  // El reloj arranca en el cliente (si no, la hidratación no coincide).
  useEffect(() => {
    setAhora(Date.now());
    const id = setInterval(() => setAhora(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Mientras no haya cambios sin guardar, el borrador sigue a la config vigente.
  useEffect(() => {
    if (!tocado) setBorrador(cfg);
  }, [cfg, tocado]);

  const grupo = useMemo(
    () => GRUPOS_PRECIOS.find((g) => g.id === grupoId) ?? GRUPOS_PRECIOS[0],
    [grupoId]
  );

  const hayCambios = useMemo(
    () => JSON.stringify(borrador) !== JSON.stringify(cfg),
    [borrador, cfg]
  );

  const preview = useMemo(() => filasPreview(borrador, ahora ?? 0), [borrador, ahora]);
  const estadoPromo = useMemo(
    () => estadoHotSale(borrador, ahora ?? 0),
    [borrador, ahora]
  );

  function cambiar(path: string, valor: unknown) {
    setTocado(true);
    setBorrador((b) => escribirPath(b, path, valor));
    setAviso(null);
  }

  async function guardar() {
    setGuardando(true);
    setError(null);
    setAviso(null);
    const r = await guardarConfig(borrador, user.email || "admin", nota);
    setGuardando(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setNota("");
    setTocado(false);
    setAviso("Precios guardados. Ya están vivos en toda la tienda.");
    await recargar();
    if (verHistorial) await cargarHistorial();
  }

  function descartar() {
    setBorrador(cfg);
    setTocado(false);
    setError(null);
    setAviso(null);
  }

  function volverADefaults() {
    if (!confirm("¿Volver a los valores originales de la tienda? Vas a poder revisarlos antes de guardar.")) return;
    setTocado(true);
    setBorrador(CONFIG_PRECIOS_DEFAULT);
  }

  async function cargarHistorial() {
    const r = await listarHistorial(20);
    if (r.error) setError(r.error);
    else setHistorial(r.filas);
  }

  async function abrirHistorial() {
    const abrir = !verHistorial;
    setVerHistorial(abrir);
    if (abrir) await cargarHistorial();
  }

  async function restaurar(fila: ConfigPreciosRow) {
    const fecha = new Date(fila.created_at).toLocaleString("es-AR");
    if (!confirm(`¿Volver a la configuración del ${fecha}? Se guarda como un cambio nuevo; no se borra nada.`)) return;
    setGuardando(true);
    const r = await restaurarConfig(fila, user.email || "admin");
    setGuardando(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setTocado(false);
    setAviso(`Volvimos a la configuración del ${fecha}.`);
    await recargar();
    await cargarHistorial();
  }

  return (
    <div className="space-y-6">
      {/* ============ ESTADO DE LA PROMO ============ */}
      <BannerPromo estado={estadoPromo} cfg={borrador} />

      {/* ============ AVISOS ============ */}
      {error && (
        <div className="rounded border border-danger-red/50 bg-danger-red/10 p-3">
          <p className="font-body text-sm text-danger-red font-bold mb-1">No se pudo guardar</p>
          <p className="font-body text-xs text-text-secondary break-words">Detalle técnico: {error}</p>
        </div>
      )}
      {aviso && (
        <div className="rounded border border-success-green/50 bg-success-green/10 p-3">
          <p className="font-body text-sm text-success-green">{aviso}</p>
        </div>
      )}
      {cargando && (
        <p className="font-body text-xs text-text-muted">Buscando la configuración vigente…</p>
      )}
      {!cargando && !filaVigente && (
        <p className="font-body text-xs text-text-muted">
          Todavía no guardaste ninguna configuración: la tienda está usando los valores originales.
        </p>
      )}

      {/* ============ PESTAÑAS ============ */}
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {GRUPOS_PRECIOS.map((g) => (
          <button
            key={g.id}
            onClick={() => setGrupoId(g.id)}
            className={`shrink-0 px-3 py-2 rounded font-body text-xs uppercase tracking-wider transition-colors ${
              grupoId === g.id
                ? "bg-neon-cyan/15 border border-neon-cyan/60 text-neon-cyan"
                : "bg-bg-card border border-border-base text-text-secondary hover:border-border-strong hover:text-text-primary"
            }`}
          >
            <span className="mr-1.5">{g.icono}</span>
            {g.titulo}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-start">
        {/* ============ CAMPOS DEL GRUPO ============ */}
        <div className="gamer-card rounded-lg p-4 sm:p-5 space-y-4">
          <CabeceraGrupo grupo={grupo} />

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {grupo.campos.map((campo) => (
              <Campo
                key={campo.path}
                campo={campo}
                valor={leerPath(borrador, campo.path)}
                onChange={(v) => cambiar(campo.path, v)}
              />
            ))}
          </div>
        </div>

        {/* ============ VISTA PREVIA ============ */}
        <div className="gamer-card rounded-lg p-4 sm:p-5 lg:w-[26rem] lg:sticky lg:top-24">
          <p className="font-display font-bold text-sm text-text-primary mb-1">Cómo quedan los precios</p>
          <p className="font-body text-[11px] text-text-muted mb-3">
            Se recalcula mientras editás. Todavía no guardaste nada.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full font-numeric text-[11px]">
              <thead>
                <tr className="text-text-muted font-body uppercase tracking-wider text-[9px] text-right">
                  <th className="text-left pb-2">Caso</th>
                  <th className="pb-2 px-1">Pagás</th>
                  <th className="pb-2 px-1">Vendés</th>
                  <th className="pb-2 pl-1">Margen</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((f) => (
                  <tr key={f.label} className="border-t border-border-base">
                    <td className="py-1.5 pr-2 font-body text-[10px] text-text-secondary leading-tight">
                      {f.label}
                    </td>
                    <td className="py-1.5 px-1 text-right text-text-secondary">
                      {f.compra?.toLocaleString("es-AR") ?? "—"}
                    </td>
                    <td className="py-1.5 px-1 text-right">
                      {f.ventaFinal !== null && f.venta !== null && f.ventaFinal < f.venta ? (
                        <>
                          <span className="text-text-muted line-through mr-1">
                            {f.venta.toLocaleString("es-AR")}
                          </span>
                          <span className="text-danger-red font-bold">
                            {f.ventaFinal.toLocaleString("es-AR")}
                          </span>
                        </>
                      ) : (
                        <span className="text-neon-orange font-bold">
                          {f.venta?.toLocaleString("es-AR") ?? "no se compra"}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 pl-1 text-right text-text-muted">
                      {f.margen ? `${f.margen}×` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="font-body text-[10px] text-text-muted mt-3 leading-relaxed">
            &quot;Pagás&quot; es lo que le das al jugador; &quot;vendés&quot;, lo que cobra la tienda.
            Si un caso dice &quot;no se compra&quot;, algún requisito lo está bloqueando.
          </p>
        </div>
      </div>

      {/* ============ GUARDAR ============ */}
      <div className="gamer-card rounded-lg p-4 sm:p-5 space-y-3">
        <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
          <div>
            <FieldLabel>Nota del cambio (opcional)</FieldLabel>
            <TextInput
              value={nota}
              onChange={setNota}
              placeholder="Ej: hot sale de fin de semana"
            />
          </div>
          <div className="flex gap-2">
            {hayCambios && (
              <button
                onClick={descartar}
                disabled={guardando}
                className="px-4 py-3 rounded font-body text-xs uppercase tracking-widest text-text-secondary border border-border-base hover:border-danger-red/50 hover:text-danger-red transition-colors disabled:opacity-40"
              >
                Descartar
              </button>
            )}
            <button
              onClick={guardar}
              disabled={!hayCambios || guardando}
              className="btn-primary px-6 py-3 rounded font-body text-xs uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {guardando ? "Guardando…" : hayCambios ? "Guardar y aplicar" : "Sin cambios"}
            </button>
          </div>
        </div>

        {hayCambios && (
          <p className="font-body text-xs text-luck-gold">
            Tenés cambios sin guardar. La tienda todavía muestra los precios anteriores.
          </p>
        )}

        <div className="flex flex-wrap gap-3 pt-2 border-t border-border-base">
          <button
            onClick={abrirHistorial}
            className="font-body text-xs text-neon-cyan hover:underline"
          >
            {verHistorial ? "Ocultar historial" : "Ver historial de cambios"}
          </button>
          <button
            onClick={volverADefaults}
            className="font-body text-xs text-text-muted hover:text-text-primary hover:underline"
          >
            Volver a los valores originales
          </button>
        </div>

        {verHistorial && (
          <div className="pt-2">
            {historial.length === 0 ? (
              <p className="font-body text-xs text-text-muted">Todavía no hay cambios guardados.</p>
            ) : (
              <table className="w-full font-body text-xs">
                <thead>
                  <tr className="text-text-muted uppercase tracking-wider text-[10px] text-left">
                    <th className="pb-2">Cuándo</th>
                    <th className="pb-2">Quién</th>
                    <th className="pb-2">Nota</th>
                    <th className="pb-2 text-right">Promo</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((f, i) => {
                    const c = configDeFila(f);
                    return (
                      <tr key={f.id} className="border-t border-border-base">
                        <td className="py-2 pr-3 text-text-secondary whitespace-nowrap">
                          {new Date(f.created_at).toLocaleString("es-AR")}
                          {i === 0 && (
                            <span className="badge ml-2 bg-success-green/15 text-success-green border border-success-green/40">
                              vigente
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-text-muted break-all">{f.creado_por_email}</td>
                        <td className="py-2 pr-3 text-text-secondary">{f.nota || "—"}</td>
                        <td className="py-2 pr-3 text-right font-numeric">
                          {c.hotSale.activo ? `−${c.hotSale.pctGlobal}%` : "—"}
                        </td>
                        <td className="py-2 text-right">
                          {i !== 0 && (
                            <button
                              onClick={() => restaurar(f)}
                              disabled={guardando}
                              className="text-neon-cyan hover:underline disabled:opacity-40"
                            >
                              Volver a esta
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// Banner con el estado del hot sale
// =====================================================

function BannerPromo({
  estado,
  cfg,
}: {
  estado: ReturnType<typeof estadoHotSale>;
  cfg: ConfigPrecios;
}) {
  if (estado.vigente) {
    return (
      <div className="rounded-lg border border-danger-red/50 bg-danger-red/10 p-4">
        <p className="font-display font-bold text-base text-danger-red">
          🔥 {estado.etiqueta} corriendo · −{cfg.hotSale.pctGlobal}% general
        </p>
        <p className="font-body text-xs text-text-secondary mt-1">
          Los clientes están viendo los precios con descuento.
          {cfg.hotSale.hasta
            ? ` Se apaga solo el ${new Date(cfg.hotSale.hasta).toLocaleString("es-AR")}.`
            : " No tiene fecha de fin: se apaga cuando vos lo apagues."}
        </p>
      </div>
    );
  }

  const textos: Record<string, string> = {
    apagado: "El hot sale está apagado. La tienda muestra los precios de lista.",
    todavia_no: `Programado: arranca el ${cfg.hotSale.desde ? new Date(cfg.hotSale.desde).toLocaleString("es-AR") : "—"}. Todavía no se ve.`,
    ya_termino: `Ya terminó (${cfg.hotSale.hasta ? new Date(cfg.hotSale.hasta).toLocaleString("es-AR") : "—"}). Los precios volvieron solos a la normalidad.`,
    sin_descuento: "El hot sale está prendido pero el descuento es 0%: no cambia ningún precio.",
  };

  return (
    <div className="rounded-lg border border-border-base bg-bg-card p-4">
      <p className="font-body text-sm text-text-secondary">
        {textos[estado.motivo ?? "apagado"]}
      </p>
    </div>
  );
}

// =====================================================
// Cabecera de cada grupo
// =====================================================

function CabeceraGrupo({ grupo }: { grupo: GrupoConfig }) {
  return (
    <div className="space-y-2 pb-3 border-b border-border-base">
      <p className="font-display font-bold text-lg text-text-primary">
        {grupo.icono} {grupo.titulo}
      </p>
      {grupo.descripcion && (
        <p className="font-body text-xs text-text-secondary leading-relaxed">{grupo.descripcion}</p>
      )}
      {grupo.advertencia && (
        <p className="font-body text-xs text-danger-red leading-relaxed border border-danger-red/40 bg-danger-red/10 rounded p-2">
          ⚠ {grupo.advertencia}
        </p>
      )}
      {grupo.snapshot && (
        <p className="font-body text-xs text-luck-gold leading-relaxed border border-luck-gold/40 bg-luck-gold/10 rounded p-2">
          Ojo: los items de estas categorías guardan su precio al cargarse. Cambiar esto afecta
          las cotizaciones y las cargas nuevas, pero <strong>no mueve el stock que ya está publicado</strong>.
        </p>
      )}
    </div>
  );
}

// =====================================================
// Un campo, según su tipo
// =====================================================

function Campo({
  campo,
  valor,
  onChange,
}: {
  campo: CampoConfig;
  valor: unknown;
  onChange: (v: unknown) => void;
}) {
  return (
    <div>
      <FieldLabel>{campo.label}</FieldLabel>
      <EditorCampo campo={campo} valor={valor} onChange={onChange} />
      {campo.ayuda && (
        <p className="font-body text-[10px] text-text-muted mt-1 leading-snug">{campo.ayuda}</p>
      )}
    </div>
  );
}

function EditorCampo({
  campo,
  valor,
  onChange,
}: {
  campo: CampoConfig;
  valor: unknown;
  onChange: (v: unknown) => void;
}) {
  if (campo.tipo === "bool") {
    return <PillToggle value={Boolean(valor)} onChange={(v) => onChange(v)} />;
  }

  if (campo.tipo === "texto") {
    return <TextInput value={typeof valor === "string" ? valor : ""} onChange={(v) => onChange(v)} />;
  }

  if (campo.tipo === "fecha") {
    return (
      <input
        type="datetime-local"
        value={isoAInputServidor(typeof valor === "string" ? valor : null)}
        onChange={(e) => onChange(inputServidorAIso(e.target.value))}
        className="w-full bg-bg-card border border-border-base rounded px-3 py-2.5 font-numeric text-sm text-text-primary focus:border-neon-cyan focus:outline-none"
      />
    );
  }

  return <CampoNumero campo={campo} valor={valor} onChange={onChange} />;
}

/**
 * Input numérico con texto local: así se puede tipear "0." o "-" sin que el
 * valor salte mientras escribís.
 */
function CampoNumero({
  campo,
  valor,
  onChange,
}: {
  campo: CampoConfig;
  valor: unknown;
  onChange: (v: unknown) => void;
}) {
  const opcional = campo.tipo === "pct_opcional";
  const valorTexto = typeof valor === "number" ? String(valor) : "";
  const [texto, setTexto] = useState(valorTexto);

  // Si el valor cambia desde afuera (descartar, restaurar), el input lo sigue.
  useEffect(() => {
    setTexto(typeof valor === "number" ? String(valor) : "");
  }, [valor]);

  const sufijo =
    campo.tipo === "pct" || campo.tipo === "pct_opcional" ? "%"
    : campo.tipo === "mult" ? "×"
    : campo.tipo === "wc" ? "WC"
    : "";

  function alEscribir(t: string) {
    setTexto(t);
    if (t.trim() === "") {
      onChange(opcional ? undefined : 0);
      return;
    }
    const n = Number(t);
    if (!Number.isNaN(n)) onChange(n);
  }

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        value={texto}
        onChange={(e) => alEscribir(e.target.value)}
        placeholder={opcional ? "usa el general" : ""}
        className={`w-full bg-bg-card border border-border-base rounded px-3 py-2.5 font-numeric text-sm text-text-primary focus:border-neon-cyan focus:outline-none ${
          sufijo ? "pr-10" : ""
        }`}
      />
      {sufijo && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-body text-[10px] text-text-muted pointer-events-none">
          {sufijo}
        </span>
      )}
    </div>
  );
}
