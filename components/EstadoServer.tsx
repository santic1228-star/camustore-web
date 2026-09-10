"use client";

import { useEffect, useRef, useState } from "react";
import { etiquetaEstado, haceCuanto, type EstadoServer, type EstadoUI } from "@/lib/server-status";

// =====================================================
// Cartel "Server Status" del header. Lo monta components/Navbar.tsx, así que
// aparece en las 9 páginas que usan la Navbar sin tocar ninguna.
//
// Tres estados, nunca dos: 🟢 ONLINE · 🔴 CAÍDO · ⚪ SIN DATOS.
// El gris es para cuando falla algo NUESTRO (la ruta de API no contesta): un
// cartel que dice ONLINE con el server caído es peor que no tener cartel, y
// uno que dice CAÍDO porque se cayó Vercel es igual de mentiroso.
//
// Pantalla grande (lg+): píldora centrada en el header.
// Celu y tablet: solo el puntito; tocándolo se despliega el texto abajo.
// (El texto completo no entra al medio en pantallas chicas: la nav ya ocupa
//  esa zona y se pisarían.)
// =====================================================

/** Cada cuánto le volvemos a preguntar a nuestra API. */
const REFRESCO_MS = 60_000;

/** Cada cuánto recalculamos el "hace X min" (no pide nada a la red). */
const TICK_MS = 30_000;

export default function EstadoServer() {
  const [estado, setEstado] = useState<EstadoUI>("cargando");
  const [desde, setDesde] = useState<string | null>(null);
  const [ahora, setAhora] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const cajaRef = useRef<HTMLDivElement>(null);

  // Consulta a nuestra API: al montar, cada minuto, y al volver a la pestaña
  // (si el celu estuvo dormido media hora, el dato viejo no sirve).
  useEffect(() => {
    let vivo = true;

    async function consultar() {
      try {
        const res = await fetch("/api/server-status", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as EstadoServer;
        if (!vivo) return;
        setEstado(data.online ? "online" : "caido");
        setDesde(data.desde);
      } catch {
        if (!vivo) return;
        setEstado("sin_datos");
        setDesde(null);
      } finally {
        if (vivo) setAhora(Date.now());
      }
    }

    consultar();
    const intervalo = setInterval(consultar, REFRESCO_MS);
    const alVolver = () => {
      if (document.visibilityState === "visible") consultar();
    };
    document.addEventListener("visibilitychange", alVolver);

    return () => {
      vivo = false;
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, []);

  // El "hace X min" avanza solo, sin pedir nada.
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), TICK_MS);
    return () => clearInterval(t);
  }, []);

  // El desplegable del celu se cierra tocando afuera o con Escape.
  useEffect(() => {
    if (!abierto) return;
    function onPointer(e: PointerEvent) {
      if (cajaRef.current && !cajaRef.current.contains(e.target as Node)) setAbierto(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [abierto]);

  const etiqueta = etiquetaEstado(estado);
  // El "hace X" solo tiene sentido cuando está caído: nadie necesita saber
  // hace cuánto que todo anda bien.
  const hace = estado === "caido" && ahora > 0 ? haceCuanto(desde, ahora) : "";

  const claseDot =
    estado === "online"
      ? "bg-success-green shadow-[0_0_8px_rgba(0,255,136,0.8)]"
      : estado === "caido"
        ? "bg-danger-red shadow-[0_0_8px_rgba(255,51,102,0.9)] animate-pulse"
        : "bg-text-muted";

  const claseTexto =
    estado === "online"
      ? "text-success-green"
      : estado === "caido"
        ? "text-danger-red"
        : "text-text-muted";

  const descripcion = `Server Status: ${etiqueta}${hace ? ` (${hace})` : ""}`;

  return (
    <div
      ref={cajaRef}
      className="relative lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2"
    >
      <button
        type="button"
        aria-label={descripcion}
        title={descripcion}
        // En lg+ el texto ya se ve entero: el click no hace falta, pero no
        // molesta. En celu es lo único que explica qué es el puntito.
        onClick={() => setAbierto((v) => !v)}
        className="flex items-center gap-2 rounded-full p-1.5 transition-colors hover:bg-bg-card-hover lg:border lg:border-border-base lg:bg-bg-card/70 lg:px-3 lg:py-1 lg:backdrop-blur-sm"
      >
        <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${claseDot}`} />
        <span
          aria-live="polite"
          className="hidden items-baseline gap-1.5 whitespace-nowrap font-body text-[10px] lg:flex"
        >
          <span className="uppercase tracking-[0.2em] text-text-muted">Server Status</span>
          <span className={`uppercase tracking-[0.2em] font-bold ${claseTexto}`}>{etiqueta}</span>
          {hace && <span className="text-text-secondary">· {hace}</span>}
        </span>
      </button>

      {/* Celu y tablet: el texto aparece abajo, sin empujar la nav. */}
      {abierto && (
        <div className="absolute left-0 top-full z-50 mt-2 whitespace-nowrap rounded-lg border border-border-strong bg-bg-card px-3 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.7)] lg:hidden">
          <p className="font-body text-[10px] uppercase tracking-[0.2em] text-text-muted">
            Server Status
          </p>
          <p className={`font-body text-sm font-bold ${claseTexto}`}>
            {etiqueta}
            {hace && <span className="ml-1 font-normal text-text-secondary">· {hace}</span>}
          </p>
        </div>
      )}
    </div>
  );
}
