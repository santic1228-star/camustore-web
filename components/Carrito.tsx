"use client";

import { useState } from "react";
import { useCarrito } from "@/lib/carrito";
import { CONFIG, whatsappLink } from "@/lib/config";

export default function Carrito() {
  const { lineas, quitar, cambiarCantidad, vaciar, totalItems, totalCompra, totalVenta } = useCarrito();
  const [abierto, setAbierto] = useState(false);

  const compras = lineas.filter((l) => l.tipo === "compra");
  const ventas = lineas.filter((l) => l.tipo === "venta");
  const neto = totalCompra - totalVenta;  // >0 cliente paga, <0 vos pagás

  function armarMensaje(): string {
    const partes: string[] = [`${CONFIG.WHATSAPP_GREETING}`, ""];

    if (compras.length > 0) {
      partes.push("🛒 *QUIERO COMPRAR:*");
      for (const l of compras) {
        const sub = (l.precio * l.cantidad).toLocaleString("es-AR");
        partes.push(`• ${l.cantidad}x ${l.titulo}${l.detalle ? ` (${l.detalle})` : ""} — ${sub} ${CONFIG.CURRENCY}`);
      }
      partes.push(`Subtotal compra: ${totalCompra.toLocaleString("es-AR")} ${CONFIG.CURRENCY}`);
      partes.push("");
    }

    if (ventas.length > 0) {
      partes.push("💰 *QUIERO VENDER:*");
      for (const l of ventas) {
        const sub = (l.precio * l.cantidad).toLocaleString("es-AR");
        partes.push(`• ${l.cantidad}x ${l.titulo}${l.detalle ? ` (${l.detalle})` : ""} — ${sub} ${CONFIG.CURRENCY}`);
      }
      partes.push(`Subtotal venta: ${totalVenta.toLocaleString("es-AR")} ${CONFIG.CURRENCY}`);
      partes.push("");
    }

    // Neto (solo si hay ambos lados)
    if (compras.length > 0 && ventas.length > 0) {
      partes.push("──────────");
      if (neto > 0) {
        partes.push(`*Saldo: pago ${neto.toLocaleString("es-AR")} ${CONFIG.CURRENCY}* (a favor de la tienda)`);
      } else if (neto < 0) {
        partes.push(`*Saldo: me pagan ${Math.abs(neto).toLocaleString("es-AR")} ${CONFIG.CURRENCY}*`);
      } else {
        partes.push(`*Saldo: quedamos a mano (0)*`);
      }
      partes.push("");
    }

    return partes.join("\n");
  }

  if (totalItems === 0 && !abierto) {
    return null; // no mostrar nada si está vacío
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setAbierto(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 bg-neon-cyan text-bg-deep px-4 py-3 rounded-full shadow-[0_0_20px_rgba(0,212,255,0.4)] font-body font-bold text-sm uppercase tracking-wider hover:scale-105 transition-transform"
      >
        🛒
        <span className="font-numeric">{totalItems}</span>
      </button>

      {/* Overlay + panel */}
      {abierto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setAbierto(false)} />
          <div className="relative w-full max-w-md bg-bg-deep border-l border-border-strong h-full overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border-base sticky top-0 bg-bg-deep z-10">
              <h2 className="font-display font-bold text-xl text-text-primary">Tu pedido</h2>
              <button onClick={() => setAbierto(false)} className="text-text-muted hover:text-text-primary text-2xl leading-none">×</button>
            </div>

            {lineas.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <p className="font-body text-text-muted">Tu pedido está vacío. Agregá items del catálogo o cotizá productos para vender.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 p-5 space-y-5">
                  {compras.length > 0 && (
                    <Seccion titulo="🛒 Quiero comprar" lineas={compras} quitar={quitar} cambiarCantidad={cambiarCantidad} />
                  )}
                  {ventas.length > 0 && (
                    <Seccion titulo="💰 Quiero vender" lineas={ventas} quitar={quitar} cambiarCantidad={cambiarCantidad} />
                  )}
                </div>

                {/* Footer con totales y acciones */}
                <div className="p-5 border-t border-border-base sticky bottom-0 bg-bg-deep space-y-3">
                  {totalCompra > 0 && (
                    <div className="flex justify-between font-body text-sm">
                      <span className="text-text-secondary">Total compra</span>
                      <span className="font-numeric font-bold text-neon-cyan">{totalCompra.toLocaleString("es-AR")} {CONFIG.CURRENCY}</span>
                    </div>
                  )}
                  {totalVenta > 0 && (
                    <div className="flex justify-between font-body text-sm">
                      <span className="text-text-secondary">Total venta</span>
                      <span className="font-numeric font-bold text-neon-orange">{totalVenta.toLocaleString("es-AR")} {CONFIG.CURRENCY}</span>
                    </div>
                  )}

                  {/* Neto destacado */}
                  {totalCompra > 0 && totalVenta > 0 && (
                    <div className="border-t border-border-base pt-3">
                      {neto === 0 ? (
                        <div className="flex justify-between items-center">
                          <span className="font-body text-sm uppercase tracking-wider text-text-secondary">Saldo</span>
                          <span className="font-numeric font-bold text-lg text-text-primary">Quedan a mano (0)</span>
                        </div>
                      ) : neto > 0 ? (
                        <div className="text-center">
                          <p className="font-body text-[11px] uppercase tracking-widest text-text-muted mb-1">El cliente paga</p>
                          <p className="font-numeric font-black text-3xl neon-text-cyan leading-none">
                            {neto.toLocaleString("es-AR")} <span className="text-base">{CONFIG.CURRENCY}</span>
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="font-body text-[11px] uppercase tracking-widest text-text-muted mb-1">Le pagás al cliente</p>
                          <p className="font-numeric font-black text-3xl neon-text-orange leading-none">
                            {Math.abs(neto).toLocaleString("es-AR")} <span className="text-base">{CONFIG.CURRENCY}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <a
                    href={whatsappLink(armarMensaje())}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-whatsapp w-full block text-center px-6 py-3.5 rounded font-body text-sm uppercase tracking-widest"
                  >
                    Enviar pedido por WhatsApp
                  </a>
                  <button
                    onClick={vaciar}
                    className="w-full px-4 py-2 rounded font-body text-xs uppercase tracking-wider text-text-muted hover:text-danger-red border border-border-base hover:border-danger-red/50 transition-colors"
                  >
                    Vaciar pedido
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Seccion({
  titulo, lineas, quitar, cambiarCantidad,
}: {
  titulo: string;
  lineas: ReturnType<typeof useCarrito>["lineas"];
  quitar: (id: string) => void;
  cambiarCantidad: (id: string, c: number) => void;
}) {
  return (
    <div>
      <p className="font-body text-xs uppercase tracking-widest text-text-muted mb-2">{titulo}</p>
      <div className="space-y-2">
        {lineas.map((l) => (
          <div key={l.id} className="gamer-card rounded-lg p-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm text-text-primary truncate">{l.titulo}</p>
              {l.detalle && <p className="font-body text-[11px] text-text-muted truncate">{l.detalle}</p>}
              <p className="font-numeric text-xs text-neon-orange mt-0.5">{l.precio.toLocaleString("es-AR")} c/u</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <button onClick={() => quitar(l.id)} className="text-text-muted hover:text-danger-red text-sm leading-none">×</button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => cambiarCantidad(l.id, l.cantidad - 1)}
                  className="w-6 h-6 rounded bg-bg-card border border-border-base text-text-secondary hover:text-text-primary font-numeric text-sm"
                >−</button>
                <span className="font-numeric text-sm text-text-primary w-6 text-center">{l.cantidad}</span>
                <button
                  onClick={() => cambiarCantidad(l.id, l.cantidad + 1)}
                  className="w-6 h-6 rounded bg-bg-card border border-border-base text-text-secondary hover:text-text-primary font-numeric text-sm"
                >+</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
