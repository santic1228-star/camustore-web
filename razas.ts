/**
 * Mapeo de nombre de item → raza/clase de Mu Online.
 * Mismo mapeo que el Excel.
 */

import type { Raza } from "./types";

export const RAZA_MAP: Record<string, Raza> = {
  // Knight
  leather: "Knight",
  scale: "Knight",
  "dragon knight": "Knight",
  "great dragon": "Knight",
  "dark phoenix": "Knight",
  titan: "Knight",
  brave: "Knight",
  flameberge: "Knight",
  breaker: "Knight",

  // Wizard
  "dark soul": "Wizard",
  "grand soul": "Wizard",
  "venom mist": "Wizard",
  "grand viper": "Wizard",

  // Elf
  guardian: "Elf",
  sylphid: "Elf",
  seraphim: "Elf",

  // Gladiator
  hurricane: "Gladiator",
  volcano: "Gladiator",
  explosive: "Gladiator",

  // Lord
  "light plate": "Lord",
  adamantine: "Lord",
  "dark master": "Lord",
  sunlight: "Lord",
  royal: "Lord",
  soleil: "Lord",

  // Summoner
  "red wing": "Summoner",
  "storm blitz": "Summoner",
  queen: "Summoner",
  eternal: "Summoner",
};

export function getRaza(nombre: string): Raza {
  return RAZA_MAP[nombre.toLowerCase()] || "";
}

export const RAZAS: Raza[] = ["Knight", "Wizard", "Elf", "Gladiator", "Lord", "Summoner"];

// Colores de la UI por raza (subtle accent en cards)
export const RAZA_COLORS: Record<Raza, string> = {
  Knight: "#ff6b6b",
  Wizard: "#7c4dff",
  Elf: "#52d273",
  Gladiator: "#ff9800",
  Lord: "#ffd700",
  Summoner: "#e91e63",
  "": "#888899",
};
