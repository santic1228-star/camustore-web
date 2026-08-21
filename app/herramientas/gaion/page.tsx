import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import WhatsAppButton from "@/components/WhatsAppButton";
import GaionCalculator from "./GaionCalculator";

export const metadata: Metadata = {
  title: "Gaion time calculator · CamuStore",
  description:
    "Calculá a qué hora abre el próximo Gaion en Guerra Eterna a partir de la captura del fin del evento. Gratis, sin login.",
};

export default function GaionPage() {
  return (
    <>
      <Navbar />
      <main className="px-4 sm:px-6 py-8 sm:py-14">
        <div className="max-w-2xl mx-auto">
          {/* Encabezado */}
          <div className="mb-6 sm:mb-8">
            <Link
              href="/herramientas"
              className="inline-block font-body text-xs tracking-[0.3em] uppercase text-neon-cyan mb-4 px-3 py-1 border border-neon-cyan/30 rounded hover:bg-neon-cyan/10 transition-colors"
            >
              ← Herramientas · gratis, sin login
            </Link>
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-text-primary leading-none">
              Gaion
            </h1>
            <p className="font-display text-lg sm:text-xl neon-text-cyan mt-1">
              Time calculator
            </p>
            <p className="font-body text-sm text-text-secondary mt-4 leading-relaxed">
              Cuando termina un Gaion, la pantalla muestra la hora del servidor y el tiempo
              que falta para el próximo. Cargá esos dos números y te decimos a qué hora abre.
            </p>
          </div>

          <GaionCalculator />

          {/* Cómo leer la captura */}
          <section className="mt-8 sm:mt-10 gamer-card rounded-lg p-5 sm:p-6">
            <h2 className="font-display font-bold text-base mb-3 text-text-primary">
              Dónde están los números
            </h2>
            <ol className="font-body text-sm text-text-secondary space-y-2.5">
              <li className="flex gap-3">
                <span className="text-neon-cyan font-bold">1.</span>
                <span>
                  Apenas termina el evento, sacá una captura antes de salir del mapa.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-neon-cyan font-bold">2.</span>
                <span>
                  Abajo a la izquierda está{" "}
                  <span className="text-luck-gold font-bold">Server:</span> con la hora en{" "}
                  <span className="font-numeric text-text-primary">HH:MM:SS</span>.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-neon-cyan font-bold">3.</span>
                <span>
                  A la derecha está{" "}
                  <span className="text-success-green font-bold">Standby Time</span> con el
                  tiempo restante en{" "}
                  <span className="font-numeric text-text-primary">MM:SS</span>. Ignorá el
                  número entre paréntesis.
                </span>
              </li>
            </ol>
            <p className="font-body text-xs text-text-muted mt-4 leading-relaxed">
              Tip: se puede usar la hora <span className="text-text-secondary">Local</span> en
              lugar de Server, pero el horario te queda en hora de tu PC.
            </p>
          </section>

          {/* Teaser guild */}
          <section className="mt-4 rounded-lg border border-dashed border-border-strong p-5 sm:p-6">
            <p className="font-body text-[10px] uppercase tracking-[0.3em] text-neon-orange mb-2">
              Próximamente · para la guild
            </p>
            <p className="font-body text-sm text-text-secondary leading-relaxed">
              Horario compartido entre miembros, cuenta regresiva en vivo, lista de las
              próximas aperturas y aviso antes de que abra. Con login.
            </p>
          </section>
        </div>
      </main>
      <WhatsAppButton />
    </>
  );
}
