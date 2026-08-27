"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import AdminGate from "@/components/AdminGate";
import AdminLayout, { AdminTab } from "@/components/AdminLayout";
import SeccionCatalogo from "./SeccionCatalogo";
import SeccionStock from "./SeccionStock";
import SeccionGemasStock from "./SeccionGemasStock";
import SeccionJoyeriaStock from "./SeccionJoyeriaStock";
import SeccionPrecios from "./SeccionPrecios";
import SeccionAnalytics from "./SeccionAnalytics";
import SeccionMiembros from "./SeccionMiembros";
import SeccionConsignaciones from "./SeccionConsignaciones";
import { contarAbiertas } from "@/lib/consignaciones-admin";

export default function AdminPage() {
  return <AdminGate>{(user) => <AdminShell user={user} />}</AdminGate>;
}

/** Vive adentro del gate: recién acá hay sesión de admin para leer la DB. */
function AdminShell({ user }: { user: User }) {
  const [tab, setTab] = useState<AdminTab>("catalogo");
  const [abiertas, setAbiertas] = useState(0);

  // Badge de consignaciones abiertas (pendientes + parciales): se lee al entrar
  // y la sección lo actualiza cada vez que aprueba/rechaza.
  useEffect(() => {
    contarAbiertas().then(setAbiertas).catch(() => setAbiertas(0));
  }, []);

  return (
    <AdminLayout user={user} activeTab={tab} onTabChange={setTab} badges={{ pendientes: abiertas }}>
      {tab === "catalogo" && <SeccionCatalogo />}
      {tab === "stock" && <SeccionStock />}
      {tab === "gemas" && <SeccionGemasStock />}
      {tab === "joyeria" && <SeccionJoyeriaStock />}
      {tab === "precios" && <SeccionPrecios user={user} />}
      {tab === "analytics" && <SeccionAnalytics />}
      {tab === "miembros" && <SeccionMiembros />}
      {tab === "pendientes" && <SeccionConsignaciones onCambio={setAbiertas} />}
    </AdminLayout>
  );
}
