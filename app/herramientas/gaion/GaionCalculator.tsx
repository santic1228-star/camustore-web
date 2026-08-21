"use client";

import { useMemo, useState } from "react";
import {
  calcularApertura,
  etiquetaDia,
  mascaraHora,
  mascaraStandby,
  mensajeGaion,
  parseHoraServidor,
  parseStandby,
} from "@/lib/gaion";
import CampoHud from "@/components/ui/CampoHud";

// =====================================================
// Calculador gratis: dos inputs, una suma, un resultado.
// No toca Supabase ni guarda nada. Todo pasa en el celu del jugador.
// =====================================================

export default function GaionCalculator() {
  const [hora, setHora] = useState("");
  const [standby, setStandby] = useState("");
  const [copiado, setCopiado] = useState(false);

  const horaP = useMemo(() => parseHoraServidor(hora), [hora]);
  const standbyP = useMemo(() => parseStandby(standby), [standby]);

  const apertura =
    horaP.seg !== null && standbyP.seg !== null
      ? calcularApertura(horaP.seg, standbyP.seg)
      : null;

  async function copiar() {
    if (!apertura) return;
    try {
      await navigator.clipboard.writeText(mensajeGaion(apertura));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      // Sin clipboard (navegadores viejos): no hacemos nada visible.
    }
  }

  async function compartir() {
    if (!apertura) return;
    const text = mensajeGaion(apertura);
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // Canceló el share: caemos al link de WhatsApp.
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  function limpiar() {
    setHora("");
    setStandby("");
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ============ Panel HUD (imita la parte baja de la captura) ============ */}
      <div className="rounded-lg border border-border-strong bg-[#1c1c24] p-3 sm:p-4 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)]">
        <p className="font-body text-[10px] uppercase tracking-[0.3em] text-text-muted mb-3">
          Copiá los dos números de la captura
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Server (izquierda en la captura) */}
          <CampoHud
            id="gaion-hora"
            etiqueta="Server:"
            tonoEtiqueta="gold"
            valor={hora}
            placeholder="21:45:47"
            maxLength={8}
            onChange={(v) => setHora(mascaraHora(v))}
            estado={horaP.estado}
            ayudaIncompleto="Formato HH:MM:SS"
            ayudaInvalido="Hora inválida (00–23 h, 00–59 min y seg)"
          />

          {/* Standby Time (derecha en la captura) */}
          <CampoHud
            id="gaion-standby"
            etiqueta="Standby Time"
            tonoEtiqueta="green"
            valor={standby}
            placeholder="30:30"
            maxLength={6}
            onChange={(v) => setStandby(mascaraStandby(v))}
            estado={standbyP.estado}
            ayudaIncompleto="Formato MM:SS (o MMM:SS si pasa de 99 min)"
            ayudaInvalido="Segundos inválidos (00–59)"
          />
        </div>
      </div>

      {/* ============ Resultado ============ */}
      <div
        className={`gamer-card rounded-lg p-6 sm:p-8 text-center transition-all ${
          apertura ? "neon-border-cyan animate-pulse-glow" : ""
        }`}
        aria-live="polite"
      >
        <p className="font-body text-xs uppercase tracking-[0.3em] text-text-muted mb-3">
          Gaion abre a las
        </p>

        {apertura ? (
          <>
            <p className="font-numeric font-black text-5xl sm:text-6xl neon-text-cyan tracking-wider tabular-nums">
              {apertura.hms}
            </p>
            <p className="font-body text-sm text-text-secondary mt-3">
              hora servidor ·{" "}
              <span className={apertura.diasExtra > 0 ? "text-neon-orange" : "text-text-secondary"}>
                {etiquetaDia(apertura.diasExtra)}
              </span>
            </p>
            <p className="font-body text-xs text-text-muted mt-1 tabular-nums">
              {hora} + {standby}
            </p>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center mt-6">
              <button
                type="button"
                onClick={copiar}
                className="btn-primary px-5 py-2.5 rounded font-body text-sm uppercase tracking-widest"
              >
                {copiado ? "✓ Copiado" : "Copiar"}
              </button>
              <button
                type="button"
                onClick={compartir}
                className="px-5 py-2.5 rounded font-body text-sm uppercase tracking-widest border border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10 hover:border-neon-cyan transition-colors"
              >
                Compartir
              </button>
              <button
                type="button"
                onClick={limpiar}
                className="px-5 py-2.5 rounded font-body text-sm uppercase tracking-widest text-text-muted hover:text-text-secondary transition-colors"
              >
                Limpiar
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="font-numeric font-bold text-5xl sm:text-6xl text-text-muted/40 tracking-wider tabular-nums select-none">
              --:--:--
            </p>
            <p className="font-body text-sm text-text-muted mt-3">
              Completá los dos campos y el horario aparece solo.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
