"use client";

import { useEffect, useMemo, useState } from "react";
import CampoHud from "@/components/ui/CampoHud";
import { mascaraHora, parseHoraServidor } from "@/lib/tiempo";
import {
  calcularRespawn,
  etiquetaDiaBoss,
  mensajeBoss,
  textoFalta,
  type BossConfig,
} from "@/lib/bosses";

// =====================================================
// Timer gratis de un boss: un input (hora servidor de la muerte),
// el respawn en grande y cuánto falta en vivo.
// No toca Supabase ni guarda nada. El "cuánto falta" usa el reloj del celu.
// =====================================================

interface Props {
  boss: BossConfig;
}

export default function BossTimer({ boss }: Props) {
  const [hora, setHora] = useState("");
  const [copiado, setCopiado] = useState(false);
  // null hasta que monta en el cliente: evita diferencias servidor/cliente al hidratar.
  const [ahora, setAhora] = useState<number | null>(null);

  const horaP = useMemo(() => parseHoraServidor(hora), [hora]);

  // Tick de 1 segundo solo mientras hay algo que mostrar.
  useEffect(() => {
    if (horaP.seg === null) return;
    setAhora(Date.now());
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [horaP.seg]);

  const respawn =
    horaP.seg !== null && ahora !== null
      ? calcularRespawn(horaP.seg, boss.cooldownHs, ahora)
      : null;

  async function copiar() {
    if (!respawn) return;
    try {
      await navigator.clipboard.writeText(mensajeBoss(boss, respawn));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      // Sin clipboard (navegadores viejos): no hacemos nada visible.
    }
  }

  async function compartir() {
    if (!respawn) return;
    const text = mensajeBoss(boss, respawn);
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
  }

  const idCampo = `boss-${boss.id}-hora`;

  return (
    <section
      className={`gamer-card rounded-lg p-4 sm:p-6 transition-all ${
        respawn && !respawn.listo ? "neon-border-cyan" : ""
      }`}
      aria-labelledby={`boss-${boss.id}-titulo`}
    >
      {/* ============ Cabecera del boss ============ */}
      <header className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-3xl leading-none select-none" aria-hidden>
            {boss.icono}
          </span>
          <div className="min-w-0">
            <h2
              id={`boss-${boss.id}-titulo`}
              className="font-display font-bold text-2xl sm:text-3xl text-text-primary leading-none"
            >
              {boss.nombre}
            </h2>
            <p className="font-body text-xs text-text-secondary mt-1 truncate">
              {boss.mapa} · {boss.requisito}
            </p>
          </div>
        </div>
        <span className="badge bg-neon-orange/15 text-neon-orange border border-neon-orange/40 whitespace-nowrap">
          Respawn {boss.cooldownHs} hs
        </span>
      </header>

      {/* ============ Input estilo HUD ============ */}
      <div className="rounded-lg border border-border-strong bg-[#1c1c24] p-3 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)]">
        <CampoHud
          id={idCampo}
          etiqueta="Murió a las"
          tonoEtiqueta="gold"
          valor={hora}
          placeholder="21:45"
          maxLength={8}
          onChange={(v) => setHora(mascaraHora(v))}
          estado={horaP.estado}
          ayudaIncompleto="Formato HH:MM (los segundos son opcionales)"
          ayudaInvalido="Hora inválida (00–23 h, 00–59 min y seg)"
          ayudaNormal="Hora servidor en que lo mataron · con HH:MM alcanza"
        />
      </div>

      {/* ============ Resultado ============ */}
      <div className="mt-4 text-center" aria-live="polite">
        <p className="font-body text-xs uppercase tracking-[0.3em] text-text-muted mb-2">
          {boss.nombre} respawnea a las
        </p>

        {respawn ? (
          <>
            <p
              className={`font-numeric font-black text-5xl sm:text-6xl tracking-wider tabular-nums ${
                respawn.listo ? "text-text-secondary" : "neon-text-cyan"
              }`}
            >
              {respawn.hms}
            </p>
            <p className="font-body text-sm text-text-secondary mt-2">
              hora servidor ·{" "}
              <span className={respawn.diasExtra !== 0 ? "text-neon-orange" : "text-text-secondary"}>
                {etiquetaDiaBoss(respawn.diasExtra)}
              </span>
            </p>

            {/* Cuánto falta, en vivo */}
            <p
              className={`font-numeric font-bold text-xl sm:text-2xl tabular-nums mt-3 ${
                respawn.listo ? "text-neon-orange" : "text-success-green"
              }`}
            >
              {textoFalta(respawn)}
            </p>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center mt-5">
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
            <p className="font-body text-sm text-text-muted mt-2">
              Cargá la hora en que murió y el horario aparece solo.
            </p>
          </>
        )}
      </div>

      <p className="font-body text-[11px] text-text-muted mt-4 text-center">
        Drop: <span className="text-text-secondary">{boss.drop}</span>
      </p>
    </section>
  );
}
