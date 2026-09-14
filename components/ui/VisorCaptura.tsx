"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * VisorCaptura — "portapapeles visual" (pedido de Santi, 14/09/2026).
 *
 * Problema: después de sacar una captura del juego (la tira del HUD con hora del
 * server, aviso del evento y standby), leerla obligaba a ir a Paint o WhatsApp a
 * pegarla. Esto la muestra acá mismo, a tamaño real, para leerla y cargar el
 * registro sin cambiar de ventana.
 *
 * Reglas:
 *   - NO guarda nada. Vive en memoria del navegador; al recargar, desaparece.
 *     Ni Supabase, ni storage, ni localStorage.
 *   - Solo desktop (`hidden md:block`): en el celu no hay Ctrl+V de capturas y
 *     no tiene sentido ocupar pantalla.
 *   - Escucha el `paste` de toda la página, pero SOLO reacciona si el
 *     portapapeles trae una imagen. Pegar texto en un input sigue igual.
 *   - También acepta arrastrar un archivo de imagen sobre el recuadro.
 *   - A tamaño real (`max-w-none`): si la captura es más ancha que el recuadro,
 *     scrollea horizontalmente adentro; nunca se deforma.
 *   - Esc o el botón "Quitar" la saca. Pegar otra la reemplaza.
 *
 * Es un componente de UI puro: no recibe datos ni llama a nada.
 */

interface Captura {
  url: string;
  ancho: number;
  alto: number;
  nombre: string;
}

function imagenDeDataTransfer(dt: DataTransfer | null): File | null {
  if (!dt) return null;
  for (const item of Array.from(dt.items ?? [])) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const f = item.getAsFile();
      if (f) return f;
    }
  }
  for (const f of Array.from(dt.files ?? [])) {
    if (f.type.startsWith("image/")) return f;
  }
  return null;
}

export default function VisorCaptura({ className = "" }: { className?: string }) {
  const [captura, setCaptura] = useState<Captura | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const urlRef = useRef<string | null>(null);

  const liberar = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const mostrar = useCallback(
    (archivo: File) => {
      const url = URL.createObjectURL(archivo);
      const img = new Image();
      img.onload = () => {
        liberar();
        urlRef.current = url;
        setCaptura({
          url,
          ancho: img.naturalWidth,
          alto: img.naturalHeight,
          nombre: archivo.name && archivo.name !== "image.png" ? archivo.name : "captura",
        });
      };
      img.onerror = () => URL.revokeObjectURL(url);
      img.src = url;
    },
    [liberar]
  );

  const quitar = useCallback(() => {
    liberar();
    setCaptura(null);
  }, [liberar]);

  // Ctrl+V en cualquier parte de la página (solo si viene una imagen) + Esc.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const f = imagenDeDataTransfer(e.clipboardData);
      if (!f) return;
      e.preventDefault();
      mostrar(f);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") quitar();
    };
    document.addEventListener("paste", onPaste);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("keydown", onKey);
      liberar();
    };
  }, [mostrar, quitar, liberar]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setArrastrando(false);
    const f = imagenDeDataTransfer(e.dataTransfer);
    if (f) mostrar(f);
  };

  // Con imagen, en pantallas grandes el recuadro mide LO QUE MIDE LA IMAGEN,
  // centrado respecto de la ventana y con tope en el ancho de la ventana. Así
  // una tira de 796px no abre una caja de 2500px (corrección 14/09 tras la
  // primera prueba de Santi) y una de 1000px puede salirse de la columna de
  // 672px de /miembros sin deformarse.
  const ancho = captura
    ? "lg:relative lg:left-1/2 lg:-translate-x-1/2 lg:w-max lg:max-w-[calc(100vw-4rem)]"
    : "";

  return (
    <section
      className={`hidden md:block ${ancho} ${className}`}
      onDragOver={(e) => {
        e.preventDefault();
        setArrastrando(true);
      }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={onDrop}
      aria-label="Visor de capturas"
    >
      {captura ? (
        <div className="rounded-lg border border-border-strong bg-bg-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-border-strong">
            <p className="font-body text-xs text-text-secondary min-w-0 truncate">
              📋 {captura.nombre} · {captura.ancho}×{captura.alto} px · tamaño real · no se guarda
            </p>
            <button
              type="button"
              onClick={quitar}
              className="shrink-0 font-body text-xs text-text-muted hover:text-text-primary transition-colors"
              title="Esc"
            >
              Quitar ✕
            </button>
          </div>
          <div className="overflow-auto max-h-[70vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={captura.url}
              alt="Captura pegada"
              width={captura.ancho}
              height={captura.alto}
              className="block max-w-none"
              draggable={false}
            />
          </div>
        </div>
      ) : (
        <p
          className={`rounded-lg border border-dashed px-4 py-2.5 font-body text-xs text-text-muted transition-colors ${
            arrastrando ? "border-neon-orange text-text-secondary" : "border-border-strong"
          }`}
        >
          📋 Sacaste una captura del juego? Pegala acá con <kbd className="font-mono">Ctrl+V</kbd> (o
          arrastrala) para leerla sin ir a Paint. No se guarda.
        </p>
      )}
    </section>
  );
}
