"use client";

import { useState } from "react";
import type { EstadoCampo } from "@/lib/tiempo";

// =====================================================
// Campo con estética de HUD del juego (Server: / Standby Time / Murió a las).
// Compartido por las herramientas: Gaion, Bosses, ...
// =====================================================

export interface CampoHudProps {
  id: string;
  etiqueta: string;
  tonoEtiqueta: "gold" | "green" | "cyan";
  valor: string;
  placeholder: string;
  maxLength: number;
  onChange: (v: string) => void;
  estado: EstadoCampo;
  ayudaIncompleto: string;
  ayudaInvalido: string;
  /** Texto de ayuda cuando el campo está ok o vacío (opcional). */
  ayudaNormal?: string;
}

const TONO: Record<CampoHudProps["tonoEtiqueta"], string> = {
  gold: "text-luck-gold",
  green: "text-success-green",
  cyan: "text-neon-cyan",
};

export default function CampoHud({
  id,
  etiqueta,
  tonoEtiqueta,
  valor,
  placeholder,
  maxLength,
  onChange,
  estado,
  ayudaIncompleto,
  ayudaInvalido,
  ayudaNormal = "",
}: CampoHudProps) {
  const [tocado, setTocado] = useState(false);
  const mostrarError = estado === "invalido" || (tocado && estado === "incompleto");

  const borde =
    mostrarError
      ? "border-danger-red focus-within:border-danger-red"
      : estado === "ok"
        ? "border-neon-cyan/70 focus-within:border-neon-cyan"
        : "border-border-base focus-within:border-neon-cyan";

  const ayuda =
    estado === "invalido"
      ? ayudaInvalido
      : estado === "incompleto"
        ? ayudaIncompleto
        : ayudaNormal;

  return (
    <div>
      <label
        htmlFor={id}
        className={`flex items-center gap-3 rounded-md border bg-black/60 px-3 py-2.5 transition-colors cursor-text ${borde}`}
      >
        <span className={`font-body text-xs sm:text-sm font-bold whitespace-nowrap ${TONO[tonoEtiqueta]}`}>
          {etiqueta}
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={valor}
          placeholder={placeholder}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTocado(true)}
          className="min-w-0 flex-1 bg-transparent text-right font-numeric text-2xl sm:text-3xl font-bold tracking-widest tabular-nums text-luck-gold placeholder:text-text-muted/40 outline-none"
        />
      </label>
      <p
        className={`mt-1 min-h-[1rem] font-body text-[11px] ${
          mostrarError ? "text-danger-red" : "text-text-muted"
        }`}
      >
        {ayuda}
      </p>
    </div>
  );
}
