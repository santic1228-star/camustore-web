import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import WhatsAppButton from "@/components/WhatsAppButton";
import TimelineDia from "./TimelineDia";

export const metadata: Metadata = {
  title: "Timeline de eventos · próximas 24 hs · CamuStore",
  description:
    "Las próximas 24 horas de Guerra Eterna: eventos, invasiones y bosses con horario, mapa y drop, en hora servidor. Gratis, sin login.",
};

export default function TimelinePage() {
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
              Timeline de eventos
            </h1>
            <p className="font-display text-lg sm:text-xl neon-text-cyan mt-1">
              Las próximas 24 horas del server
            </p>
            <p className="font-body text-sm text-text-secondary mt-4 leading-relaxed">
              Eventos, invasiones y bosses con horario fijo, ordenados desde ahora y en{" "}
              <span className="text-luck-gold font-bold">hora servidor</span>, con mapa y drop.
              Los más importantes van con el pin más grande.
            </p>
          </div>

          <TimelineDia />

          {/* Cómo funciona */}
          <section className="mt-8 sm:mt-10 gamer-card rounded-lg p-5 sm:p-6">
            <h2 className="font-display font-bold text-base mb-3 text-text-primary">
              Cómo funciona
            </h2>
            <ul className="font-body text-sm text-text-secondary space-y-2.5">
              <li className="flex gap-3">
                <span className="text-neon-cyan font-bold">·</span>
                <span>
                  Todos los horarios están en{" "}
                  <span className="text-luck-gold font-bold">hora servidor</span> (la misma que ves
                  abajo a la izquierda en el juego, que coincide con la hora de Argentina). El
                  «cuánto falta» se calcula con el reloj de tu celu.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-neon-cyan font-bold">·</span>
                <span>
                  El calendario sale de la{" "}
                  <span className="text-text-primary font-bold">planilla oficial del server</span>{" "}
                  (28/08) verificada contra capturas del juego. Ojo: el server no repite todo «cada
                  X horas», cada evento tiene su lista de horarios. Los pocos marcados con{" "}
                  <span className="text-luck-gold font-bold">±</span> no figuran en la planilla y
                  los tenemos relevados a medias: puede haber horarios que todavía no vimos.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-neon-cyan font-bold">·</span>
                <span>
                  <span className="text-text-primary font-bold">Gaion, Kundun y Cryonox no están acá</span>{" "}
                  porque no tienen horario fijo: el Gaion depende de cuándo terminó el anterior y
                  los bosses respawnean un tiempo después de que los matan — y eso solo lo sabe
                  quien los mató. Para calcularlos están el{" "}
                  <Link href="/herramientas/gaion" className="text-neon-cyan hover:underline">
                    calculador de Gaion
                  </Link>{" "}
                  y los{" "}
                  <Link href="/herramientas/bosses" className="text-neon-cyan hover:underline">
                    timers de Kundun &amp; Cryonox
                  </Link>
                  .
                </span>
              </li>
            </ul>
          </section>
        </div>
      </main>
      <WhatsAppButton />
    </>
  );
}
