"use client";

import type { Raza } from "@/lib/database.types";
import { RAZA_COLORS } from "@/lib/razas";

// =====================================================
// Avatar por raza (27/08/2026) + foto propia (M4, 31/08/2026)
// Seis glifos SVG simples y ORIGINALES (no son arte del juego): el arma o
// instrumento característico de cada clase. Cada miembro elige el suyo en
// /miembros y aparece junto a su nombre cuando se apunta a un evento.
// Con `src` (la foto que subió el miembro, DECISIONES §12) el círculo muestra
// la foto y el aro conserva el color de la raza (Santi, 31/08: "foto con
// borde del color de la raza"). Sin foto, el glifo de siempre (fallback).
// =====================================================

export const RAZAS_AVATAR: Raza[] = ["Knight", "Wizard", "Elf", "Gladiator", "Lord", "Summoner"];

/** Nombre como lo dice la guild (Lord = Dark Lord, Gladiator = Magic Gladiator). */
export const RAZA_AVATAR_LABEL: Record<Raza, string> = {
  Knight: "Knight",
  Wizard: "Wizard",
  Elf: "Elf",
  Gladiator: "Magic Gladiator",
  Lord: "Dark Lord",
  Summoner: "Summoner",
};

/** Paths en un viewBox 0 0 24 24, trazo 2, sin relleno salvo donde se indica. */
const GLIFOS: Record<Raza, JSX.Element> = {
  // Espada vertical con guarda
  Knight: (
    <>
      <path d="M12 3v13" />
      <path d="M8 9h8" />
      <path d="M10 16h4l-1 4h-2z" />
    </>
  ),
  // Bastón con orbe
  Wizard: (
    <>
      <path d="M12 9v12" />
      <circle cx="12" cy="6" r="3" />
      <path d="M9 7.5l-2 2M15 7.5l2 2" />
    </>
  ),
  // Arco con flecha
  Elf: (
    <>
      <path d="M7 4c6 2 6 14 0 16" />
      <path d="M7 4v16" />
      <path d="M7 12h11" />
      <path d="M15 9l3 3-3 3" />
    </>
  ),
  // Espada curva cruzada con un rayo (arma + magia)
  Gladiator: (
    <>
      <path d="M5 19L17 5" />
      <path d="M14 5h3v3" />
      <path d="M13 12l5 3-3 1 2 4" />
    </>
  ),
  // Cetro con corona
  Lord: (
    <>
      <path d="M12 9v12" />
      <path d="M7 8l2-4 3 3 3-3 2 4z" />
      <path d="M9 21h6" />
    </>
  ),
  // Libro abierto con runa
  Summoner: (
    <>
      <path d="M4 6h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4z" />
      <path d="M20 6h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z" />
      <path d="M7 11h2M15 11h2M7 14h2M15 14h2" />
    </>
  ),
};

interface Props {
  raza: Raza | null | undefined;
  /** Foto del miembro (URL pública del bucket `avatares`). Sin src → glifo de raza. */
  src?: string | null;
  /** Diámetro en px. */
  size?: number;
  className?: string;
  title?: string;
}

/**
 * Círculo con el color de la raza y, adentro, la foto del miembro si la tiene
 * o el glifo de la raza. Sin raza ni foto: un signo de pregunta apagado
 * (miembro que todavía no eligió avatar).
 */
export default function AvatarRaza({ raza, src, size = 28, className = "", title }: Props) {
  const color = raza ? RAZA_COLORS[raza] : "#5a5a6e";
  const label = title ?? (raza ? RAZA_AVATAR_LABEL[raza] : "Sin avatar");
  const borde = size >= 40 ? 2 : 1.5;
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-full shrink-0 overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        background: `${color}22`,
        border: `${borde}px solid ${color}`,
        boxShadow: raza ? `0 0 8px ${color}55` : undefined,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- bucket externo, tamaño fijo, sin next/image
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover rounded-full"
          draggable={false}
        />
      ) : (
      <svg
        viewBox="0 0 24 24"
        width={size * 0.62}
        height={size * 0.62}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {raza ? GLIFOS[raza] : <path d="M9 9a3 3 0 1 1 4 2.8c-.7.4-1 .9-1 1.7M12 17h.01" />}
      </svg>
      )}
    </span>
  );
}
