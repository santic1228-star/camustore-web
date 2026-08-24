"use client";

import { useMemo, useState } from "react";
import { FieldLabel, TextInput } from "@/components/ui/FormField";
import FormArmadura from "./FormArmadura";
import FormArma from "./FormArma";
import { FormAla, FormEscudo } from "./FormEscudoAla";
import FormJoya from "./FormJoya";
import { FormGema, FormJewel, FormSeed } from "./FormConsumibles";
import { COMISION_PCT } from "./PanelAgregar";
import { calcularDesgloseConsignante, labelLinea, type LineaConsignacion } from "@/lib/consignacion";
import { supabase } from "@/lib/supabase";
import { CONFIG, whatsappLink } from "@/lib/config";
import type { CategoriaConsig } from "@/lib/database.types";

interface LineaLote {
  key: number;
  linea: LineaConsignacion;
  precioVenta: number;
}

const CATEGORIAS: { id: CategoriaConsig; label: string; icon: string }[] = [
  { id: "armadura", label: "Armadura", icon: "🛡" },
  { id: "arma", label: "Arma", icon: "⚔" },
  { id: "escudo", label: "Escudo", icon: "🔰" },
  { id: "ala", label: "Alas", icon: "🪽" },
  { id: "joya", label: "Joyería", icon: "💍" },
  { id: "jewel", label: "Jewels", icon: "💎" },
  { id: "seed", label: "Seeds", icon: "🌱" },
  { id: "gema", label: "Gemas y otros", icon: "🔮" },
];

/** UUID v4: nativo si está, fallback para navegadores viejos. */
function genUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function ConsignarClient() {
  // ---------- Datos del consignante ----------
  const [personaje, setPersonaje] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [notas, setNotas] = useState("");

  // ---------- Lote ----------
  const [cat, setCat] = useState<CategoriaConsig>("armadura");
  const [lote, setLote] = useState<LineaLote[]>([]);
  const [nextKey, setNextKey] = useState(1);

  // ---------- Envío ----------
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviadaId, setEnviadaId] = useState<string | null>(null);
  const [loteEnviado, setLoteEnviado] = useState<LineaLote[]>([]);
  // Si la cabecera se creó pero los ítems fallaron, el reintento no duplica.
  const [cabeceraId, setCabeceraId] = useState<string | null>(null);

  const waDigits = whatsapp.replace(/\D/g, "");
  const personajeOk = personaje.trim().length >= 2;
  const waOk = waDigits.length >= 8 && waDigits.length <= 15;
  const puedeEnviar = personajeOk && waOk && lote.length > 0 && !enviando;

  const totales = useMemo(() => {
    let venta = 0;
    let comision = 0;
    let pago = 0;
    for (const l of lote) {
      const d = calcularDesgloseConsignante(l.precioVenta, COMISION_PCT);
      venta += d.precioVenta;
      comision += d.comisionTienda;
      pago += d.pagoConsignante;
    }
    return { venta, comision, pago };
  }, [lote]);

  function agregarLinea(linea: LineaConsignacion, precioVenta: number) {
    setLote((prev) => [...prev, { key: nextKey, linea, precioVenta }]);
    setNextKey((k) => k + 1);
  }

  function quitarLinea(key: number) {
    setLote((prev) => prev.filter((l) => l.key !== key));
  }

  async function enviar() {
    if (!puedeEnviar) return;
    setEnviando(true);
    setError(null);
    try {
      let id = cabeceraId;
      if (!id) {
        id = genUuid();
        const { error: e1 } = await supabase.from("consignaciones").insert({
          id,
          personaje: personaje.trim(),
          whatsapp: waDigits,
          notas: notas.trim() || null,
        });
        if (e1) throw new Error("No se pudo crear la consignación. Esperá un momento y probá de nuevo.");
        setCabeceraId(id);
      }

      const payload = lote.map((l) => ({
        consignacion_id: id as string,
        categoria: l.linea.categoria,
        atributos: l.linea.atributos,
        precio_sugerido: l.precioVenta,
      }));
      const { error: e2 } = await supabase.from("consignaciones_items").insert(payload);
      if (e2) throw new Error('Se creó la consignación pero falló la carga de los ítems. Tocá "Enviar" de nuevo para reintentar.');

      setLoteEnviado(lote);
      setEnviadaId(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar. Probá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  function resetear() {
    setPersonaje("");
    setWhatsapp("");
    setNotas("");
    setLote([]);
    setLoteEnviado([]);
    setEnviadaId(null);
    setCabeceraId(null);
    setError(null);
    setCat("armadura");
  }

  // =====================================================
  // Pantalla de confirmación
  // =====================================================
  if (enviadaId) {
    const nro = enviadaId.slice(0, 8).toUpperCase();
    let totalVenta = 0;
    let totalPago = 0;
    for (const l of loteEnviado) {
      const d = calcularDesgloseConsignante(l.precioVenta, COMISION_PCT);
      totalVenta += d.precioVenta;
      totalPago += d.pagoConsignante;
    }

    const msg = [
      `${CONFIG.WHATSAPP_GREETING} Te mandé una consignación 📦`,
      `N°: ${nro}`,
      `Personaje: ${personaje.trim()}`,
      ...loteEnviado.map(
        (l) => `• ${labelLinea(l.linea)} — venta sugerida ${l.precioVenta.toLocaleString("es-AR")} ${CONFIG.CURRENCY}`,
      ),
      `Total sugerido: ${totalVenta.toLocaleString("es-AR")} ${CONFIG.CURRENCY} · Mi parte (${100 - COMISION_PCT}%): ${totalPago.toLocaleString("es-AR")} ${CONFIG.CURRENCY}`,
    ].join("\n");

    return (
      <div className="gamer-card rounded-lg p-6 sm:p-8 text-center">
        <p className="text-5xl mb-4" aria-hidden>✅</p>
        <h2 className="font-display font-bold text-2xl sm:text-3xl text-text-primary">
          ¡Consignación enviada!
        </h2>
        <p className="font-body text-sm text-text-secondary mt-2">
          N° <span className="font-numeric font-bold text-neon-cyan">{nro}</span> · Personaje{" "}
          <span className="text-text-primary">{personaje.trim()}</span>
        </p>

        <div className="mt-6 text-left rounded-lg border border-border-base bg-bg-card/50 p-4 space-y-2">
          {loteEnviado.map((l) => (
            <div key={l.key} className="flex justify-between gap-3 font-body text-sm">
              <span className="text-text-secondary">{labelLinea(l.linea)}</span>
              <span className="font-numeric text-text-primary tabular-nums whitespace-nowrap">
                {l.precioVenta.toLocaleString("es-AR")} {CONFIG.CURRENCY}
              </span>
            </div>
          ))}
          <div className="flex justify-between gap-3 font-body text-sm border-t border-border-base pt-2">
            <span className="text-text-primary font-bold">Te llevás ({100 - COMISION_PCT}%)</span>
            <span className="font-numeric font-bold text-success-green tabular-nums whitespace-nowrap">
              {totalPago.toLocaleString("es-AR")} {CONFIG.CURRENCY}
            </span>
          </div>
        </div>

        <p className="font-body text-xs text-text-muted mt-4 leading-relaxed">
          Camus revisa ítem por ítem y te contacta por WhatsApp para coordinar la entrega. Los
          precios son sugeridos y pueden variar por promociones.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <a
            href={whatsappLink(msg)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp px-6 py-3 rounded font-body text-sm uppercase tracking-widest"
          >
            Avisarle a Camus por WhatsApp
          </a>
          <button
            type="button"
            onClick={resetear}
            className="px-6 py-3 rounded font-body text-sm uppercase tracking-widest border border-border-strong text-text-secondary hover:text-neon-cyan hover:border-neon-cyan/60 transition-colors"
          >
            Cargar otra consignación
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // Form principal
  // =====================================================
  return (
    <div className="space-y-6">
      {/* ============ 1. Datos ============ */}
      <section className="gamer-card rounded-lg p-5 sm:p-6">
        <h2 className="font-display font-bold text-xl text-text-primary mb-4">
          <span className="neon-text-cyan">1.</span> Tus datos
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Nombre de tu personaje</FieldLabel>
            <TextInput value={personaje} onChange={setPersonaje} placeholder="CamusDoge" />
          </div>
          <div>
            <FieldLabel>Tu WhatsApp</FieldLabel>
            <TextInput value={whatsapp} onChange={setWhatsapp} placeholder="3515153481" />
            <p className="text-[10px] font-body text-text-muted mt-1.5">
              Con característica, sin 0 ni 15. Camus te contacta ahí.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <FieldLabel>Notas (opcional)</FieldLabel>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Algo que quieras aclarar sobre tus items…"
            rows={2}
            className="w-full bg-bg-card border border-border-base focus:border-neon-cyan rounded px-3 py-2.5 font-body text-sm text-text-primary outline-none transition-colors resize-none"
          />
        </div>
      </section>

      {/* ============ 2. Ítems ============ */}
      <section className="gamer-card rounded-lg p-5 sm:p-6">
        <h2 className="font-display font-bold text-xl text-text-primary mb-1">
          <span className="neon-text-cyan">2.</span> Agregá tus ítems
        </h2>
        <p className="font-body text-xs text-text-secondary mb-4">
          Solo se consigna lo que la tienda compra: si un ítem no cotiza, ahí te decimos por qué.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {CATEGORIAS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              className={`px-3 py-2.5 rounded font-body text-xs uppercase tracking-wider border transition-colors ${
                cat === c.id
                  ? "bg-neon-cyan/15 border-neon-cyan/60 text-neon-cyan"
                  : "bg-bg-card border-border-base text-text-secondary hover:border-border-strong"
              }`}
            >
              <span aria-hidden>{c.icon}</span> {c.label}
            </button>
          ))}
        </div>

        {cat === "armadura" && <FormArmadura onAgregar={agregarLinea} />}
        {cat === "arma" && <FormArma onAgregar={agregarLinea} />}
        {cat === "escudo" && <FormEscudo onAgregar={agregarLinea} />}
        {cat === "ala" && <FormAla onAgregar={agregarLinea} />}
        {cat === "joya" && <FormJoya onAgregar={agregarLinea} />}
        {cat === "jewel" && <FormJewel onAgregar={agregarLinea} />}
        {cat === "seed" && <FormSeed onAgregar={agregarLinea} />}
        {cat === "gema" && <FormGema onAgregar={agregarLinea} />}
      </section>

      {/* ============ 3. Lote + envío ============ */}
      <section className="gamer-card rounded-lg p-5 sm:p-6">
        <h2 className="font-display font-bold text-xl text-text-primary mb-4">
          <span className="neon-text-cyan">3.</span> Tu lote{" "}
          <span className="font-numeric text-base text-text-secondary">({lote.length})</span>
        </h2>

        {lote.length === 0 ? (
          <p className="font-body text-sm text-text-muted">
            Todavía no agregaste ítems. Armalos arriba y tocá &quot;+ Agregar al lote&quot;.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {lote.map((l) => {
                const d = calcularDesgloseConsignante(l.precioVenta, COMISION_PCT);
                const catInfo = CATEGORIAS.find((c) => c.id === l.linea.categoria);
                return (
                  <div
                    key={l.key}
                    className="flex items-center gap-3 rounded border border-border-base bg-bg-card/50 px-3 py-2.5"
                  >
                    <span className="text-lg select-none" aria-hidden>
                      {catInfo?.icon ?? "•"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-body text-sm text-text-primary truncate">{labelLinea(l.linea)}</p>
                      <p className="font-body text-[11px] text-text-muted">
                        Venta sugerida{" "}
                        <span className="font-numeric text-text-secondary tabular-nums">
                          {d.precioVenta.toLocaleString("es-AR")} {CONFIG.CURRENCY}
                        </span>{" "}
                        · te llevás{" "}
                        <span className="font-numeric text-success-green tabular-nums">
                          {d.pagoConsignante.toLocaleString("es-AR")} {CONFIG.CURRENCY}
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => quitarLinea(l.key)}
                      aria-label={`Quitar ${labelLinea(l.linea)}`}
                      className="shrink-0 w-8 h-8 rounded border border-border-base text-text-muted hover:text-neon-orange hover:border-neon-orange/60 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-lg border border-border-strong bg-bg-card/70 p-4 space-y-1.5 font-body text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-text-secondary">Total venta sugerida</span>
                <span className="font-numeric text-text-primary tabular-nums whitespace-nowrap">
                  {totales.venta.toLocaleString("es-AR")} {CONFIG.CURRENCY}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-text-secondary">Comisión CamuStore ({COMISION_PCT}%)</span>
                <span className="font-numeric text-neon-orange tabular-nums whitespace-nowrap">
                  −{totales.comision.toLocaleString("es-AR")} {CONFIG.CURRENCY}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-t border-border-base pt-1.5">
                <span className="text-text-primary font-bold">Te llevás ({100 - COMISION_PCT}%)</span>
                <span className="font-numeric font-bold text-success-green text-base tabular-nums whitespace-nowrap">
                  {totales.pago.toLocaleString("es-AR")} {CONFIG.CURRENCY}
                </span>
              </div>
            </div>
          </>
        )}

        {(!personajeOk || !waOk) && lote.length > 0 && (
          <p className="font-body text-xs text-neon-orange mt-4">
            {!personajeOk
              ? "Falta el nombre de tu personaje (arriba, en Tus datos)."
              : "Falta tu WhatsApp (arriba, en Tus datos) para que Camus te contacte."}
          </p>
        )}

        {error && (
          <p className="font-body text-sm text-neon-orange mt-4 rounded border border-neon-orange/40 bg-neon-orange/5 px-3 py-2.5">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={enviar}
          disabled={!puedeEnviar}
          className={`w-full mt-5 px-5 py-3.5 rounded font-body text-sm uppercase tracking-widest transition-all ${
            puedeEnviar
              ? "btn-primary"
              : "bg-bg-card border border-border-base text-text-muted cursor-not-allowed"
          }`}
        >
          {enviando
            ? "Enviando…"
            : `Enviar consignación${lote.length > 0 ? ` (${lote.length} ítem${lote.length === 1 ? "" : "s"})` : ""}`}
        </button>

        <p className="font-body text-[10px] text-text-muted mt-3 leading-relaxed text-center">
          Los precios son sugeridos y pueden variar por promociones. Camus revisa cada ítem y puede
          aprobar, ajustar o rechazar por separado.
        </p>
      </section>
    </div>
  );
}
