"use client";

import { useEffect, useMemo, useState } from "react";
import { FieldLabel, TextInput } from "@/components/ui/FormField";
import { useCfg } from "@/lib/precios-contexto";
import {
  ESTADO_CABECERA_LABEL,
  ESTADO_ITEM_LABEL,
  aprobarItem,
  contarAbiertas,
  eliminarConsignacion,
  fmtWC,
  labelDeItem,
  listarConsignaciones,
  mensajeWhatsappConsignante,
  pagoEstimado,
  precioVaEnDestino,
  rechazarItem,
  sugeridoHoy,
  waLinkConsignante,
  type ConsignacionConItems,
} from "@/lib/consignaciones-admin";
import type { ConsignacionItemRow, ConsignacionRow, EstadoConsignacionV2 } from "@/lib/database.types";

// =====================================================
// Admin · Consignaciones (Fase 3)
// Cada ítem se aprueba o rechaza por separado. Aprobar = publicar de una en
// el catálogo con dueño = personaje del consignante. La cabecera se recalcula
// sola (pendiente / parcial / aprobada / rechazada).
// =====================================================

type Filtro = "abiertas" | "todas";

interface Props {
  /** Avisa al padre para refrescar el badge del tab. */
  onCambio?: (abiertas: number) => void;
}

export default function SeccionConsignaciones({ onCambio }: Props) {
  const [lista, setLista] = useState<ConsignacionConItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("abiertas");

  async function cargar() {
    setLoading(true);
    setError(null);
    try {
      const datos = await listarConsignaciones();
      setLista(datos);
      onCambio?.(await contarAbiertas());
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar las consignaciones.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibles = useMemo(
    () =>
      filtro === "todas"
        ? lista
        : lista.filter((c) => c.cabecera.estado === "pendiente" || c.cabecera.estado === "parcial"),
    [lista, filtro]
  );
  const abiertas = lista.filter((c) => c.cabecera.estado === "pendiente" || c.cabecera.estado === "parcial").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-xl text-text-primary">Consignaciones</h2>
          <p className="font-body text-xs text-text-secondary mt-1">
            Aprobar publica el ítem en la tienda de una, a nombre del jugador. Rechazar lo deja afuera.
            El jugador se lleva su % <span className="text-text-primary">de lo que efectivamente se cobre</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(["abiertas", "todas"] as Filtro[]).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded font-body text-xs uppercase tracking-wider border transition-colors ${
                filtro === f
                  ? "bg-neon-cyan/15 border-neon-cyan/60 text-neon-cyan"
                  : "bg-bg-card border-border-base text-text-secondary hover:border-border-strong"
              }`}
            >
              {f === "abiertas" ? `Abiertas (${abiertas})` : `Todas (${lista.length})`}
            </button>
          ))}
          <button
            onClick={cargar}
            className="px-3 py-1.5 rounded font-body text-xs uppercase tracking-wider border border-border-base text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
          >
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded border border-danger-red/40 bg-danger-red/10 p-3 font-body text-xs text-danger-red">
          {error}
        </div>
      )}

      {loading ? (
        <p className="font-body text-sm text-text-secondary">Cargando…</p>
      ) : visibles.length === 0 ? (
        <div className="gamer-card rounded-lg p-8 text-center">
          <p className="text-3xl mb-2">📥</p>
          <p className="font-display text-base text-text-primary">
            {filtro === "abiertas" ? "No hay consignaciones por revisar" : "Todavía no llegó ninguna consignación"}
          </p>
          <p className="font-body text-xs text-text-secondary mt-1">
            {filtro === "abiertas"
              ? "Cuando un jugador consigne algo, aparece acá."
              : "El formulario público está en /consignar."}
          </p>
        </div>
      ) : (
        visibles.map((c) => (
          <TarjetaConsignacion key={c.cabecera.id} data={c} onCambio={cargar} />
        ))
      )}
    </div>
  );
}

// =====================================================
// Cabecera
// =====================================================

const ESTADO_CAB_CLASE: Record<EstadoConsignacionV2, string> = {
  pendiente: "bg-luck-gold/15 text-luck-gold border-luck-gold/40",
  parcial: "bg-neon-cyan/15 text-neon-cyan border-neon-cyan/40",
  aprobada: "bg-success-green/15 text-success-green border-success-green/40",
  rechazada: "bg-danger-red/15 text-danger-red border-danger-red/40",
};

function TarjetaConsignacion({ data, onCambio }: { data: ConsignacionConItems; onCambio: () => void }) {
  const { cabecera, items } = data;
  const [abierta, setAbierta] = useState(cabecera.estado === "pendiente" || cabecera.estado === "parcial");
  const decididos = items.filter((i) => i.estado !== "pendiente").length;
  const mensaje = mensajeWhatsappConsignante(data);

  async function borrar() {
    if (!confirm(`¿Borrar la consignación de ${cabecera.personaje} con sus ${items.length} ítem(s)? Los ítems ya publicados en la tienda NO se borran.`)) return;
    try {
      await eliminarConsignacion(cabecera.id);
      onCambio();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <section className="gamer-card rounded-lg overflow-hidden">
      <button
        onClick={() => setAbierta((v) => !v)}
        className="w-full text-left p-4 sm:p-5 flex flex-wrap items-center gap-x-4 gap-y-2 hover:bg-bg-card-hover/40 transition-colors"
      >
        <span className={`badge border ${ESTADO_CAB_CLASE[cabecera.estado]}`}>
          {ESTADO_CABECERA_LABEL[cabecera.estado]}
        </span>
        <span className="font-display font-bold text-base text-text-primary">{cabecera.personaje}</span>
        <span className="font-body text-xs text-text-secondary">
          {items.length} ítem{items.length === 1 ? "" : "s"} · {decididos} decidido{decididos === 1 ? "" : "s"}
        </span>
        <span className="font-body text-xs text-text-muted ml-auto">
          {new Date(cabecera.created_at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
        </span>
        <span className="text-text-muted text-xs">{abierta ? "▲" : "▼"}</span>
      </button>

      {abierta && (
        <div className="border-t border-border-base px-4 sm:px-5 pb-5 pt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3 font-body text-xs">
            <a
              href={waLinkConsignante(cabecera.whatsapp, `Hola ${cabecera.personaje}! Te escribo de CamuStore por tu consignación.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-success-green hover:underline"
            >
              📱 +{cabecera.whatsapp.replace(/\D/g, "")}
            </a>
            <span className="text-text-muted">·</span>
            <span className="text-text-muted">N° {cabecera.id.slice(0, 8)}</span>
            {cabecera.revisado_at && (
              <>
                <span className="text-text-muted">·</span>
                <span className="text-text-muted">
                  revisada {new Date(cabecera.revisado_at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                </span>
              </>
            )}
          </div>
          {cabecera.notas && (
            <p className="font-body text-xs text-text-secondary border-l-2 border-border-strong pl-3 whitespace-pre-wrap">
              {cabecera.notas}
            </p>
          )}

          <div className="space-y-3">
            {items.map((it) => (
              <FilaItem key={it.id} item={it} cabecera={cabecera} onCambio={onCambio} />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border-base/60">
            <a
              href={waLinkConsignante(cabecera.whatsapp, mensaje)}
              target="_blank"
              rel="noopener noreferrer"
              className={`btn-whatsapp px-4 py-2 rounded font-body text-xs uppercase tracking-widest ${
                decididos === 0 ? "opacity-40 pointer-events-none" : ""
              }`}
              title={decididos === 0 ? "Decidí al menos un ítem para armar el resumen" : "Abre WhatsApp con el resumen de lo decidido"}
            >
              Avisarle por WhatsApp
            </a>
            <button
              onClick={borrar}
              className="px-2 py-1 rounded font-body text-xs text-text-muted hover:text-danger-red transition-colors"
              title="Borra la consignación (no los ítems ya publicados)"
            >
              Borrar consignación
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// =====================================================
// Ítem
// =====================================================

const CATEGORIA_LABEL: Record<string, string> = {
  armadura: "Armadura",
  arma: "Arma",
  escudo: "Escudo",
  ala: "Alas",
  joya: "Joyería",
  jewel: "Jewel",
  seed: "Seed",
  gema: "Gema",
};

function FilaItem({
  item,
  cabecera,
  onCambio,
}: {
  item: ConsignacionItemRow;
  cabecera: ConsignacionRow;
  onCambio: () => void;
}) {
  const cfg = useCfg();
  const hoy = useMemo(() => sugeridoHoy(item, cfg), [item, cfg]);
  const enDestino = precioVaEnDestino(item.categoria);

  const [precio, setPrecio] = useState(String(item.precio_aprobado ?? item.precio_sugerido));
  const [comision, setComision] = useState(String(item.comision_pct));
  const [motivo, setMotivo] = useState("");
  const [rechazando, setRechazando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const precioNum = Math.round(Number(precio) || 0);
  const comisionNum = Math.round(Number(comision) || 0);
  const valido = precioNum > 0 && comisionNum >= 0 && comisionNum <= 100;
  const pago = valido ? pagoEstimado(precioNum, comisionNum) : null;

  async function aprobar() {
    if (!valido) return;
    setGuardando(true);
    setError(null);
    try {
      await aprobarItem(item, cabecera, precioNum, comisionNum);
      onCambio();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGuardando(false);
    }
  }

  async function rechazar() {
    setGuardando(true);
    setError(null);
    try {
      await rechazarItem(item, motivo);
      onCambio();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGuardando(false);
    }
  }

  const label = labelDeItem(item);
  const decidido = item.estado !== "pendiente";

  return (
    <div
      className={`rounded border p-3 sm:p-4 ${
        item.estado === "aprobado"
          ? "border-success-green/30 bg-success-green/5"
          : item.estado === "rechazado"
          ? "border-danger-red/30 bg-danger-red/5"
          : "border-border-base bg-bg-deep/40"
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="badge bg-bg-card text-text-secondary border border-border-base">
          {CATEGORIA_LABEL[item.categoria] ?? item.categoria}
        </span>
        <span className="font-body font-bold text-sm text-text-primary">{label}</span>
        <span
          className={`badge border ml-auto ${
            item.estado === "aprobado"
              ? "bg-success-green/15 text-success-green border-success-green/40"
              : item.estado === "rechazado"
              ? "bg-danger-red/15 text-danger-red border-danger-red/40"
              : "bg-luck-gold/15 text-luck-gold border-luck-gold/40"
          }`}
        >
          {ESTADO_ITEM_LABEL[item.estado]}
        </span>
      </div>

      {/* Sugerido guardado vs hoy */}
      <div className="mt-2 font-body text-xs text-text-secondary flex flex-wrap gap-x-4 gap-y-1">
        <span>
          Sugerido al consignar: <span className="font-numeric text-text-primary">{fmtWC(item.precio_sugerido)}</span>
        </span>
        {hoy === null ? (
          <span className="text-danger-red">Con las reglas de hoy no cotiza</span>
        ) : hoy !== item.precio_sugerido ? (
          <span>
            Con las reglas de hoy: <span className="font-numeric text-neon-orange">{fmtWC(hoy)}</span>
          </span>
        ) : null}
      </div>

      {decidido ? (
        <div className="mt-2 font-body text-xs text-text-secondary space-y-1">
          {item.estado === "aprobado" && (
            <p>
              Publicado a{" "}
              <span className="font-numeric text-text-primary">{fmtWC(item.precio_aprobado ?? item.precio_sugerido)}</span>
              {" · "}
              comisión {item.comision_pct}% · el jugador se lleva{" "}
              <span className="font-numeric text-success-green">
                ≈ {fmtWC(pagoEstimado(item.precio_aprobado ?? item.precio_sugerido, item.comision_pct))}
              </span>{" "}
              (sobre lo que se cobre)
              {item.item_creado_id && <span className="text-text-muted"> · id {item.item_creado_id.slice(0, 8)}</span>}
            </p>
          )}
          {item.estado === "rechazado" && (
            <p>Motivo: {item.motivo_rechazo || <span className="text-text-muted">sin motivo</span>}</p>
          )}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_1.4fr] gap-3 items-end">
            <div>
              <FieldLabel>Precio de venta aprobado</FieldLabel>
              <TextInput value={precio} onChange={setPrecio} type="number" min={0} />
              {!enDestino && (
                <p className="font-body text-[11px] text-text-muted mt-1">
                  Se publica al precio de lista vigente; este valor queda para la liquidación.
                </p>
              )}
            </div>
            <div>
              <FieldLabel>Comisión CamuStore (%)</FieldLabel>
              <TextInput value={comision} onChange={setComision} type="number" min={0} max={100} />
            </div>
            <div className="col-span-2 sm:col-span-1 font-body text-xs text-text-secondary">
              {pago === null ? (
                <span className="text-danger-red">Revisá precio y comisión.</span>
              ) : (
                <>
                  El jugador se lleva <span className="font-numeric text-success-green">≈ {fmtWC(pago)}</span>{" "}
                  ({100 - comisionNum}%) · CamuStore{" "}
                  <span className="font-numeric text-text-primary">{fmtWC(precioNum - pago)}</span>
                  <span className="text-text-muted"> — sobre lo que se cobre al final</span>
                </>
              )}
            </div>
          </div>

          {rechazando && (
            <div>
              <FieldLabel>Motivo (opcional, se lo mandás al jugador)</FieldLabel>
              <TextInput value={motivo} onChange={setMotivo} placeholder="Ej: sin luck no lo tomo" />
            </div>
          )}

          {error && (
            <div className="rounded border border-danger-red/40 bg-danger-red/10 p-2 font-body text-xs text-danger-red">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {rechazando ? (
              <>
                <button
                  onClick={rechazar}
                  disabled={guardando}
                  className="px-4 py-2 rounded font-body text-xs uppercase tracking-wider border border-danger-red/60 text-danger-red hover:bg-danger-red/10 disabled:opacity-50 transition-colors"
                >
                  {guardando ? "Rechazando…" : "Confirmar rechazo"}
                </button>
                <button
                  onClick={() => setRechazando(false)}
                  disabled={guardando}
                  className="px-3 py-2 rounded font-body text-xs uppercase tracking-wider text-text-secondary hover:text-text-primary"
                >
                  Volver
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={aprobar}
                  disabled={!valido || guardando}
                  className="btn-primary px-4 py-2 rounded font-body text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  {guardando ? "Publicando…" : "Aprobar y publicar"}
                </button>
                <button
                  onClick={() => setRechazando(true)}
                  disabled={guardando}
                  className="px-4 py-2 rounded font-body text-xs uppercase tracking-wider border border-border-base text-text-secondary hover:border-danger-red/50 hover:text-danger-red transition-colors"
                >
                  Rechazar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
