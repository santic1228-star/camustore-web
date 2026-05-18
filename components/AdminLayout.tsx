"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

export type AdminTab = "catalogo" | "stock" | "pendientes";

interface Props {
  user: User;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  children: ReactNode;
}

const TABS: { id: AdminTab; label: string; icon: string }[] = [
  { id: "catalogo", label: "Catálogo", icon: "📦" },
  { id: "stock", label: "Jewels & Seeds", icon: "💎" },
  { id: "pendientes", label: "Pendientes", icon: "⏳" },
];

export default function AdminLayout({ user, activeTab, onTabChange, children }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header admin */}
      <header className="border-b border-border-base bg-bg-deep/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded border border-neon-cyan/50 bg-bg-card flex items-center justify-center text-neon-cyan font-display font-black text-sm">
                C
              </div>
              <span className="font-display font-bold text-base text-text-primary">
                CamuStore
              </span>
            </Link>
            <span className="badge bg-neon-orange/15 text-neon-orange border border-neon-orange/40">
              ADMIN
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block font-body text-xs text-text-secondary">
              {user.email}
            </span>
            <button
              onClick={() => signOut().then(() => location.reload())}
              className="px-3 py-1.5 rounded font-body text-xs uppercase tracking-wider text-text-secondary hover:text-danger-red border border-border-base hover:border-danger-red/50 transition-colors"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 sm:gap-2 overflow-x-auto pb-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`shrink-0 px-3 sm:px-4 py-2 rounded font-body text-xs sm:text-sm uppercase tracking-wider transition-colors ${
                activeTab === t.id
                  ? "bg-neon-cyan/15 border border-neon-cyan/60 text-neon-cyan"
                  : "bg-bg-card border border-border-base text-text-secondary hover:border-border-strong hover:text-text-primary"
              }`}
            >
              <span className="mr-1.5">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
