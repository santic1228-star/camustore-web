"use client";

import { useState } from "react";
import AdminGate from "@/components/AdminGate";
import AdminLayout, { AdminTab } from "@/components/AdminLayout";
import SeccionCatalogo from "./SeccionCatalogo";
import SeccionStock from "./SeccionStock";
import SeccionGemasStock from "./SeccionGemasStock";
import SeccionJoyeriaStock from "./SeccionJoyeriaStock";
import SeccionAnalytics from "./SeccionAnalytics";
import SeccionMiembros from "./SeccionMiembros";

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("catalogo");

  return (
    <AdminGate>
      {(user) => (
        <AdminLayout user={user} activeTab={tab} onTabChange={setTab}>
          {tab === "catalogo" && <SeccionCatalogo />}
          {tab === "stock" && <SeccionStock />}
          {tab === "gemas" && <SeccionGemasStock />}
          {tab === "joyeria" && <SeccionJoyeriaStock />}
          {tab === "analytics" && <SeccionAnalytics />}
          {tab === "miembros" && <SeccionMiembros />}
          {tab === "pendientes" && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">⏳</p>
              <p className="font-display text-xl text-text-primary mb-2">Pendientes</p>
              <p className="font-body text-sm text-text-secondary">
                Próximamente: lista de consignaciones de jugadores pendientes de aprobación.
              </p>
            </div>
          )}
        </AdminLayout>
      )}
    </AdminGate>
  );
}
