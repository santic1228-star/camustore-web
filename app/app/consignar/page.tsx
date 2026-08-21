import Link from "next/link";
import Navbar from "@/components/Navbar";
import WhatsAppButton from "@/components/WhatsAppButton";
import { CONFIG, whatsappLink } from "@/lib/config";

export default function ConsignarPage() {
  return (
    <>
      <Navbar />
      <main className="px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <p className="inline-block font-body text-xs tracking-[0.3em] uppercase text-neon-orange mb-6 px-3 py-1 border border-neon-orange/40 rounded">
            ⚙ En desarrollo
          </p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl mb-4 text-text-primary">
            Consignación
          </h1>
          <p className="font-body text-text-secondary mb-8 leading-relaxed">
            Dejá tus items en consignación: nosotros los vendemos por vos y te entregamos
            el total menos una comisión del 20%.
          </p>

          <div className="gamer-card rounded-lg p-6 sm:p-8 text-left mb-6">
            <h2 className="font-display font-bold text-lg mb-4 neon-text-cyan">
              Cómo va a funcionar:
            </h2>
            <ol className="font-body text-sm text-text-secondary space-y-3">
              <li className="flex gap-3">
                <span className="text-neon-cyan font-bold">1.</span>
                <span>Iniciás sesión con tu cuenta de Google.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-neon-cyan font-bold">2.</span>
                <span>Cargás tus items en el formulario.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-neon-cyan font-bold">3.</span>
                <span>Nosotros revisamos y aprobamos.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-neon-cyan font-bold">4.</span>
                <span>Cuando se vende, te entregamos el total menos la comisión.</span>
              </li>
            </ol>
          </div>

          <a
            href={whatsappLink(`${CONFIG.WHATSAPP_GREETING} Quería consignar items.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block btn-whatsapp px-6 py-3 rounded font-body text-sm uppercase tracking-widest"
          >
            Consultar por WhatsApp
          </a>
        </div>
      </main>
      <WhatsAppButton />
    </>
  );
}
