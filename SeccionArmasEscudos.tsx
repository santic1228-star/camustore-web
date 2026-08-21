"use client";

import { useState } from "react";
import SeccionArmas from "./SeccionArmas";
import SeccionEscudos from "./SeccionEscudos";

export default function SeccionArmasEscudos() {
  const [modo, setModo] = useState<"arma" | "escudo">("arma");

  return (
    <div className="space-y-5">
      {/* Sub-toggle Arma / Escudo */}
      <div className="inline-flex bg-bg-card border border-border-base rounded p-0.5 gap-0.5">
        <button
          onClick={() => setModo("arma")}
          className={`px-5 py-2 rounded font-body text-xs uppercase tracking-wider transition-all ${
            modo === "arma"
              ? "bg-neon-cyan text-bg-deep font-bold"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          ⚔ Arma
        </button>
        <button
          onClick={() => setModo("escudo")}
          className={`px-5 py-2 rounded font-body text-xs uppercase tracking-wider transition-all ${
            modo === "escudo"
              ? "bg-neon-cyan text-bg-deep font-bold"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          🛡 Escudo
        </button>
      </div>

      {modo === "arma" ? <SeccionArmas /> : <SeccionEscudos />}
    </div>
  );
}
