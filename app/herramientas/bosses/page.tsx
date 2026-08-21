import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import WhatsAppButton from "@/components/WhatsAppButton";
import { BOSSES } from "@/lib/bosses";
import BossTimer from "./BossTimer";

export const metadata: Metadata = {
  title: "Kundun y Cryonox · timers de respawn · CamuStore",
  description:
    "Cargá la hora en que murió Kundun o Cryonox en Guerra Eterna y te decimos a qué hora respawnea y cuánto falta. Gratis, sin login.",
};

export default function BossesPage() {
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
              Kundun &amp; Cryonox
            </h1>
            <p className="font-display text-lg sm:text-xl neon-text-cyan mt-1">
              Timers de respawn
            </p>
            <p className="font-body text-sm text-text-secondary mt-4 leading-relaxed">
              Estos dos bosses no tienen horario fijo: vuelven a aparecer un tiempo después de
              que los matan. Cargá la hora del servidor en que murió y te decimos a qué hora
              respawnea y cuánto falta.
            </p>
          </div>

          {/* Las dos tarjetas, apiladas: cada una con su propio timer */}
          <div className="space-y-4 sm:space-y-6">
            {BOSSES.map((boss) => (
              <BossTimer key={boss.id} boss={boss} />
            ))}
          </div>

          {/* Cómo funciona */}
          <section className="mt-8 sm:mt-10 gamer-card rounded-lg p-5 sm:p-6">
            <h2 className="font-display font-bold text-base mb-3 text-text-primary">
              Cómo funciona
            </h2>
            <ul className="font-body text-sm text-text-secondary space-y-2.5">
              <li className="flex gap-3">
                <span className="text-neon-cyan font-bold">·</span>
                <span>
                  Anotá la hora <span className="text-luck-gold font-bold">Server</span> (abajo a
                  la izquierda de la pantalla) en el momento en que el boss muere.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-neon-cyan font-bold">·</span>
                <span>
                  Kundun vuelve <span className="text-text-primary font-bold">12 hs</span> después
                  y Cryonox <span className="text-text-primary font-bold">18 hs</span> después. Si
                  la hora cae al otro día, te lo marcamos.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-neon-cyan font-bold">·</span>
                <span>
                  El <span className="text-success-green font-bold">cuánto falta</span> se calcula
                  con el reloj de tu celu. Si tu celu está desfasado del server, la hora de respawn
                  sigue siendo la correcta; solo cambia la cuenta regresiva.
                </span>
              </li>
            </ul>
          </section>

          {/* Teaser guild */}
          <section className="mt-4 rounded-lg border border-dashed border-border-strong p-5 sm:p-6">
            <p className="font-body text-[10px] uppercase tracking-[0.3em] text-neon-orange mb-2">
              Próximamente · para la guild
            </p>
            <p className="font-body text-sm text-text-secondary leading-relaxed">
              Un miembro carga la muerte y todos ven el timer, con aviso antes del respawn e
              historial de quién lo cargó. Con login.
            </p>
          </section>
        </div>
      </main>
      <WhatsAppButton />
    </>
  );
}
