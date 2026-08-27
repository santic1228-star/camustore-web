"use client";

/**
 * Contexto de configuración de precios.
 * =====================================
 *
 * Lee UNA sola vez la configuración vigente de la tabla `config_precios` y la
 * reparte a toda la app. Todo lo que muestra o calcula un precio la consume
 * desde acá, así un cambio en el panel del admin se ve en toda la tienda sin
 * volver a deployar.
 *
 * Tabla append-only: cada guardado es una fila nueva; la más reciente manda
 * (mismo patrón que `eventos_registros`, decisión de arquitectura del 23/08).
 * Si la tabla está vacía o el fetch falla, se usan los defaults del código —
 * la tienda nunca queda sin precios.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";
import {
  CONFIG_PRECIOS_DEFAULT,
  fusionarConfig,
  type ConfigPrecios,
} from "./precios-config";
import type { ConfigPreciosRow } from "./database.types";

interface ContextoPrecios {
  cfg: ConfigPrecios;
  /** true mientras se busca la config en la DB (la primera vez). */
  cargando: boolean;
  /** Fila vigente, o null si nunca se guardó nada (se usan los defaults). */
  filaVigente: ConfigPreciosRow | null;
  /** Mensaje si el fetch falló (la tienda sigue andando con los defaults). */
  error: string | null;
  /** Volver a leer de la DB (lo llama el panel del admin al guardar). */
  recargar: () => Promise<void>;
}

const Contexto = createContext<ContextoPrecios | null>(null);

/** Trae la configuración vigente (la fila más reciente). */
export async function leerConfigVigente(): Promise<{
  cfg: ConfigPrecios;
  fila: ConfigPreciosRow | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("config_precios")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    // No rompemos la tienda: seguimos con los defaults y avisamos.
    return {
      cfg: CONFIG_PRECIOS_DEFAULT,
      fila: null,
      error: `${error.message}${error.code ? ` (${error.code})` : ""}`,
    };
  }

  const fila = (data as ConfigPreciosRow | null) ?? null;
  if (!fila) return { cfg: CONFIG_PRECIOS_DEFAULT, fila: null, error: null };

  return {
    cfg: fusionarConfig(CONFIG_PRECIOS_DEFAULT, fila.valores),
    fila,
    error: null,
  };
}

export function ConfigPreciosProvider({ children }: { children: ReactNode }) {
  const [cfg, setCfg] = useState<ConfigPrecios>(CONFIG_PRECIOS_DEFAULT);
  const [filaVigente, setFilaVigente] = useState<ConfigPreciosRow | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    const r = await leerConfigVigente();
    setCfg(r.cfg);
    setFilaVigente(r.fila);
    setError(r.error);
    setCargando(false);
  }, []);

  useEffect(() => {
    let vivo = true;
    leerConfigVigente().then((r) => {
      if (!vivo) return;
      setCfg(r.cfg);
      setFilaVigente(r.fila);
      setError(r.error);
      setCargando(false);
    });
    return () => {
      vivo = false;
    };
  }, []);

  const valor = useMemo<ContextoPrecios>(
    () => ({ cfg, cargando, filaVigente, error, recargar }),
    [cfg, cargando, filaVigente, error, recargar]
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

/**
 * Config de precios vigente. Fuera del provider devuelve los defaults, así un
 * componente suelto (o un test) nunca explota.
 */
export function useConfigPrecios(): ContextoPrecios {
  const ctx = useContext(Contexto);
  if (!ctx) {
    return {
      cfg: CONFIG_PRECIOS_DEFAULT,
      cargando: false,
      filaVigente: null,
      error: null,
      recargar: async () => {},
    };
  }
  return ctx;
}

/** Atajo cuando solo hace falta la config. */
export function useCfg(): ConfigPrecios {
  return useConfigPrecios().cfg;
}

/**
 * "Ahora" en milisegundos, refrescado cada `intervaloMs`.
 * Lo usan las tarjetas para que el hot sale se prenda y se apague solo cuando
 * cruza la fecha de inicio o de fin, sin recargar la página.
 * Arranca en `null` para no romper la hidratación del server.
 */
export function useAhora(intervaloMs = 30_000): number | null {
  const [ahora, setAhora] = useState<number | null>(null);

  useEffect(() => {
    setAhora(Date.now());
    const id = setInterval(() => setAhora(Date.now()), intervaloMs);
    return () => clearInterval(id);
  }, [intervaloMs]);

  return ahora;
}
