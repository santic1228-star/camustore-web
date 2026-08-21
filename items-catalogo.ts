// =====================================================
// CamuStore - CATÁLOGO DE ITEMS
// =====================================================
// Generado automáticamente. Lista cerrada de items del server.
// Cada item tiene su raza principal y los tipos disponibles (s3/380/400).

import type { Raza } from "./database.types";

export type TipoEquipo = "s3" | "380" | "400";
export type ParteEquipo = "helm" | "armor" | "pants" | "gloves" | "boots" | "weapon";

export interface ItemCatalogo {
  id: string;                  // slug único
  categoria: "armadura" | "arma";
  nombre: string;              // nombre legible (ej "Dragon Helm")
  set: string | null;          // nombre del set (solo armaduras: "Dragon", "Plate", etc.)
  parte: ParteEquipo;
  raza: Raza;                  // raza principal del item
  tipos: TipoEquipo[];         // tipos disponibles (no todos los items tienen los 3)
}

export const ITEMS_CATALOGO: ItemCatalogo[] = [
  {
    "id": "dragon_knight_helm_knight",
    "categoria": "armadura",
    "nombre": "Dragon Knight Helm",
    "set": "Dragon Knight",
    "parte": "helm",
    "raza": "Knight",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "dragon_knight_armor_knight",
    "categoria": "armadura",
    "nombre": "Dragon Knight Armor",
    "set": "Dragon Knight",
    "parte": "armor",
    "raza": "Knight",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "dragon_knight_pants_knight",
    "categoria": "armadura",
    "nombre": "Dragon Knight Pants",
    "set": "Dragon Knight",
    "parte": "pants",
    "raza": "Knight",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "dragon_knight_gloves_knight",
    "categoria": "armadura",
    "nombre": "Dragon Knight Gloves",
    "set": "Dragon Knight",
    "parte": "gloves",
    "raza": "Knight",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "dragon_knight_boots_knight",
    "categoria": "armadura",
    "nombre": "Dragon Knight Boots",
    "set": "Dragon Knight",
    "parte": "boots",
    "raza": "Knight",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "titan_helm_knight",
    "categoria": "armadura",
    "nombre": "Titan Helm",
    "set": "Titan",
    "parte": "helm",
    "raza": "Knight",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "titan_armor_knight",
    "categoria": "armadura",
    "nombre": "Titan Armor",
    "set": "Titan",
    "parte": "armor",
    "raza": "Knight",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "titan_pants_knight",
    "categoria": "armadura",
    "nombre": "Titan Pants",
    "set": "Titan",
    "parte": "pants",
    "raza": "Knight",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "titan_gloves_knight",
    "categoria": "armadura",
    "nombre": "Titan Gloves",
    "set": "Titan",
    "parte": "gloves",
    "raza": "Knight",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "titan_boots_knight",
    "categoria": "armadura",
    "nombre": "Titan Boots",
    "set": "Titan",
    "parte": "boots",
    "raza": "Knight",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "brave_helm_knight",
    "categoria": "armadura",
    "nombre": "Brave Helm",
    "set": "Brave",
    "parte": "helm",
    "raza": "Knight",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "brave_armor_knight",
    "categoria": "armadura",
    "nombre": "Brave Armor",
    "set": "Brave",
    "parte": "armor",
    "raza": "Knight",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "brave_pants_knight",
    "categoria": "armadura",
    "nombre": "Brave Pants",
    "set": "Brave",
    "parte": "pants",
    "raza": "Knight",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "brave_gloves_knight",
    "categoria": "armadura",
    "nombre": "Brave Gloves",
    "set": "Brave",
    "parte": "gloves",
    "raza": "Knight",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "brave_boots_knight",
    "categoria": "armadura",
    "nombre": "Brave Boots",
    "set": "Brave",
    "parte": "boots",
    "raza": "Knight",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "bronze_helm_knight",
    "categoria": "armadura",
    "nombre": "Bronze Helm",
    "set": "Bronze",
    "parte": "helm",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "bronze_armor_knight",
    "categoria": "armadura",
    "nombre": "Bronze Armor",
    "set": "Bronze",
    "parte": "armor",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "bronze_pants_knight",
    "categoria": "armadura",
    "nombre": "Bronze Pants",
    "set": "Bronze",
    "parte": "pants",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "bronze_gloves_knight",
    "categoria": "armadura",
    "nombre": "Bronze Gloves",
    "set": "Bronze",
    "parte": "gloves",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "bronze_boots_knight",
    "categoria": "armadura",
    "nombre": "Bronze Boots",
    "set": "Bronze",
    "parte": "boots",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "leather_helm_knight",
    "categoria": "armadura",
    "nombre": "Leather Helm",
    "set": "Leather",
    "parte": "helm",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "leather_armor_knight",
    "categoria": "armadura",
    "nombre": "Leather Armor",
    "set": "Leather",
    "parte": "armor",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "leather_pants_knight",
    "categoria": "armadura",
    "nombre": "Leather Pants",
    "set": "Leather",
    "parte": "pants",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "leather_gloves_knight",
    "categoria": "armadura",
    "nombre": "Leather Gloves",
    "set": "Leather",
    "parte": "gloves",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "leather_boots_knight",
    "categoria": "armadura",
    "nombre": "Leather Boots",
    "set": "Leather",
    "parte": "boots",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "scale_helm_knight",
    "categoria": "armadura",
    "nombre": "Scale Helm",
    "set": "Scale",
    "parte": "helm",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "scale_armor_knight",
    "categoria": "armadura",
    "nombre": "Scale Armor",
    "set": "Scale",
    "parte": "armor",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "scale_pants_knight",
    "categoria": "armadura",
    "nombre": "Scale Pants",
    "set": "Scale",
    "parte": "pants",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "scale_gloves_knight",
    "categoria": "armadura",
    "nombre": "Scale Gloves",
    "set": "Scale",
    "parte": "gloves",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "scale_boots_knight",
    "categoria": "armadura",
    "nombre": "Scale Boots",
    "set": "Scale",
    "parte": "boots",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "brass_helm_knight",
    "categoria": "armadura",
    "nombre": "Brass Helm",
    "set": "Brass",
    "parte": "helm",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "brass_armor_knight",
    "categoria": "armadura",
    "nombre": "Brass Armor",
    "set": "Brass",
    "parte": "armor",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "brass_pants_knight",
    "categoria": "armadura",
    "nombre": "Brass Pants",
    "set": "Brass",
    "parte": "pants",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "brass_gloves_knight",
    "categoria": "armadura",
    "nombre": "Brass Gloves",
    "set": "Brass",
    "parte": "gloves",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "brass_boots_knight",
    "categoria": "armadura",
    "nombre": "Brass Boots",
    "set": "Brass",
    "parte": "boots",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "plate_helm_knight",
    "categoria": "armadura",
    "nombre": "Plate Helm",
    "set": "Plate",
    "parte": "helm",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "plate_armor_knight",
    "categoria": "armadura",
    "nombre": "Plate Armor",
    "set": "Plate",
    "parte": "armor",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "plate_pants_knight",
    "categoria": "armadura",
    "nombre": "Plate Pants",
    "set": "Plate",
    "parte": "pants",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "plate_gloves_knight",
    "categoria": "armadura",
    "nombre": "Plate Gloves",
    "set": "Plate",
    "parte": "gloves",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "plate_boots_knight",
    "categoria": "armadura",
    "nombre": "Plate Boots",
    "set": "Plate",
    "parte": "boots",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dragon_helm_knight",
    "categoria": "armadura",
    "nombre": "Dragon Helm",
    "set": "Dragon",
    "parte": "helm",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dragon_armor_knight",
    "categoria": "armadura",
    "nombre": "Dragon Armor",
    "set": "Dragon",
    "parte": "armor",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dragon_pants_knight",
    "categoria": "armadura",
    "nombre": "Dragon Pants",
    "set": "Dragon",
    "parte": "pants",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dragon_gloves_knight",
    "categoria": "armadura",
    "nombre": "Dragon Gloves",
    "set": "Dragon",
    "parte": "gloves",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dragon_boots_knight",
    "categoria": "armadura",
    "nombre": "Dragon Boots",
    "set": "Dragon",
    "parte": "boots",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "black_dragon_helm_knight",
    "categoria": "armadura",
    "nombre": "Black Dragon Helm",
    "set": "Black Dragon",
    "parte": "helm",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "black_dragon_armor_knight",
    "categoria": "armadura",
    "nombre": "Black Dragon Armor",
    "set": "Black Dragon",
    "parte": "armor",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "black_dragon_pants_knight",
    "categoria": "armadura",
    "nombre": "Black Dragon Pants",
    "set": "Black Dragon",
    "parte": "pants",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "black_dragon_gloves_knight",
    "categoria": "armadura",
    "nombre": "Black Dragon Gloves",
    "set": "Black Dragon",
    "parte": "gloves",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "black_dragon_boots_knight",
    "categoria": "armadura",
    "nombre": "Black Dragon Boots",
    "set": "Black Dragon",
    "parte": "boots",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "great_dragon_helm_knight",
    "categoria": "armadura",
    "nombre": "Great Dragon Helm",
    "set": "Great Dragon",
    "parte": "helm",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "great_dragon_armor_knight",
    "categoria": "armadura",
    "nombre": "Great Dragon Armor",
    "set": "Great Dragon",
    "parte": "armor",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "great_dragon_pants_knight",
    "categoria": "armadura",
    "nombre": "Great Dragon Pants",
    "set": "Great Dragon",
    "parte": "pants",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "great_dragon_gloves_knight",
    "categoria": "armadura",
    "nombre": "Great Dragon Gloves",
    "set": "Great Dragon",
    "parte": "gloves",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "great_dragon_boots_knight",
    "categoria": "armadura",
    "nombre": "Great Dragon Boots",
    "set": "Great Dragon",
    "parte": "boots",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dark_phoenix_helm_knight",
    "categoria": "armadura",
    "nombre": "Dark Phoenix Helm",
    "set": "Dark Phoenix",
    "parte": "helm",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dark_phoenix_armor_knight",
    "categoria": "armadura",
    "nombre": "Dark Phoenix Armor",
    "set": "Dark Phoenix",
    "parte": "armor",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dark_phoenix_pants_knight",
    "categoria": "armadura",
    "nombre": "Dark Phoenix Pants",
    "set": "Dark Phoenix",
    "parte": "pants",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dark_phoenix_gloves_knight",
    "categoria": "armadura",
    "nombre": "Dark Phoenix Gloves",
    "set": "Dark Phoenix",
    "parte": "gloves",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dark_phoenix_boots_knight",
    "categoria": "armadura",
    "nombre": "Dark Phoenix Boots",
    "set": "Dark Phoenix",
    "parte": "boots",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "venom_mist_helm_wizard",
    "categoria": "armadura",
    "nombre": "Venom Mist Helm",
    "set": "Venom Mist",
    "parte": "helm",
    "raza": "Wizard",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "venom_mist_armor_wizard",
    "categoria": "armadura",
    "nombre": "Venom Mist Armor",
    "set": "Venom Mist",
    "parte": "armor",
    "raza": "Wizard",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "venom_mist_pants_wizard",
    "categoria": "armadura",
    "nombre": "Venom Mist Pants",
    "set": "Venom Mist",
    "parte": "pants",
    "raza": "Wizard",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "venom_mist_gloves_wizard",
    "categoria": "armadura",
    "nombre": "Venom Mist Gloves",
    "set": "Venom Mist",
    "parte": "gloves",
    "raza": "Wizard",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "venom_mist_boots_wizard",
    "categoria": "armadura",
    "nombre": "Venom Mist Boots",
    "set": "Venom Mist",
    "parte": "boots",
    "raza": "Wizard",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "hades_helm_wizard",
    "categoria": "armadura",
    "nombre": "Hades Helm",
    "set": "Hades",
    "parte": "helm",
    "raza": "Wizard",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "hades_armor_wizard",
    "categoria": "armadura",
    "nombre": "Hades Armor",
    "set": "Hades",
    "parte": "armor",
    "raza": "Wizard",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "hades_pants_wizard",
    "categoria": "armadura",
    "nombre": "Hades Pants",
    "set": "Hades",
    "parte": "pants",
    "raza": "Wizard",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "hades_gloves_wizard",
    "categoria": "armadura",
    "nombre": "Hades Gloves",
    "set": "Hades",
    "parte": "gloves",
    "raza": "Wizard",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "hades_boots_wizard",
    "categoria": "armadura",
    "nombre": "Hades Boots",
    "set": "Hades",
    "parte": "boots",
    "raza": "Wizard",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "grand_soul_helm_wizard",
    "categoria": "armadura",
    "nombre": "Grand Soul Helm",
    "set": "Grand Soul",
    "parte": "helm",
    "raza": "Wizard",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "grand_soul_armor_wizard",
    "categoria": "armadura",
    "nombre": "Grand Soul Armor",
    "set": "Grand Soul",
    "parte": "armor",
    "raza": "Wizard",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "grand_soul_pants_wizard",
    "categoria": "armadura",
    "nombre": "Grand Soul Pants",
    "set": "Grand Soul",
    "parte": "pants",
    "raza": "Wizard",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "grand_soul_gloves_wizard",
    "categoria": "armadura",
    "nombre": "Grand Soul Gloves",
    "set": "Grand Soul",
    "parte": "gloves",
    "raza": "Wizard",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "grand_soul_boots_wizard",
    "categoria": "armadura",
    "nombre": "Grand Soul Boots",
    "set": "Grand Soul",
    "parte": "boots",
    "raza": "Wizard",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dark_soul_helm_wizard",
    "categoria": "armadura",
    "nombre": "Dark Soul Helm",
    "set": "Dark Soul",
    "parte": "helm",
    "raza": "Wizard",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dark_soul_armor_wizard",
    "categoria": "armadura",
    "nombre": "Dark Soul Armor",
    "set": "Dark Soul",
    "parte": "armor",
    "raza": "Wizard",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dark_soul_pants_wizard",
    "categoria": "armadura",
    "nombre": "Dark Soul Pants",
    "set": "Dark Soul",
    "parte": "pants",
    "raza": "Wizard",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dark_soul_gloves_wizard",
    "categoria": "armadura",
    "nombre": "Dark Soul Gloves",
    "set": "Dark Soul",
    "parte": "gloves",
    "raza": "Wizard",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dark_soul_boots_wizard",
    "categoria": "armadura",
    "nombre": "Dark Soul Boots",
    "set": "Dark Soul",
    "parte": "boots",
    "raza": "Wizard",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "legendary_helm_wizard",
    "categoria": "armadura",
    "nombre": "Legendary Helm",
    "set": "Legendary",
    "parte": "helm",
    "raza": "Wizard",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "legendary_armor_wizard",
    "categoria": "armadura",
    "nombre": "Legendary Armor",
    "set": "Legendary",
    "parte": "armor",
    "raza": "Wizard",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "legendary_pants_wizard",
    "categoria": "armadura",
    "nombre": "Legendary Pants",
    "set": "Legendary",
    "parte": "pants",
    "raza": "Wizard",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "legendary_gloves_wizard",
    "categoria": "armadura",
    "nombre": "Legendary Gloves",
    "set": "Legendary",
    "parte": "gloves",
    "raza": "Wizard",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "legendary_boots_wizard",
    "categoria": "armadura",
    "nombre": "Legendary Boots",
    "set": "Legendary",
    "parte": "boots",
    "raza": "Wizard",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "eclipse_helm_wizard",
    "categoria": "armadura",
    "nombre": "Eclipse Helm",
    "set": "Eclipse",
    "parte": "helm",
    "raza": "Wizard",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "eclipse_armor_wizard",
    "categoria": "armadura",
    "nombre": "Eclipse Armor",
    "set": "Eclipse",
    "parte": "armor",
    "raza": "Wizard",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "eclipse_pants_wizard",
    "categoria": "armadura",
    "nombre": "Eclipse Pants",
    "set": "Eclipse",
    "parte": "pants",
    "raza": "Wizard",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "eclipse_gloves_wizard",
    "categoria": "armadura",
    "nombre": "Eclipse Gloves",
    "set": "Eclipse",
    "parte": "gloves",
    "raza": "Wizard",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "eclipse_boots_wizard",
    "categoria": "armadura",
    "nombre": "Eclipse Boots",
    "set": "Eclipse",
    "parte": "boots",
    "raza": "Wizard",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "sylphid_ray_helm_elf",
    "categoria": "armadura",
    "nombre": "Sylphid Ray Helm",
    "set": "Sylphid Ray",
    "parte": "helm",
    "raza": "Elf",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "sylphid_ray_armor_elf",
    "categoria": "armadura",
    "nombre": "Sylphid Ray Armor",
    "set": "Sylphid Ray",
    "parte": "armor",
    "raza": "Elf",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "sylphid_ray_pants_elf",
    "categoria": "armadura",
    "nombre": "Sylphid Ray Pants",
    "set": "Sylphid Ray",
    "parte": "pants",
    "raza": "Elf",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "sylphid_ray_gloves_elf",
    "categoria": "armadura",
    "nombre": "Sylphid Ray Gloves",
    "set": "Sylphid Ray",
    "parte": "gloves",
    "raza": "Elf",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "sylphid_ray_boots_elf",
    "categoria": "armadura",
    "nombre": "Sylphid Ray Boots",
    "set": "Sylphid Ray",
    "parte": "boots",
    "raza": "Elf",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "divine_helm_elf",
    "categoria": "armadura",
    "nombre": "Divine Helm",
    "set": "Divine",
    "parte": "helm",
    "raza": "Elf",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "divine_armor_elf",
    "categoria": "armadura",
    "nombre": "Divine Armor",
    "set": "Divine",
    "parte": "armor",
    "raza": "Elf",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "divine_pants_elf",
    "categoria": "armadura",
    "nombre": "Divine Pants",
    "set": "Divine",
    "parte": "pants",
    "raza": "Elf",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "divine_gloves_elf",
    "categoria": "armadura",
    "nombre": "Divine Gloves",
    "set": "Divine",
    "parte": "gloves",
    "raza": "Elf",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "divine_boots_elf",
    "categoria": "armadura",
    "nombre": "Divine Boots",
    "set": "Divine",
    "parte": "boots",
    "raza": "Elf",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "seraphim_helm_elf",
    "categoria": "armadura",
    "nombre": "Seraphim Helm",
    "set": "Seraphim",
    "parte": "helm",
    "raza": "Elf",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "seraphim_armor_elf",
    "categoria": "armadura",
    "nombre": "Seraphim Armor",
    "set": "Seraphim",
    "parte": "armor",
    "raza": "Elf",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "seraphim_pants_elf",
    "categoria": "armadura",
    "nombre": "Seraphim Pants",
    "set": "Seraphim",
    "parte": "pants",
    "raza": "Elf",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "seraphim_gloves_elf",
    "categoria": "armadura",
    "nombre": "Seraphim Gloves",
    "set": "Seraphim",
    "parte": "gloves",
    "raza": "Elf",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "seraphim_boots_elf",
    "categoria": "armadura",
    "nombre": "Seraphim Boots",
    "set": "Seraphim",
    "parte": "boots",
    "raza": "Elf",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "guardian_helm_elf",
    "categoria": "armadura",
    "nombre": "Guardian Helm",
    "set": "Guardian",
    "parte": "helm",
    "raza": "Elf",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "guardian_armor_elf",
    "categoria": "armadura",
    "nombre": "Guardian Armor",
    "set": "Guardian",
    "parte": "armor",
    "raza": "Elf",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "guardian_pants_elf",
    "categoria": "armadura",
    "nombre": "Guardian Pants",
    "set": "Guardian",
    "parte": "pants",
    "raza": "Elf",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "guardian_gloves_elf",
    "categoria": "armadura",
    "nombre": "Guardian Gloves",
    "set": "Guardian",
    "parte": "gloves",
    "raza": "Elf",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "guardian_boots_elf",
    "categoria": "armadura",
    "nombre": "Guardian Boots",
    "set": "Guardian",
    "parte": "boots",
    "raza": "Elf",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "wind_helm_elf",
    "categoria": "armadura",
    "nombre": "Wind Helm",
    "set": "Wind",
    "parte": "helm",
    "raza": "Elf",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "wind_armor_elf",
    "categoria": "armadura",
    "nombre": "Wind Armor",
    "set": "Wind",
    "parte": "armor",
    "raza": "Elf",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "wind_pants_elf",
    "categoria": "armadura",
    "nombre": "Wind Pants",
    "set": "Wind",
    "parte": "pants",
    "raza": "Elf",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "wind_gloves_elf",
    "categoria": "armadura",
    "nombre": "Wind Gloves",
    "set": "Wind",
    "parte": "gloves",
    "raza": "Elf",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "wind_boots_elf",
    "categoria": "armadura",
    "nombre": "Wind Boots",
    "set": "Wind",
    "parte": "boots",
    "raza": "Elf",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "iris_helm_elf",
    "categoria": "armadura",
    "nombre": "Iris Helm",
    "set": "Iris",
    "parte": "helm",
    "raza": "Elf",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "iris_armor_elf",
    "categoria": "armadura",
    "nombre": "Iris Armor",
    "set": "Iris",
    "parte": "armor",
    "raza": "Elf",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "iris_pants_elf",
    "categoria": "armadura",
    "nombre": "Iris Pants",
    "set": "Iris",
    "parte": "pants",
    "raza": "Elf",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "iris_gloves_elf",
    "categoria": "armadura",
    "nombre": "Iris Gloves",
    "set": "Iris",
    "parte": "gloves",
    "raza": "Elf",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "iris_boots_elf",
    "categoria": "armadura",
    "nombre": "Iris Boots",
    "set": "Iris",
    "parte": "boots",
    "raza": "Elf",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "red_sprit_helm_elf",
    "categoria": "armadura",
    "nombre": "Red Sprit Helm",
    "set": "Red Sprit",
    "parte": "helm",
    "raza": "Elf",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "red_sprit_armor_elf",
    "categoria": "armadura",
    "nombre": "Red Sprit Armor",
    "set": "Red Sprit",
    "parte": "armor",
    "raza": "Elf",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "red_sprit_pants_elf",
    "categoria": "armadura",
    "nombre": "Red Sprit Pants",
    "set": "Red Sprit",
    "parte": "pants",
    "raza": "Elf",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "red_sprit_gloves_elf",
    "categoria": "armadura",
    "nombre": "Red Sprit Gloves",
    "set": "Red Sprit",
    "parte": "gloves",
    "raza": "Elf",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "red_sprit_boots_elf",
    "categoria": "armadura",
    "nombre": "Red Sprit Boots",
    "set": "Red Sprit",
    "parte": "boots",
    "raza": "Elf",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "volcano_helm_gladiator",
    "categoria": "armadura",
    "nombre": "Volcano Helm",
    "set": "Volcano",
    "parte": "helm",
    "raza": "Gladiator",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "volcano_armor_gladiator",
    "categoria": "armadura",
    "nombre": "Volcano Armor",
    "set": "Volcano",
    "parte": "armor",
    "raza": "Gladiator",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "volcano_pants_gladiator",
    "categoria": "armadura",
    "nombre": "Volcano Pants",
    "set": "Volcano",
    "parte": "pants",
    "raza": "Gladiator",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "volcano_gloves_gladiator",
    "categoria": "armadura",
    "nombre": "Volcano Gloves",
    "set": "Volcano",
    "parte": "gloves",
    "raza": "Gladiator",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "volcano_boots_gladiator",
    "categoria": "armadura",
    "nombre": "Volcano Boots",
    "set": "Volcano",
    "parte": "boots",
    "raza": "Gladiator",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "phantom_helm_gladiator",
    "categoria": "armadura",
    "nombre": "Phantom Helm",
    "set": "Phantom",
    "parte": "helm",
    "raza": "Gladiator",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "phantom_armor_gladiator",
    "categoria": "armadura",
    "nombre": "Phantom Armor",
    "set": "Phantom",
    "parte": "armor",
    "raza": "Gladiator",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "phantom_pants_gladiator",
    "categoria": "armadura",
    "nombre": "Phantom Pants",
    "set": "Phantom",
    "parte": "pants",
    "raza": "Gladiator",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "phantom_gloves_gladiator",
    "categoria": "armadura",
    "nombre": "Phantom Gloves",
    "set": "Phantom",
    "parte": "gloves",
    "raza": "Gladiator",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "phantom_boots_gladiator",
    "categoria": "armadura",
    "nombre": "Phantom Boots",
    "set": "Phantom",
    "parte": "boots",
    "raza": "Gladiator",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "destroy_helm_gladiator",
    "categoria": "armadura",
    "nombre": "Destroy Helm",
    "set": "Destroy",
    "parte": "helm",
    "raza": "Gladiator",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "destroy_armor_gladiator",
    "categoria": "armadura",
    "nombre": "Destroy Armor",
    "set": "Destroy",
    "parte": "armor",
    "raza": "Gladiator",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "destroy_pants_gladiator",
    "categoria": "armadura",
    "nombre": "Destroy Pants",
    "set": "Destroy",
    "parte": "pants",
    "raza": "Gladiator",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "destroy_gloves_gladiator",
    "categoria": "armadura",
    "nombre": "Destroy Gloves",
    "set": "Destroy",
    "parte": "gloves",
    "raza": "Gladiator",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "destroy_boots_gladiator",
    "categoria": "armadura",
    "nombre": "Destroy Boots",
    "set": "Destroy",
    "parte": "boots",
    "raza": "Gladiator",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "thunder_hawk_helm_gladiator",
    "categoria": "armadura",
    "nombre": "Thunder Hawk Helm",
    "set": "Thunder Hawk",
    "parte": "helm",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "thunder_hawk_armor_gladiator",
    "categoria": "armadura",
    "nombre": "Thunder Hawk Armor",
    "set": "Thunder Hawk",
    "parte": "armor",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "thunder_hawk_pants_gladiator",
    "categoria": "armadura",
    "nombre": "Thunder Hawk Pants",
    "set": "Thunder Hawk",
    "parte": "pants",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "thunder_hawk_gloves_gladiator",
    "categoria": "armadura",
    "nombre": "Thunder Hawk Gloves",
    "set": "Thunder Hawk",
    "parte": "gloves",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "thunder_hawk_boots_gladiator",
    "categoria": "armadura",
    "nombre": "Thunder Hawk Boots",
    "set": "Thunder Hawk",
    "parte": "boots",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "storm_crow_helm_gladiator",
    "categoria": "armadura",
    "nombre": "Storm Crow Helm",
    "set": "Storm Crow",
    "parte": "helm",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "storm_crow_armor_gladiator",
    "categoria": "armadura",
    "nombre": "Storm Crow Armor",
    "set": "Storm Crow",
    "parte": "armor",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "storm_crow_pants_gladiator",
    "categoria": "armadura",
    "nombre": "Storm Crow Pants",
    "set": "Storm Crow",
    "parte": "pants",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "storm_crow_gloves_gladiator",
    "categoria": "armadura",
    "nombre": "Storm Crow Gloves",
    "set": "Storm Crow",
    "parte": "gloves",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "storm_crow_boots_gladiator",
    "categoria": "armadura",
    "nombre": "Storm Crow Boots",
    "set": "Storm Crow",
    "parte": "boots",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "hurricane_helm_gladiator",
    "categoria": "armadura",
    "nombre": "Hurricane Helm",
    "set": "Hurricane",
    "parte": "helm",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "hurricane_armor_gladiator",
    "categoria": "armadura",
    "nombre": "Hurricane Armor",
    "set": "Hurricane",
    "parte": "armor",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "hurricane_pants_gladiator",
    "categoria": "armadura",
    "nombre": "Hurricane Pants",
    "set": "Hurricane",
    "parte": "pants",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "hurricane_gloves_gladiator",
    "categoria": "armadura",
    "nombre": "Hurricane Gloves",
    "set": "Hurricane",
    "parte": "gloves",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "hurricane_boots_gladiator",
    "categoria": "armadura",
    "nombre": "Hurricane Boots",
    "set": "Hurricane",
    "parte": "boots",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "ashcrow_helm_gladiator",
    "categoria": "armadura",
    "nombre": "Ashcrow Helm",
    "set": "Ashcrow",
    "parte": "helm",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "ashcrow_armor_gladiator",
    "categoria": "armadura",
    "nombre": "Ashcrow Armor",
    "set": "Ashcrow",
    "parte": "armor",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "ashcrow_pants_gladiator",
    "categoria": "armadura",
    "nombre": "Ashcrow Pants",
    "set": "Ashcrow",
    "parte": "pants",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "ashcrow_gloves_gladiator",
    "categoria": "armadura",
    "nombre": "Ashcrow Gloves",
    "set": "Ashcrow",
    "parte": "gloves",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "ashcrow_boots_gladiator",
    "categoria": "armadura",
    "nombre": "Ashcrow Boots",
    "set": "Ashcrow",
    "parte": "boots",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "valiant_helm_gladiator",
    "categoria": "armadura",
    "nombre": "Valiant Helm",
    "set": "Valiant",
    "parte": "helm",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "valiant_armor_gladiator",
    "categoria": "armadura",
    "nombre": "Valiant Armor",
    "set": "Valiant",
    "parte": "armor",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "valiant_pants_gladiator",
    "categoria": "armadura",
    "nombre": "Valiant Pants",
    "set": "Valiant",
    "parte": "pants",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "valiant_gloves_gladiator",
    "categoria": "armadura",
    "nombre": "Valiant Gloves",
    "set": "Valiant",
    "parte": "gloves",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "valiant_boots_gladiator",
    "categoria": "armadura",
    "nombre": "Valiant Boots",
    "set": "Valiant",
    "parte": "boots",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "sunlight_helm_lord",
    "categoria": "armadura",
    "nombre": "Sunlight Helm",
    "set": "Sunlight",
    "parte": "helm",
    "raza": "Lord",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "sunlight_armor_lord",
    "categoria": "armadura",
    "nombre": "Sunlight Armor",
    "set": "Sunlight",
    "parte": "armor",
    "raza": "Lord",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "sunlight_pants_lord",
    "categoria": "armadura",
    "nombre": "Sunlight Pants",
    "set": "Sunlight",
    "parte": "pants",
    "raza": "Lord",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "sunlight_gloves_lord",
    "categoria": "armadura",
    "nombre": "Sunlight Gloves",
    "set": "Sunlight",
    "parte": "gloves",
    "raza": "Lord",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "sunlight_boots_lord",
    "categoria": "armadura",
    "nombre": "Sunlight Boots",
    "set": "Sunlight",
    "parte": "boots",
    "raza": "Lord",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "royal_helm_lord",
    "categoria": "armadura",
    "nombre": "Royal Helm",
    "set": "Royal",
    "parte": "helm",
    "raza": "Lord",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "royal_armor_lord",
    "categoria": "armadura",
    "nombre": "Royal Armor",
    "set": "Royal",
    "parte": "armor",
    "raza": "Lord",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "royal_pants_lord",
    "categoria": "armadura",
    "nombre": "Royal Pants",
    "set": "Royal",
    "parte": "pants",
    "raza": "Lord",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "royal_gloves_lord",
    "categoria": "armadura",
    "nombre": "Royal Gloves",
    "set": "Royal",
    "parte": "gloves",
    "raza": "Lord",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "royal_boots_lord",
    "categoria": "armadura",
    "nombre": "Royal Boots",
    "set": "Royal",
    "parte": "boots",
    "raza": "Lord",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "light_plate_helm_lord",
    "categoria": "armadura",
    "nombre": "Light Plate Helm",
    "set": "Light Plate",
    "parte": "helm",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "light_plate_armor_lord",
    "categoria": "armadura",
    "nombre": "Light Plate Armor",
    "set": "Light Plate",
    "parte": "armor",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "light_plate_pants_lord",
    "categoria": "armadura",
    "nombre": "Light Plate Pants",
    "set": "Light Plate",
    "parte": "pants",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "light_plate_gloves_lord",
    "categoria": "armadura",
    "nombre": "Light Plate Gloves",
    "set": "Light Plate",
    "parte": "gloves",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "light_plate_boots_lord",
    "categoria": "armadura",
    "nombre": "Light Plate Boots",
    "set": "Light Plate",
    "parte": "boots",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "adamantine_helm_lord",
    "categoria": "armadura",
    "nombre": "Adamantine Helm",
    "set": "Adamantine",
    "parte": "helm",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "adamantine_armor_lord",
    "categoria": "armadura",
    "nombre": "Adamantine Armor",
    "set": "Adamantine",
    "parte": "armor",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "adamantine_pants_lord",
    "categoria": "armadura",
    "nombre": "Adamantine Pants",
    "set": "Adamantine",
    "parte": "pants",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "adamantine_gloves_lord",
    "categoria": "armadura",
    "nombre": "Adamantine Gloves",
    "set": "Adamantine",
    "parte": "gloves",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "adamantine_boots_lord",
    "categoria": "armadura",
    "nombre": "Adamantine Boots",
    "set": "Adamantine",
    "parte": "boots",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dark_steel_helm_lord",
    "categoria": "armadura",
    "nombre": "Dark Steel Helm",
    "set": "Dark Steel",
    "parte": "helm",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dark_steel_armor_lord",
    "categoria": "armadura",
    "nombre": "Dark Steel Armor",
    "set": "Dark Steel",
    "parte": "armor",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dark_steel_pants_lord",
    "categoria": "armadura",
    "nombre": "Dark Steel Pants",
    "set": "Dark Steel",
    "parte": "pants",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dark_steel_gloves_lord",
    "categoria": "armadura",
    "nombre": "Dark Steel Gloves",
    "set": "Dark Steel",
    "parte": "gloves",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dark_steel_boots_lord",
    "categoria": "armadura",
    "nombre": "Dark Steel Boots",
    "set": "Dark Steel",
    "parte": "boots",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dark_master_helm_lord",
    "categoria": "armadura",
    "nombre": "Dark Master Helm",
    "set": "Dark Master",
    "parte": "helm",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dark_master_armor_lord",
    "categoria": "armadura",
    "nombre": "Dark Master Armor",
    "set": "Dark Master",
    "parte": "armor",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dark_master_pants_lord",
    "categoria": "armadura",
    "nombre": "Dark Master Pants",
    "set": "Dark Master",
    "parte": "pants",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dark_master_gloves_lord",
    "categoria": "armadura",
    "nombre": "Dark Master Gloves",
    "set": "Dark Master",
    "parte": "gloves",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dark_master_boots_lord",
    "categoria": "armadura",
    "nombre": "Dark Master Boots",
    "set": "Dark Master",
    "parte": "boots",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "glorious_helm_lord",
    "categoria": "armadura",
    "nombre": "Glorious Helm",
    "set": "Glorious",
    "parte": "helm",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "glorious_armor_lord",
    "categoria": "armadura",
    "nombre": "Glorious Armor",
    "set": "Glorious",
    "parte": "armor",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "glorious_pants_lord",
    "categoria": "armadura",
    "nombre": "Glorious Pants",
    "set": "Glorious",
    "parte": "pants",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "glorious_gloves_lord",
    "categoria": "armadura",
    "nombre": "Glorious Gloves",
    "set": "Glorious",
    "parte": "gloves",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "glorious_boots_lord",
    "categoria": "armadura",
    "nombre": "Glorious Boots",
    "set": "Glorious",
    "parte": "boots",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "storm_blitz_helm_summoner",
    "categoria": "armadura",
    "nombre": "Storm Blitz Helm",
    "set": "Storm Blitz",
    "parte": "helm",
    "raza": "Summoner",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "storm_blitz_armor_summoner",
    "categoria": "armadura",
    "nombre": "Storm Blitz Armor",
    "set": "Storm Blitz",
    "parte": "armor",
    "raza": "Summoner",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "storm_blitz_pants_summoner",
    "categoria": "armadura",
    "nombre": "Storm Blitz Pants",
    "set": "Storm Blitz",
    "parte": "pants",
    "raza": "Summoner",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "storm_blitz_gloves_summoner",
    "categoria": "armadura",
    "nombre": "Storm Blitz Gloves",
    "set": "Storm Blitz",
    "parte": "gloves",
    "raza": "Summoner",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "storm_blitz_boots_summoner",
    "categoria": "armadura",
    "nombre": "Storm Blitz Boots",
    "set": "Storm Blitz",
    "parte": "boots",
    "raza": "Summoner",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "lilium_helm_summoner",
    "categoria": "armadura",
    "nombre": "Lilium Helm",
    "set": "Lilium",
    "parte": "helm",
    "raza": "Summoner",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "lilium_armor_summoner",
    "categoria": "armadura",
    "nombre": "Lilium Armor",
    "set": "Lilium",
    "parte": "armor",
    "raza": "Summoner",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "lilium_pants_summoner",
    "categoria": "armadura",
    "nombre": "Lilium Pants",
    "set": "Lilium",
    "parte": "pants",
    "raza": "Summoner",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "lilium_gloves_summoner",
    "categoria": "armadura",
    "nombre": "Lilium Gloves",
    "set": "Lilium",
    "parte": "gloves",
    "raza": "Summoner",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "lilium_boots_summoner",
    "categoria": "armadura",
    "nombre": "Lilium Boots",
    "set": "Lilium",
    "parte": "boots",
    "raza": "Summoner",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "queen_helm_summoner",
    "categoria": "armadura",
    "nombre": "Queen Helm",
    "set": "Queen",
    "parte": "helm",
    "raza": "Summoner",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "queen_armor_summoner",
    "categoria": "armadura",
    "nombre": "Queen Armor",
    "set": "Queen",
    "parte": "armor",
    "raza": "Summoner",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "queen_pants_summoner",
    "categoria": "armadura",
    "nombre": "Queen Pants",
    "set": "Queen",
    "parte": "pants",
    "raza": "Summoner",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "queen_gloves_summoner",
    "categoria": "armadura",
    "nombre": "Queen Gloves",
    "set": "Queen",
    "parte": "gloves",
    "raza": "Summoner",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "queen_boots_summoner",
    "categoria": "armadura",
    "nombre": "Queen Boots",
    "set": "Queen",
    "parte": "boots",
    "raza": "Summoner",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "violent_wind_helm_summoner",
    "categoria": "armadura",
    "nombre": "Violent Wind Helm",
    "set": "Violent Wind",
    "parte": "helm",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "violent_wind_armor_summoner",
    "categoria": "armadura",
    "nombre": "Violent Wind Armor",
    "set": "Violent Wind",
    "parte": "armor",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "violent_wind_pants_summoner",
    "categoria": "armadura",
    "nombre": "Violent Wind Pants",
    "set": "Violent Wind",
    "parte": "pants",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "violent_wind_gloves_summoner",
    "categoria": "armadura",
    "nombre": "Violent Wind Gloves",
    "set": "Violent Wind",
    "parte": "gloves",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "violent_wind_boots_summoner",
    "categoria": "armadura",
    "nombre": "Violent Wind Boots",
    "set": "Violent Wind",
    "parte": "boots",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "red_wing_helm_summoner",
    "categoria": "armadura",
    "nombre": "Red Wing Helm",
    "set": "Red Wing",
    "parte": "helm",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "red_wing_armor_summoner",
    "categoria": "armadura",
    "nombre": "Red Wing Armor",
    "set": "Red Wing",
    "parte": "armor",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "red_wing_pants_summoner",
    "categoria": "armadura",
    "nombre": "Red Wing Pants",
    "set": "Red Wing",
    "parte": "pants",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "red_wing_gloves_summoner",
    "categoria": "armadura",
    "nombre": "Red Wing Gloves",
    "set": "Red Wing",
    "parte": "gloves",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "red_wing_boots_summoner",
    "categoria": "armadura",
    "nombre": "Red Wing Boots",
    "set": "Red Wing",
    "parte": "boots",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "ancient_helm_summoner",
    "categoria": "armadura",
    "nombre": "Ancient Helm",
    "set": "Ancient",
    "parte": "helm",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "ancient_armor_summoner",
    "categoria": "armadura",
    "nombre": "Ancient Armor",
    "set": "Ancient",
    "parte": "armor",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "ancient_pants_summoner",
    "categoria": "armadura",
    "nombre": "Ancient Pants",
    "set": "Ancient",
    "parte": "pants",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "ancient_gloves_summoner",
    "categoria": "armadura",
    "nombre": "Ancient Gloves",
    "set": "Ancient",
    "parte": "gloves",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "ancient_boots_summoner",
    "categoria": "armadura",
    "nombre": "Ancient Boots",
    "set": "Ancient",
    "parte": "boots",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "demonic_helm_summoner",
    "categoria": "armadura",
    "nombre": "Demonic Helm",
    "set": "Demonic",
    "parte": "helm",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "demonic_armor_summoner",
    "categoria": "armadura",
    "nombre": "Demonic Armor",
    "set": "Demonic",
    "parte": "armor",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "demonic_pants_summoner",
    "categoria": "armadura",
    "nombre": "Demonic Pants",
    "set": "Demonic",
    "parte": "pants",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "demonic_gloves_summoner",
    "categoria": "armadura",
    "nombre": "Demonic Gloves",
    "set": "Demonic",
    "parte": "gloves",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "demonic_boots_summoner",
    "categoria": "armadura",
    "nombre": "Demonic Boots",
    "set": "Demonic",
    "parte": "boots",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "bone_blade_knight",
    "categoria": "arma",
    "nombre": "Bone Blade",
    "set": null,
    "parte": "weapon",
    "raza": "Knight",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "sword_breaker_knight",
    "categoria": "arma",
    "nombre": "Sword Breaker",
    "set": null,
    "parte": "weapon",
    "raza": "Knight",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "flameberge_knight",
    "categoria": "arma",
    "nombre": "Flameberge",
    "set": null,
    "parte": "weapon",
    "raza": "Knight",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "kris_knight",
    "categoria": "arma",
    "nombre": "Kris",
    "set": null,
    "parte": "weapon",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "short_sword_knight",
    "categoria": "arma",
    "nombre": "Short Sword",
    "set": null,
    "parte": "weapon",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "katana_knight",
    "categoria": "arma",
    "nombre": "Katana",
    "set": null,
    "parte": "weapon",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "legendary_sword_knight",
    "categoria": "arma",
    "nombre": "Legendary Sword",
    "set": null,
    "parte": "weapon",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "double_blade_knight",
    "categoria": "arma",
    "nombre": "Double Blade",
    "set": null,
    "parte": "weapon",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "lighting_sword_knight",
    "categoria": "arma",
    "nombre": "Lighting Sword",
    "set": null,
    "parte": "weapon",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "giant_sword_knight",
    "categoria": "arma",
    "nombre": "Giant Sword",
    "set": null,
    "parte": "weapon",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "sword_of_destruction_knight",
    "categoria": "arma",
    "nombre": "Sword of Destruction",
    "set": null,
    "parte": "weapon",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "divine_sword_of_archangel_knight",
    "categoria": "arma",
    "nombre": "Divine Sword of Archangel",
    "set": null,
    "parte": "weapon",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "knight_blade_knight",
    "categoria": "arma",
    "nombre": "Knight Blade",
    "set": null,
    "parte": "weapon",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dark_reign_blade_knight",
    "categoria": "arma",
    "nombre": "Dark Reign Blade",
    "set": null,
    "parte": "weapon",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "tomahawk_knight",
    "categoria": "arma",
    "nombre": "Tomahawk",
    "set": null,
    "parte": "weapon",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "battle_axe_knight",
    "categoria": "arma",
    "nombre": "Battle Axe",
    "set": null,
    "parte": "weapon",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "nikea_axe_knight",
    "categoria": "arma",
    "nombre": "Nikea Axe",
    "set": null,
    "parte": "weapon",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "morning_star_knight",
    "categoria": "arma",
    "nombre": "Morning Star",
    "set": null,
    "parte": "weapon",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "flail_knight",
    "categoria": "arma",
    "nombre": "Flail",
    "set": null,
    "parte": "weapon",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "great_hammer_knight",
    "categoria": "arma",
    "nombre": "Great Hammer",
    "set": null,
    "parte": "weapon",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "mace_of_king_knight",
    "categoria": "arma",
    "nombre": "Mace Of King",
    "set": null,
    "parte": "weapon",
    "raza": "Knight",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "grand_viper_staff_wizard",
    "categoria": "arma",
    "nombre": "Grand Viper Staff",
    "set": null,
    "parte": "weapon",
    "raza": "Wizard",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "inberial_staff_wizard",
    "categoria": "arma",
    "nombre": "Inberial Staff",
    "set": null,
    "parte": "weapon",
    "raza": "Wizard",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "dragon_soul_staff_wizard",
    "categoria": "arma",
    "nombre": "Dragon Soul Staff",
    "set": null,
    "parte": "weapon",
    "raza": "Wizard",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "divine_staff_of_archangel_wizard",
    "categoria": "arma",
    "nombre": "Divine Staff of Archangel",
    "set": null,
    "parte": "weapon",
    "raza": "Wizard",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "staff_of_kundun_wizard",
    "categoria": "arma",
    "nombre": "Staff of Kundun",
    "set": null,
    "parte": "weapon",
    "raza": "Wizard",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "platina_staff_wizard",
    "categoria": "arma",
    "nombre": "Platina Staff",
    "set": null,
    "parte": "weapon",
    "raza": "Wizard",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "sylph_wind_bow_elf",
    "categoria": "arma",
    "nombre": "Sylph Wind Bow",
    "set": null,
    "parte": "weapon",
    "raza": "Elf",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "dark_stinger_elf",
    "categoria": "arma",
    "nombre": "Dark Stinger",
    "set": null,
    "parte": "weapon",
    "raza": "Elf",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "aileen_bow_elf",
    "categoria": "arma",
    "nombre": "Aileen Bow",
    "set": null,
    "parte": "weapon",
    "raza": "Elf",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "divine_crossbow_of_archangel_elf",
    "categoria": "arma",
    "nombre": "Divine Crossbow of Archangel",
    "set": null,
    "parte": "weapon",
    "raza": "Elf",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "arrow_viper_bow_elf",
    "categoria": "arma",
    "nombre": "Arrow Viper Bow",
    "set": null,
    "parte": "weapon",
    "raza": "Elf",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "albatross_bow_elf",
    "categoria": "arma",
    "nombre": "Albatross Bow",
    "set": null,
    "parte": "weapon",
    "raza": "Elf",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "elemental_mace_elf",
    "categoria": "arma",
    "nombre": "Elemental Mace",
    "set": null,
    "parte": "weapon",
    "raza": "Elf",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "frost_mace_elf",
    "categoria": "arma",
    "nombre": "Frost Mace",
    "set": null,
    "parte": "weapon",
    "raza": "Elf",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "explosion_blade_gladiator",
    "categoria": "arma",
    "nombre": "Explosion Blade",
    "set": null,
    "parte": "weapon",
    "raza": "Gladiator",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "rune_bastard_sword_gladiator",
    "categoria": "arma",
    "nombre": "Rune Bastard Sword",
    "set": null,
    "parte": "weapon",
    "raza": "Gladiator",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "deadly_staff_gladiator",
    "categoria": "arma",
    "nombre": "Deadly Staff",
    "set": null,
    "parte": "weapon",
    "raza": "Gladiator",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "rune_blade_gladiator",
    "categoria": "arma",
    "nombre": "Rune Blade",
    "set": null,
    "parte": "weapon",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "daybreak_gladiator",
    "categoria": "arma",
    "nombre": "Daybreak",
    "set": null,
    "parte": "weapon",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "sword_dancer_gladiator",
    "categoria": "arma",
    "nombre": "Sword Dancer",
    "set": null,
    "parte": "weapon",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "light_spear_gladiator",
    "categoria": "arma",
    "nombre": "Light Spear",
    "set": null,
    "parte": "weapon",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "spear_gladiator",
    "categoria": "arma",
    "nombre": "Spear",
    "set": null,
    "parte": "weapon",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dragon_lance_gladiator",
    "categoria": "arma",
    "nombre": "Dragon Lance",
    "set": null,
    "parte": "weapon",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "giant_trident_gladiator",
    "categoria": "arma",
    "nombre": "Giant Trident",
    "set": null,
    "parte": "weapon",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "serpent_spear_gladiator",
    "categoria": "arma",
    "nombre": "Serpent Spear",
    "set": null,
    "parte": "weapon",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "double_poleaxe_gladiator",
    "categoria": "arma",
    "nombre": "Double Poleaxe",
    "set": null,
    "parte": "weapon",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "halberd_gladiator",
    "categoria": "arma",
    "nombre": "Halberd",
    "set": null,
    "parte": "weapon",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "berdysh_gladiator",
    "categoria": "arma",
    "nombre": "Berdysh",
    "set": null,
    "parte": "weapon",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "great_scythe_gladiator",
    "categoria": "arma",
    "nombre": "Great Scythe",
    "set": null,
    "parte": "weapon",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "bill_of_balrog_gladiator",
    "categoria": "arma",
    "nombre": "Bill of Balrog",
    "set": null,
    "parte": "weapon",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "dragon_spear_gladiator",
    "categoria": "arma",
    "nombre": "Dragon Spear",
    "set": null,
    "parte": "weapon",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "brova_gladiator",
    "categoria": "arma",
    "nombre": "Brova",
    "set": null,
    "parte": "weapon",
    "raza": "Gladiator",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "soleil_scepter_lord",
    "categoria": "arma",
    "nombre": "Soleil Scepter",
    "set": null,
    "parte": "weapon",
    "raza": "Lord",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "absolute_scepter_lord",
    "categoria": "arma",
    "nombre": "Absolute Scepter",
    "set": null,
    "parte": "weapon",
    "raza": "Lord",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "great_scepter_lord",
    "categoria": "arma",
    "nombre": "Great Scepter",
    "set": null,
    "parte": "weapon",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "lord_scepter_lord",
    "categoria": "arma",
    "nombre": "Lord Scepter",
    "set": null,
    "parte": "weapon",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "great_lord_scepter_lord",
    "categoria": "arma",
    "nombre": "Great Lord Scepter",
    "set": null,
    "parte": "weapon",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "divine_scepter_of_archangel_lord",
    "categoria": "arma",
    "nombre": "Divine Scepter of Archangel",
    "set": null,
    "parte": "weapon",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "shining_scepter_lord",
    "categoria": "arma",
    "nombre": "Shining Scepter",
    "set": null,
    "parte": "weapon",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "striker_scepter_lord",
    "categoria": "arma",
    "nombre": "Striker Scepter",
    "set": null,
    "parte": "weapon",
    "raza": "Lord",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "storm_blitz_stick_summoner",
    "categoria": "arma",
    "nombre": "Storm Blitz Stick",
    "set": null,
    "parte": "weapon",
    "raza": "Summoner",
    "tipos": [
      "380"
    ]
  },
  {
    "id": "merlin_staff_summoner",
    "categoria": "arma",
    "nombre": "Merlin Staff",
    "set": null,
    "parte": "weapon",
    "raza": "Summoner",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "lilium_staff_summoner",
    "categoria": "arma",
    "nombre": "Lilium Staff",
    "set": null,
    "parte": "weapon",
    "raza": "Summoner",
    "tipos": [
      "400"
    ]
  },
  {
    "id": "mystery_stick_summoner",
    "categoria": "arma",
    "nombre": "Mystery Stick",
    "set": null,
    "parte": "weapon",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "violent_wind_stick_summoner",
    "categoria": "arma",
    "nombre": "Violent Wind Stick",
    "set": null,
    "parte": "weapon",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "red_wing_stick_summoner",
    "categoria": "arma",
    "nombre": "Red Wing Stick",
    "set": null,
    "parte": "weapon",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "ancient_stick_summoner",
    "categoria": "arma",
    "nombre": "Ancient Stick",
    "set": null,
    "parte": "weapon",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "demonic_stick_summoner",
    "categoria": "arma",
    "nombre": "Demonic Stick",
    "set": null,
    "parte": "weapon",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "raven_stick_summoner",
    "categoria": "arma",
    "nombre": "Raven Stick",
    "set": null,
    "parte": "weapon",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "divine_stick_of_archangel_summoner",
    "categoria": "arma",
    "nombre": "Divine Stick of Archangel",
    "set": null,
    "parte": "weapon",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "book_of_samut_summoner",
    "categoria": "arma",
    "nombre": "Book of Samut",
    "set": null,
    "parte": "weapon",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "book_of_neil_summoner",
    "categoria": "arma",
    "nombre": "Book of Neil",
    "set": null,
    "parte": "weapon",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  },
  {
    "id": "book_of_lagle_summoner",
    "categoria": "arma",
    "nombre": "Book of Lagle",
    "set": null,
    "parte": "weapon",
    "raza": "Summoner",
    "tipos": [
      "s3"
    ]
  }
];

// =====================================================
// HELPERS
// =====================================================

/** Items filtrados por raza y categoría. */
export function itemsPorRazaCategoria(raza: Raza, categoria: "armadura" | "arma"): ItemCatalogo[] {
  return ITEMS_CATALOGO.filter((i) => i.raza === raza && i.categoria === categoria);
}

/** Busca un item por id. */
export function itemPorId(id: string): ItemCatalogo | null {
  return ITEMS_CATALOGO.find((i) => i.id === id) || null;
}

/** Razas disponibles (las que tienen al menos un item). */
export const RAZAS_CON_ITEMS: Raza[] = ["Knight","Wizard","Elf","Gladiator","Lord","Summoner"];
