/**
 * Tipos generados manualmente reflejando el schema de Supabase.
 * Si cambia el schema de la DB, hay que actualizar este archivo.
 */

export type Categoria = "armadura" | "arma" | "ala";
export type TipoItem = "s3" | "380" | "400";
export type Raza = "Knight" | "Wizard" | "Elf" | "Gladiator" | "Lord" | "Summoner";
export type EstadoItem = "activo" | "vendido" | "retirado";
export type EstadoConsignacion = "pendiente" | "aprobado" | "rechazado" | "vendido";
export type TipoJewel =
  | "chaos" | "creation" | "soul" | "bless" | "harmony" | "life"
  | "socket" | "luck_jewel" | "skill_jewel" | "additional";
export type TipoSeed = "max_life" | "damage_reduction" | "penta" | "exc_dmg_rate" | "crit_dmg_rate";

export type TipoGema =
  | "gema_item_s3" | "gema_alas_s3" | "gema_seed" | "gema_item_380" | "gema_item_400"
  | "gema_gp" | "ring_wheel" | "item_acc" | "purple_box" | "chaos_box"
  | "kundun_box_5" | "kundun_box_4";

export interface ItemPublico {
  id: string;
  categoria: Categoria;
  nombre: string;
  parte: string | null;
  raza: Raza | null;
  nivel: number;
  tipo: TipoItem;
  socket: number | null;
  hp_dd_ref: boolean;
  exe_rate: boolean;
  dmg_lvl_20: boolean;
  dmg_2pct: boolean;
  speed_7: boolean;
  skill: boolean;
  opc_ignore: boolean;
  opc_return: boolean;
  opc_life_recov: boolean;
  luck: boolean;
  precio_venta: number;
  estado: EstadoItem;
  created_at: string;
}

export interface JewelPublico {
  id: string;
  tipo: TipoJewel;
  bundles: number;
  cantidad: number;
  estado: EstadoItem;
  created_at: string;
}

export interface SeedPublico {
  id: string;
  tipo: TipoSeed;
  ensamblada_penta: boolean;
  cantidad: number;
  estado: EstadoItem;
  created_at: string;
}

export interface GemaPublico {
  id: string;
  tipo: TipoGema;
  cantidad: number;
  estado: EstadoItem;
  created_at: string;
}

export interface Consignacion {
  id: string;
  user_id: string;
  user_ingame: string;
  user_email: string | null;
  categoria: Categoria;
  nombre: string | null;
  parte: string | null;
  raza: Raza | null;
  nivel: number;
  tipo: TipoItem | null;
  socket: number | null;
  hp_dd_ref: boolean;
  exe_rate: boolean;
  dmg_lvl_20: boolean;
  dmg_2pct: boolean;
  speed_7: boolean;
  skill: boolean;
  opc_ignore: boolean;
  opc_return: boolean;
  opc_life_recov: boolean;
  luck: boolean;
  jewel_tipo: TipoJewel | null;
  jewel_bundles: number | null;
  seed_tipo: TipoSeed | null;
  seed_ensamblada_penta: boolean | null;
  seed_cantidad: number | null;
  precio_cotizado: number;
  estado: EstadoConsignacion;
  nota_jugador: string | null;
  nota_admin: string | null;
  created_at: string;
  updated_at: string;
  aprobada_at: string | null;
  aprobada_por: string | null;
}

// Database type para tipar createClient<Database>
export interface Database {
  public: {
    Tables: {
      items: {
        Row: ItemPublico & { dueno: string | null; precio_compra: number | null; updated_at: string };
        Insert: {
          id?: string;
          categoria: Categoria;
          nombre: string;
          parte?: string | null;
          raza?: Raza | null;
          nivel?: number;
          tipo: TipoItem;
          socket?: number | null;
          hp_dd_ref?: boolean;
          exe_rate?: boolean;
          dmg_lvl_20?: boolean;
          dmg_2pct?: boolean;
          speed_7?: boolean;
          skill?: boolean;
          opc_ignore?: boolean;
          opc_return?: boolean;
          opc_life_recov?: boolean;
          luck?: boolean;
          precio_compra?: number | null;
          precio_venta: number;
          dueno?: string | null;
          estado?: EstadoItem;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ItemPublico> & { dueno?: string | null; precio_compra?: number | null };
      };
      jewels_stock: {
        Row: JewelPublico & { dueno: string | null; updated_at: string };
        Insert: {
          id?: string;
          tipo: TipoJewel;
          bundles?: number;
          cantidad?: number;
          dueno?: string | null;
          estado?: EstadoItem;
        };
        Update: Partial<JewelPublico> & { dueno?: string | null };
      };
      seeds_stock: {
        Row: SeedPublico & { dueno: string | null; updated_at: string };
        Insert: {
          id?: string;
          tipo: TipoSeed;
          ensamblada_penta?: boolean;
          cantidad?: number;
          dueno?: string | null;
          estado?: EstadoItem;
        };
        Update: Partial<SeedPublico> & { dueno?: string | null };
      };
      gemas_stock: {
        Row: GemaPublico & { dueno: string | null; updated_at: string };
        Insert: {
          id?: string;
          tipo: TipoGema;
          cantidad?: number;
          dueno?: string | null;
          estado?: EstadoItem;
        };
        Update: Partial<GemaPublico> & { dueno?: string | null };
      };
      admins: {
        Row: { email: string; nombre: string | null; created_at: string };
        Insert: { email: string; nombre?: string | null };
        Update: { email?: string; nombre?: string | null };
      };
      consignaciones: {
        Row: Consignacion;
        Insert: Omit<Consignacion, "id" | "created_at" | "updated_at" | "estado" | "aprobada_at" | "aprobada_por"> & {
          estado?: EstadoConsignacion;
        };
        Update: Partial<Consignacion>;
      };
    };
    Views: {
      items_publicos: { Row: ItemPublico };
      jewels_publicos: { Row: JewelPublico };
      seeds_publicos: { Row: SeedPublico };
      gemas_publicos: { Row: GemaPublico };
    };
  };
}
