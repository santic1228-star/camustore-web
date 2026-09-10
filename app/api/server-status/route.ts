import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { EstadoServer } from "@/lib/server-status";

// =====================================================
// /api/server-status — corre en el SERVIDOR (Vercel), nunca en el navegador.
//
// Por qué del lado del servidor: un fetch a muguerraeterna.com desde el celu
// del jugador lo bloquea CORS. Además, así el server chico recibe UNA consulta
// cada tanto y no una por visitante.
//
// Qué hace:
//   1. Sondea la web del server (`probarServer`).
//   2. Lee el último estado guardado en `server_status_log`.
//   3. Si el estado CAMBIÓ, inserta una fila nueva (tabla append-only).
//   4. Devuelve { online, desde, verificadoEn, detalle }.
//
// "desde" es cuándo se DETECTÓ el cambio, no el segundo exacto de la caída:
// si el server se cae a las 3 AM y nadie entra hasta las 9, arranca a las 9.
// Para afinarlo haría falta un cron que sondee sin visitantes.
//
// Si Supabase falla, igual devuelve el estado con `desde: null` (la UI muestra
// ONLINE/CAÍDO sin el "hace X min"). El cartel nunca queda en blanco por eso.
//
// Variables de entorno (Vercel):
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (ya existen)
//   SERVER_URL  ← opcional. Si no está, usa la constante de abajo.
//
// SQL previo (BLOQUEANTE): sql/camustore_server_status.sql
// =====================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** La web del server. Override por env var para no tocar código si cambia. */
const URL_SERVER = process.env.SERVER_URL ?? "https://muguerraeterna.com/";

/** Cuánto esperamos una respuesta antes de darlo por caído. */
const TIMEOUT_MS = 8000;

/** Cuánto vale una sonda antes de volver a molestar al server. */
const CACHE_MS = 45_000;

/**
 * Caché en memoria del proceso. Vercel puede tener varias instancias tibias,
 * así que esto no es un candado global: es un techo razonable (una sonda cada
 * 45 s por instancia). El `Cache-Control` de abajo absorbe el resto en el CDN.
 */
let cache: { at: number; data: EstadoServer } | null = null;

/**
 * La sonda. Hoy pregunta por HTTP a la web del server.
 *
 * Si más adelante confirmamos que el juego puede estar caído con la web arriba,
 * ESTA función es lo único que hay que cambiar (por ejemplo, un connect TCP al
 * puerto del GameServer con `net.Socket`). El resto del archivo no se entera.
 */
async function probarServer(): Promise<{ online: boolean; detalle: string }> {
  const ctrl = new AbortController();
  const reloj = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(URL_SERVER, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: ctrl.signal,
      // Algunos hostings rechazan clientes sin User-Agent de navegador.
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CamuStore-StatusBot/1.0; +https://camustore-web.vercel.app)",
        Accept: "text/html,*/*",
      },
    });

    // 5xx = la máquina contesta pero está rota → para el jugador es lo mismo
    // que estar caída. 4xx (403, 404) = hay algo vivo del otro lado.
    if (res.status >= 500) return { online: false, detalle: `HTTP ${res.status}` };
    return { online: true, detalle: `HTTP ${res.status}` };
  } catch (e) {
    const abortado = e instanceof Error && e.name === "AbortError";
    return { online: false, detalle: abortado ? "sin respuesta (timeout)" : "sin conexión" };
  } finally {
    clearTimeout(reloj);
  }
}

/** Cliente con service role: escribe en `server_status_log` saltando RLS. */
function clienteServidor() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Devuelve desde cuándo rige el estado actual, insertando una fila si cambió.
 * Nunca tira: si algo falla, devuelve null y el cartel se muestra sin "hace X".
 */
async function desdeCuando(online: boolean, detalle: string): Promise<string | null> {
  const sb = clienteServidor();
  if (!sb) return null;

  try {
    const { data: ultima, error } = await sb
      .from("server_status_log")
      .select("online, created_at")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;

    // Mismo estado que la última vez: sigue rigiendo aquella fila.
    if (ultima && ultima.online === online) return ultima.created_at as string;

    // Cambió (o es la primera medición de la historia): fila nueva.
    const { data: nueva, error: errIns } = await sb
      .from("server_status_log")
      .insert({ online, detalle })
      .select("created_at")
      .single();

    if (errIns || !nueva) return null;
    return nueva.created_at as string;
  } catch {
    return null;
  }
}

export async function GET() {
  const ahora = Date.now();

  if (cache && ahora - cache.at < CACHE_MS) {
    return respuesta(cache.data);
  }

  const { online, detalle } = await probarServer();
  const desde = await desdeCuando(online, detalle);

  const data: EstadoServer = {
    online,
    desde,
    verificadoEn: new Date().toISOString(),
    detalle,
  };

  cache = { at: ahora, data };
  return respuesta(data);
}

function respuesta(data: EstadoServer) {
  return NextResponse.json(data, {
    status: 200,
    headers: {
      // El CDN de Vercel sirve la misma respuesta a todos por 20 s.
      "Cache-Control": "public, s-maxage=20, stale-while-revalidate=40",
    },
  });
}
