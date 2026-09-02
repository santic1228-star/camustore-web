"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AVATAR_PX,
  ZOOM_MAX,
  acotarEncuadre,
  generarAvatar,
  leerImagen,
  posicionMostrada,
  textoPeso,
  type Dimensiones,
  type Encuadre,
} from "@/lib/avatar-imagen";
import type { Raza } from "@/lib/database.types";
import { RAZA_COLORS } from "@/lib/razas";

// =====================================================
// Recorte del avatar (M4, 31/08/2026) — "el miembro elige qué parte" (Santi).
// Un marco cuadrado; la foto se arrastra con el dedo/mouse y se acerca con el
// slider (o la rueda). Lo que queda dentro del marco es el avatar. Al confirmar,
// lib/avatar-imagen la recorta y reduce a 256×256 en el navegador.
// =====================================================

interface Props {
  archivo: File;
  /** Raza actual: el aro de la vista previa lleva su color. */
  raza: Raza | null;
  onCancelar: () => void;
  /** Recibe la imagen final lista para subir. */
  onConfirmar: (blob: Blob, extension: "webp" | "jpg") => Promise<void>;
}

export default function RecorteAvatar({ archivo, raza, onCancelar, onConfirmar }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [marco, setMarco] = useState(260);
  const [enc, setEnc] = useState<Encuadre>({ zoom: 1, dx: 0, dy: 0 });
  const [guardando, setGuardando] = useState(false);
  const marcoRef = useRef<HTMLDivElement>(null);
  const arrastre = useRef<{ x: number; y: number; dx: number; dy: number } | null>(null);

  // Cargar la imagen elegida.
  useEffect(() => {
    let vivo = true;
    setImg(null);
    setError(null);
    setEnc({ zoom: 1, dx: 0, dy: 0 });
    leerImagen(archivo)
      .then((i) => {
        if (vivo) setImg(i);
      })
      .catch((e) => {
        if (vivo) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      vivo = false;
    };
  }, [archivo]);

  // El marco ocupa el ancho disponible (celu), con tope.
  useLayoutEffect(() => {
    function medir() {
      const el = marcoRef.current?.parentElement;
      if (!el) return;
      setMarco(Math.max(200, Math.min(320, el.clientWidth)));
    }
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);

  // Cerrar con Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !guardando) onCancelar();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancelar, guardando]);

  const dims: Dimensiones | null = img ? { ancho: img.naturalWidth, alto: img.naturalHeight } : null;

  function actualizar(parcial: Partial<Encuadre>) {
    if (!dims) return;
    setEnc((prev) => acotarEncuadre(dims, marco, { ...prev, ...parcial }));
  }

  // ---------- Arrastre (pointer events: mouse y dedo) ----------
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!dims) return;
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    arrastre.current = { x: e.clientX, y: e.clientY, dx: enc.dx, dy: enc.dy };
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const a = arrastre.current;
    if (!a) return;
    actualizar({ dx: a.dx + (e.clientX - a.x), dy: a.dy + (e.clientY - a.y) });
  }
  function onPointerUp() {
    arrastre.current = null;
  }
  function onWheel(e: React.WheelEvent<HTMLDivElement>) {
    if (!dims) return;
    actualizar({ zoom: enc.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08) });
  }

  async function confirmar() {
    if (!img) return;
    setGuardando(true);
    setError(null);
    try {
      const { blob, extension } = await generarAvatar(img, marco, enc);
      await onConfirmar(blob, extension);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setGuardando(false);
    }
  }

  const pos = dims ? posicionMostrada(dims, marco, enc) : null;
  const color = raza ? RAZA_COLORS[raza] : "#5a5a6e";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-3"
      role="dialog"
      aria-modal="true"
      aria-label="Encuadrar el avatar"
      onClick={() => !guardando && onCancelar()}
    >
      <div
        className="gamer-card rounded-lg w-full max-w-sm p-4 sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display font-bold text-lg text-text-primary">Encuadrá tu avatar</h3>
        <p className="font-body text-[11px] text-text-muted mt-1 mb-3">
          Arrastrá la foto para elegir qué parte se ve. Lo que queda dentro del círculo es tu avatar
          ({AVATAR_PX}×{AVATAR_PX}, ~20 KB).
        </p>

        {/* Marco cuadrado */}
        <div className="w-full flex justify-center">
          <div
            ref={marcoRef}
            className="relative overflow-hidden rounded-lg bg-bg-deep select-none touch-none"
            style={{ width: marco, height: marco, cursor: dims ? "grab" : "default" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
          >
            {img && pos ? (
              // eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:)
              <img
                src={img.src}
                alt=""
                draggable={false}
                className="absolute max-w-none"
                style={{ width: pos.ancho, height: pos.alto, left: pos.left, top: pos.top }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center font-body text-xs text-text-muted">
                {error ? "" : "Abriendo la foto…"}
              </div>
            )}
            {/* Máscara circular con el aro del color de la raza */}
            <div
              className="absolute inset-0 pointer-events-none rounded-lg"
              style={{
                boxShadow: `0 0 0 ${marco}px rgba(6,6,12,0.6)`,
                borderRadius: "50%",
                border: `2px solid ${color}`,
              }}
              aria-hidden
            />
          </div>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-3 mt-3">
          <span className="font-body text-[10px] uppercase tracking-widest text-text-muted">Zoom</span>
          <input
            type="range"
            min={1}
            max={ZOOM_MAX}
            step={0.01}
            value={enc.zoom}
            disabled={!dims}
            onChange={(e) => actualizar({ zoom: Number(e.target.value) })}
            className="flex-1 accent-neon-cyan"
            aria-label="Zoom"
          />
          <span className="font-body text-xs text-text-secondary w-10 text-right">{enc.zoom.toFixed(1)}×</span>
        </div>

        <p className="font-body text-[11px] text-text-muted mt-2">
          Original: {archivo.name} · {textoPeso(archivo.size)}
          {dims ? ` · ${dims.ancho}×${dims.alto}` : ""}
        </p>
        {error && <p className="font-body text-xs text-danger-red mt-2">{error}</p>}

        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onCancelar}
            disabled={guardando}
            className="px-4 py-2 rounded font-body text-xs uppercase tracking-widest border border-border-strong text-text-secondary hover:text-text-primary disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={!img || guardando}
            className="px-4 py-2 rounded font-body text-xs uppercase tracking-widest border border-neon-cyan/60 text-neon-cyan hover:bg-neon-cyan/10 disabled:opacity-50"
          >
            {guardando ? "Subiendo…" : "Usar esta foto"}
          </button>
        </div>
      </div>
    </div>
  );
}
