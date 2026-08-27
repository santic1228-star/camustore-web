/**
 * Tipos generados manualmente reflejando el schema de Supabase.
 * Si cambia el schema de la DB, hay que actualizar este archivo.
 */

export type Categoria = "armadura" | "arma" | "ala" | "escudo";
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

export type TipoJoya = "anillo" | "pendiente";
export type OpcionVariableJoya = "life" | "mana" | "ag";

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

export interface JoyaPublico {
  id: string;
  tipo: TipoJoya;
  nombre: string | null;
  nivel: number;
  life_recovery: number;
  hp_dd_ref: boolean;
  exe_rate: boolean;
  dmg_2pct: boolean;
  tercera_opcion: string | null;
  opcion_variable: OpcionVariableJoya | null;
  raza: string | null;
  precio_venta: number;
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
      joyeria_stock: {
        Row: JoyaPublico & { dueno: string | null; updated_at: string; precio_compra: number };
        Insert: {
          id?: string;
          tipo: TipoJoya;
          nombre?: string | null;
          nivel?: number;
          life_recovery?: number;
          hp_dd_ref?: boolean;
          exe_rate?: boolean;
          dmg_2pct?: boolean;
          tercera_opcion?: string | null;
          opcion_variable?: OpcionVariableJoya | null;
          raza?: string | null;
          dueno?: string | null;
          precio_compra?: number;
          precio_venta?: number;
          estado?: EstadoItem;
        };
        Update: Partial<JoyaPublico> & { dueno?: string | null; precio_compra?: number };
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
      joyeria_publicos: { Row: JoyaPublico };
    };
  };
}

// =====================================================
// CONSIGNACIONES (nuevo modelo, v2)
// =====================================================

export type EstadoConsignacionV2 = "pendiente" | "parcial" | "aprobada" | "rechazada";
export type EstadoConsigItem = "pendiente" | "aprobado" | "rechazado";

/** Categoría del item dentro de una consignación. */
export type CategoriaConsig =
  | "armadura" | "arma" | "escudo" | "ala"
  | "joya" | "jewel" | "seed" | "gema";

export interface ConsignacionRow {
  id: string;
  personaje: string;
  whatsapp: string;
  notas: string | null;
  estado: EstadoConsignacionV2;
  created_at: string;
  updated_at: string;
  revisado_at: string | null;
}

export interface ConsignacionItemRow {
  id: string;
  consignacion_id: string;
  categoria: CategoriaConsig;
  atributos: Record<string, unknown>;
  precio_sugerido: number;
  precio_aprobado: number | null;
  comision_pct: number;
  estado: EstadoConsigItem;
  motivo_rechazo: string | null;
  item_creado_id: string | null;
  created_at: string;
  updated_at: string;
}


// =====================================================
// CONFIGURACIÓN DE PRECIOS (24/08/2026) — tabla `config_precios`
// (SQL: camustore_config_precios.sql)
//
// Append-only: cada guardado inserta una fila nueva con el JSONB completo.
// La fila más reciente es la vigente; las anteriores son el historial y
// sirven para volver atrás. La forma del JSONB es `ConfigPrecios`
// (lib/precios-config.ts); se guarda como Record para tolerar versiones
// viejas del panel, y `fusionarConfig` completa lo que falte.
// =====================================================

export interface ConfigPreciosRow {
  id: string;
  valores: Record<string, unknown>;
  nota: string | null;
  creado_por_email: string;
  created_at: string;
}

export type ConfigPreciosInsert = {
  valores: Record<string, unknown>;
  nota?: string | null;
  creado_por_email: string;
};

// =====================================================
// Versión de miembros (21/08/2026) — tablas `miembros` y `eventos_registros`
// (SQL: camustore_miembros.sql)
// =====================================================

export type TipoEventoRegistro = "gaion" | "kundun" | "cryonox";

export interface MiembroRow {
  id: string;
  email: string;
  personaje: string;
  activo: boolean;
  notas: string | null;
  /** Avatar elegido por el miembro (27/08). null = todavía no eligió. */
  raza: Raza | null;
  created_at: string;
  updated_at: string;
}

export type MiembroInsert = Pick<MiembroRow, "email" | "personaje"> & {
  activo?: boolean;
  notas?: string | null;
  raza?: Raza | null;
};

/** Por qué creemos que se va a pelear en ese evento (27/08). */
export type MotivoPelea = "nos_vieron" | "lo_perdimos" | "otro";

export interface EventoRegistroRow {
  id: string;
  tipo: TipoEventoRegistro;
  /** ISO timestamptz: captura (Gaion) o muerte (bosses). */
  hora_evento: string;
  /** Solo Gaion. */
  standby_seg: number | null;
  /** ISO timestamptz: apertura / respawn calculado al cargar (snapshot). */
  resultado_at: string;
  miembro_id: string | null;
  cargado_por_email: string;
  cargado_por_personaje: string;
  notas: string | null;
  /** "Se pelea": otros guilds conocen el horario (27/08). Default false. */
  se_pelea: boolean;
  se_pelea_motivo: MotivoPelea | null;
  created_at: string;
  updated_at: string;
}

export type EventoRegistroInsert = Pick<
  EventoRegistroRow,
  "tipo" | "hora_evento" | "resultado_at" | "cargado_por_email" | "cargado_por_personaje"
> & {
  standby_seg?: number | null;
  miembro_id?: string | null;
  notas?: string | null;
  se_pelea?: boolean;
  se_pelea_motivo?: MotivoPelea | null;
};

// =====================================================
// ASISTENCIAS (27/08/2026) — tabla `eventos_asistencias`
// (SQL: camustore_miembros_v2.sql)
// Quién se apunta a un registro concreto (una apertura / un respawn).
// Una fila por (registro, email); apuntarse = insert, bajarse = delete.
// =====================================================

export interface AsistenciaRow {
  id: string;
  registro_id: string;
  miembro_id: string | null;
  email: string;
  personaje: string;
  raza: Raza | null;
  created_at: string;
}

export type AsistenciaInsert = Pick<AsistenciaRow, "registro_id" | "email" | "personaje"> & {
  miembro_id?: string | null;
  raza?: Raza | null;
};
