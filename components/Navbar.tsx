"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { CONFIG } from "@/lib/config";
import { HERRAMIENTAS_ACTIVAS } from "@/lib/herramientas";

export default function Navbar() {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const menuId = useId();

  const enHerramientas =
    (pathname?.startsWith("/herramientas") || pathname?.startsWith("/miembros")) ?? false;

  // Se cierra al navegar.
  useEffect(() => {
    setAbierto(false);
  }, [pathname]);

  // Se cierra con Escape o tocando afuera de la barra.
  useEffect(() => {
    if (!abierto) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    function onPointer(e: PointerEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [abierto]);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 backdrop-blur-md bg-bg-deep/80 border-b border-border-base"
      // Cerrar al sacar el mouse de la barra. Solo mouse: en touch el "leave"
      // llega apenas levantás el dedo y cerraría el menú recién abierto.
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setAbierto(false);
      }}
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link href="/" className="group flex items-center gap-2">
          <div className="w-8 h-8 rounded border border-neon-cyan/50 bg-bg-card flex items-center justify-center text-neon-cyan font-display font-black text-lg group-hover:shadow-[0_0_15px_rgba(0,212,255,0.6)] transition-shadow">
            C
          </div>
          <span className="hidden sm:inline font-display font-bold text-lg sm:text-xl tracking-wider text-text-primary group-hover:neon-text-cyan transition-colors">
            {CONFIG.STORE_NAME}
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <NavLink href="/items">Catálogo</NavLink>
          <NavLink href="/cotizador">Cotizador</NavLink>
          <NavLink href="/consignar">Consignar</NavLink>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={abierto}
            aria-controls={menuId}
            onClick={() => setAbierto((v) => !v)}
            // Abrir al pasar el mouse solo en PC: en el celu un toque también
            // dispara "enter" antes del click y abriría/cerraría en el mismo toque.
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse") setAbierto(true);
            }}
            className={`px-2 sm:px-3 py-1.5 rounded hover:text-neon-cyan hover:bg-bg-card-hover transition-colors font-body font-medium flex items-center gap-1 ${
              abierto || enHerramientas ? "text-neon-cyan" : "text-text-secondary"
            }`}
          >
            Herramientas
            <span
              aria-hidden
              className={`text-[10px] transition-transform ${abierto ? "rotate-180" : ""}`}
            >
              ▾
            </span>
          </button>
        </nav>

        {/* Panel del desplegable: hermano de <nav> (no hijo) para que el
            overflow-x del nav no lo recorte en el celu.
            El wrapper lleva pt-1 en vez de mt-1: la separación visual es la
            misma, pero no queda un hueco fuera del header que dispare el
            "pointer leave" al bajar el cursor hacia el menú (bug del 21/08). */}
        {abierto && (
          <div className="absolute right-4 sm:right-6 top-full pt-1 w-[min(18rem,calc(100vw-2rem))]">
          <div
            id={menuId}
            role="menu"
            className="rounded-lg border border-border-strong bg-bg-card shadow-[0_12px_40px_rgba(0,0,0,0.7)] p-2"
          >
            <p className="px-3 pt-1.5 pb-2 font-body text-[10px] uppercase tracking-[0.3em] text-neon-cyan">
              Gratis · sin login
            </p>
            {HERRAMIENTAS_ACTIVAS.map((h) => (
              <Link
                key={h.slug}
                href={h.href}
                role="menuitem"
                className="flex items-center gap-3 px-3 py-2.5 rounded text-text-primary hover:bg-bg-card-hover hover:text-neon-cyan transition-colors font-body text-sm"
              >
                <span className="text-xl leading-none" aria-hidden>
                  {h.icono}
                </span>
                <span>{h.tituloCorto ?? h.titulo}</span>
              </Link>
            ))}
            <div className="border-t border-border-base my-1" />
            <Link
              href="/herramientas"
              role="menuitem"
              className="block px-3 py-2.5 rounded text-text-secondary hover:bg-bg-card-hover hover:text-neon-cyan transition-colors font-body text-xs uppercase tracking-widest"
            >
              Todas las herramientas →
            </Link>
            <div className="border-t border-border-base my-1" />
            <p className="px-3 pt-1.5 pb-1 font-body text-[10px] uppercase tracking-[0.3em] text-neon-orange">
              Con login
            </p>
            <Link
              href="/miembros"
              role="menuitem"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-text-primary hover:bg-bg-card-hover hover:text-neon-orange transition-colors font-body text-sm"
            >
              <span className="text-xl leading-none" aria-hidden>
                🔐
              </span>
              <span>Miembros · timers compartidos</span>
            </Link>
          </div>
          </div>
        )}
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-2 sm:px-3 py-1.5 rounded text-text-secondary hover:text-neon-cyan hover:bg-bg-card-hover transition-colors font-body font-medium"
    >
      {children}
    </Link>
  );
}
