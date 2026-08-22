"use client";

import Navbar from "@/components/Navbar";
import MiembroGate from "@/components/MiembroGate";
import ZonaMiembros from "./ZonaMiembros";

/**
 * /miembros — zona con login: timers compartidos de Gaion, Kundun y Cryonox.
 * Entra quien está en la tabla `miembros` (alta manual desde el admin) o el admin.
 */
export default function MiembrosPage() {
  return (
    <>
      <Navbar />
      <MiembroGate>{(sesion) => <ZonaMiembros sesion={sesion} />}</MiembroGate>
    </>
  );
}
