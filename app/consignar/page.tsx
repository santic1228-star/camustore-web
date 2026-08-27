import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import WhatsAppButton from "@/components/WhatsAppButton";
import ConsignarClient from "./ConsignarClient";

export const metadata: Metadata = {
  title: "Consignación | CamuStore",
  description:
    "Dejá tus items de Guerra Eterna en consignación: CamuStore los vende por vos y te llevás el 80%.",
};

const PASOS = [
  { n: "1", texto: "Cargás tus ítems con precio sugerido automático" },
  { n: "2", texto: "Camus revisa y aprueba ítem por ítem" },
  { n: "3", texto: "Se publican en la tienda a tu nombre" },
  { n: "4", texto: "Cuando se venden, cobrás el 80%" },
];

export default function ConsignarPage() {
  return (
    <>
      <Navbar />
      <main className="px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-text-primary">
              Consignación
            </h1>
            <p className="font-body text-sm sm:text-base text-text-secondary mt-3 max-w-2xl mx-auto leading-relaxed">
              Dejá tus items para que CamuStore los venda por vos. Sin cuentas ni vueltas: personaje,
              WhatsApp y listo.
            </p>

            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-2 text-left">
              {PASOS.map((p) => (
                <div key={p.n} className="rounded border border-border-base bg-bg-card/50 px-3 py-2.5">
                  <span className="font-numeric font-bold text-neon-cyan">{p.n}.</span>{" "}
                  <span className="font-body text-xs text-text-secondary">{p.texto}</span>
                </div>
              ))}
            </div>
          </header>

          <ConsignarClient />
        </div>
      </main>
      <WhatsAppButton />
    </>
  );
}
