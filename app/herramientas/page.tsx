import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import WhatsAppButton from "@/components/WhatsAppButton";
import { HERRAMIENTAS, type Herramienta } from "@/lib/herramientas";

export const metadata: Metadata = {
  title: "Herramientas · CamuStore",
  description:
    "Herramientas gratis para jugadores de Guerra Eterna: calculador de Gaion, timers de Kundun y Cryonox y más. Sin login.",
};

export default function HerramientasPage() {
  return (
    <>
      <Navbar />
      <main className="px-4 sm:px-6 py-8 sm:py-14">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 sm:mb-10">
            <p className="inline-block font-body text-xs tracking-[0.3em] uppercase text-neon-cyan mb-4 px-3 py-1 border border-neon-cyan/30 rounded">
              Gratis · sin login
            </p>
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-text-primary">
              Herramientas
            </h1>
            <p className="font-body text-sm sm:text-base text-text-secondary mt-3 max-w-xl leading-relaxed">
              Utilidades para el día a día en Guerra Eterna. Abrilas desde el celu mientras jugás.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {HERRAMIENTAS.map((h) => (
              <TarjetaHerramienta key={h.slug} {...h} />
            ))}
          </div>

          {/* Zona de miembros (con login) */}
          <Link
            href="/miembros"
            className="group mt-6 sm:mt-8 block rounded-lg border border-dashed border-neon-orange/40 p-5 sm:p-6 hover:border-neon-orange hover:bg-neon-orange/5 transition-colors"
          >
            <p className="font-body text-[10px] uppercase tracking-[0.3em] text-neon-orange mb-2">
              Para la guild · con login
            </p>
            <p className="font-display font-bold text-xl text-text-primary group-hover:neon-text-orange transition-colors">
              🔐 Miembros · timers compartidos
            </p>
            <p className="font-body text-sm text-text-secondary mt-2 leading-relaxed">
              Gaion, Kundun y Cryonox en una sola pantalla: uno carga, todos lo ven, con historial y
              aviso antes de la hora. Entrás con el usuario que te da Camus.
            </p>
          </Link>
        </div>
      </main>
      <WhatsAppButton />
    </>
  );
}

function TarjetaHerramienta({ href, icono, titulo, texto, estado }: Herramienta) {
  const contenido = (
    <>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="text-3xl">{icono}</div>
        {estado === "activa" ? (
          <span className="badge bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40">
            Disponible
          </span>
        ) : (
          <span className="badge bg-bg-base text-text-muted border border-border-base">
            Pronto
          </span>
        )}
      </div>
      <h2 className="font-display font-bold text-lg mb-2 text-text-primary">{titulo}</h2>
      <p className="font-body text-sm text-text-secondary leading-relaxed">{texto}</p>
      {estado === "activa" && (
        <p className="font-body text-sm text-neon-cyan mt-4 font-medium">Abrir →</p>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="gamer-card rounded-lg p-5 sm:p-6 block">
        {contenido}
      </Link>
    );
  }

  return (
    <div className="gamer-card rounded-lg p-5 sm:p-6 opacity-70 hover:opacity-100 hover:!transform-none hover:!shadow-none hover:!border-border-base">
      {contenido}
    </div>
  );
}
