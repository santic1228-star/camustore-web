import Link from "next/link";
import { CONFIG } from "@/lib/config";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-bg-deep/80 border-b border-border-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link href="/" className="group flex items-center gap-2">
          <div className="w-8 h-8 rounded border border-neon-cyan/50 bg-bg-card flex items-center justify-center text-neon-cyan font-display font-black text-lg group-hover:shadow-[0_0_15px_rgba(0,212,255,0.6)] transition-shadow">
            C
          </div>
          <span className="hidden sm:inline font-display font-bold text-lg sm:text-xl tracking-wider text-text-primary group-hover:neon-text-cyan transition-colors">
            {CONFIG.STORE_NAME}
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <NavLink href="/items">Catálogo</NavLink>
          <NavLink href="/cotizador">Cotizador</NavLink>
          <NavLink href="/consignar">Consignar</NavLink>
          <NavLink href="/herramientas">Herramientas</NavLink>
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-2 sm:px-3 py-1.5 rounded text-text-secondary hover:text-neon-cyan hover:bg-bg-card-hover transition-colors font-body font-medium"
    >
      {children}
    </Link>
  );
}
