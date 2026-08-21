import Link from "next/link";
import Navbar from "@/components/Navbar";
import WhatsAppButton from "@/components/WhatsAppButton";
import { CONFIG } from "@/lib/config";
import { HERRAMIENTAS_ACTIVAS } from "@/lib/herramientas";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="relative">
        {/* Hero */}
        <section className="px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-24">
          <div className="max-w-5xl mx-auto text-center">
            {/* Eyebrow */}
            <p className="inline-block font-body text-xs sm:text-sm tracking-[0.3em] uppercase text-neon-cyan mb-4 sm:mb-6 px-3 py-1 border border-neon-cyan/30 rounded">
              ⚔ Mu Online · Servidor Guerra Eterna
            </p>

            {/* Title */}
            <h1 className="font-display font-black text-5xl sm:text-7xl md:text-8xl tracking-tight leading-none mb-4 sm:mb-6">
              <span className="block text-text-primary">CAMU</span>
              <span className="block neon-text-cyan">STORE</span>
            </h1>

            {/* Subtitle */}
            <p className="font-body text-base sm:text-lg text-text-secondary max-w-xl mx-auto mb-8 sm:mb-12 leading-relaxed">
              La tienda de items más confiable de Guerra Eterna.
              Buscador en vivo, cotizador automático y venta a comisión.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
              <Link
                href="/items"
                className="btn-primary px-6 sm:px-8 py-3 sm:py-4 rounded font-body text-sm sm:text-base uppercase tracking-widest"
              >
                Ver Catálogo
              </Link>
              <Link
                href="/cotizador"
                className="px-6 sm:px-8 py-3 sm:py-4 rounded font-body text-sm sm:text-base uppercase tracking-widest border border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10 hover:border-neon-cyan transition-colors"
              >
                Cotizar Item
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-4 sm:px-6 pb-20">
          <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-4 sm:gap-6">
            <FeatureCard
              icon="🔍"
              title="Buscador en vivo"
              text="Encontrá items por nombre, raza, tipo, nivel o cualquier característica."
              href="/items"
              cta="Buscar →"
            />
            <FeatureCard
              icon="💰"
              title="Cotizador automático"
              text="Cargás los datos de tu item y te decimos cuánto vale en segundos."
              href="/cotizador"
              cta="Cotizar →"
            />
            <FeatureCard
              icon="🤝"
              title="Venta a comisión"
              text="Dejá tus items en consignación y los vendemos por vos. Comisión 20%."
              href="/consignar"
              cta="Consignar →"
            />
          </div>
        </section>

        {/* Herramientas gratis: una tarjeta por calculadora, desde la lista única */}
        <section className="px-4 sm:px-6 pb-20">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end justify-between gap-4 mb-4 sm:mb-6">
              <div>
                <p className="font-body text-[10px] sm:text-xs uppercase tracking-[0.3em] text-neon-cyan mb-1">
                  Herramientas gratis · sin login
                </p>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-text-primary">
                  Calculadoras para jugar
                </h2>
              </div>
              <Link
                href="/herramientas"
                className="font-body text-xs sm:text-sm text-neon-cyan hover:underline whitespace-nowrap"
              >
                Ver todas →
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              {HERRAMIENTAS_ACTIVAS.map((h) => (
                <Link
                  key={h.slug}
                  href={h.href}
                  className="gamer-card rounded-lg p-5 sm:p-6 flex items-start gap-4 group"
                >
                  <div className="text-4xl leading-none" aria-hidden>
                    {h.icono}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-lg sm:text-xl text-text-primary group-hover:neon-text-cyan transition-colors">
                      {h.titulo}
                    </h3>
                    <p className="font-body text-sm text-text-secondary mt-1 leading-relaxed">
                      {h.texto}
                    </p>
                    <p className="font-body text-xs text-neon-cyan uppercase tracking-widest mt-3">
                      Abrir →
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Stats / Trust */}
        <section className="px-4 sm:px-6 pb-20">
          <div className="max-w-5xl mx-auto">
            <div className="gamer-card rounded-lg p-6 sm:p-10 text-center">
              <h2 className="font-display font-bold text-2xl sm:text-3xl mb-2 text-text-primary">
                Operaciones <span className="neon-text-cyan">100% confiables</span>
              </h2>
              <p className="font-body text-sm sm:text-base text-text-secondary max-w-2xl mx-auto">
                Más de 70 items en stock. Precios automáticos según reglas claras.
                Comunicación directa por WhatsApp para cerrar la operación.
              </p>
            </div>
          </div>
        </section>
      </main>
      <WhatsAppButton />

      {/* Footer */}
      <footer className="border-t border-border-base py-6 px-4 text-center font-body text-xs text-text-muted">
        <p>© {new Date().getFullYear()} {CONFIG.STORE_NAME}. Mu Online · Servidor Guerra Eterna.</p>
        <p className="mt-1">Hecho en Córdoba 🇦🇷</p>
      </footer>
    </>
  );
}

function FeatureCard({
  icon, title, text, href, cta,
}: {
  icon: string; title: string; text: string; href: string; cta: string;
}) {
  return (
    <Link href={href} className="gamer-card rounded-lg p-5 sm:p-6 group">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-display font-bold text-lg mb-2 text-text-primary group-hover:neon-text-cyan transition-colors">
        {title}
      </h3>
      <p className="font-body text-sm text-text-secondary mb-4 leading-relaxed">
        {text}
      </p>
      <p className="font-body text-xs text-neon-cyan uppercase tracking-widest">
        {cta}
      </p>
    </Link>
  );
}
