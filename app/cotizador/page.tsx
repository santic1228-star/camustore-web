"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import WhatsAppButton from "@/components/WhatsAppButton";
import SeccionArmaduras from "./SeccionArmaduras";
import SeccionArmasEscudos from "./SeccionArmasEscudos";
import SeccionAlas from "./SeccionAlas";
import SeccionJewels from "./SeccionJewels";
import SeccionSeeds from "./SeccionSeeds";
import SeccionGemas from "./SeccionGemas";
import SeccionJoyeria from "./SeccionJoyeria";

type Tab = "armaduras" | "armas" | "alas" | "jewels" | "seeds" | "gemas" | "joyeria";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "armaduras", label: "Armaduras", icon: "🛡" },
  { id: "armas", label: "Armas y Escudos", icon: "⚔" },
  { id: "alas", label: "Alas", icon: "🪽" },
  { id: "jewels", label: "Jewels", icon: "💎" },
  { id: "seeds", label: "Seeds", icon: "🌱" },
  { id: "gemas", label: "Gemas y otros", icon: "🔮" },
  { id: "joyeria", label: "Joyería", icon: "💍" },
];

export default function CotizadorPage() {
  const [tab, setTab] = useState<Tab>("armaduras");

  return (
    <>
      <Navbar />
      <main className="px-4 sm:px-6 py-8 sm:py-10 pb-24">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-text-primary mb-2">
              Cotizador
            </h1>
            <p className="font-body text-sm sm:text-base text-text-secondary">
              Cargá los datos de tu item y te decimos cuánto te pagamos por él.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 sm:gap-2 mb-8 overflow-x-auto pb-2 -mx-1 px-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 px-3 sm:px-4 py-2.5 rounded font-body text-xs sm:text-sm uppercase tracking-wider transition-all ${
                  tab === t.id
                    ? "bg-neon-cyan/15 border border-neon-cyan/60 text-neon-cyan shadow-[0_0_15px_rgba(0,212,255,0.2)]"
                    : "bg-bg-card border border-border-base text-text-secondary hover:border-border-strong hover:text-text-primary"
                }`}
              >
                <span className="mr-1.5">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Sección activa */}
          <div className="animate-fade-in">
            {tab === "armaduras" && <SeccionArmaduras />}
            {tab === "armas" && <SeccionArmasEscudos />}
            {tab === "alas" && <SeccionAlas />}
            {tab === "jewels" && <SeccionJewels />}
            {tab === "seeds" && <SeccionSeeds />}
            {tab === "gemas" && <SeccionGemas />}
            {tab === "joyeria" && <SeccionJoyeria />}
          </div>
        </div>
      </main>
      <WhatsAppButton />
    </>
  );
}
