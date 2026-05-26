import type { Metadata, Viewport } from "next";
import { Cinzel, JetBrains_Mono, Orbitron } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { CONFIG } from "@/lib/config";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-cinzel",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-orbitron",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${CONFIG.STORE_NAME} · ${CONFIG.STORE_TAGLINE}`,
  description: "Tienda de items de Mu Online Guerra Eterna. Buscador en vivo, cotizador y consignación.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${cinzel.variable} ${jetbrains.variable} ${orbitron.variable}`}>
      <body className="bg-bg-deep text-text-primary font-body antialiased min-h-screen">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
