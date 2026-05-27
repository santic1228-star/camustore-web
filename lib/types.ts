/**
 * Tipos para el catálogo de items.
 */

export type Raza = "Knight" | "Wizard" | "Elf" | "Gladiator" | "Lord" | "Summoner" | "";
export type Tipo = "s3" | "380" | "400" | "alas";
export type Categoria = "armadura" | "arma" | "ala" | "escudo" | "jewel" | "seed";

export interface Item {
  id: string;
  nombre: string;
  parte: string;
  raza: Raza;
  nivel: number;
  opciones: string;
  luck: boolean;
  tipo: Tipo | null;
  socket: number | null;
  precio_venta: number;
  categoria: Categoria;
}
