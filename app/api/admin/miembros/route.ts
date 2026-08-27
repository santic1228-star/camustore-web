import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { esEmailAdmin } from "@/lib/admins";

// =====================================================
// /api/admin/miembros — corre en el SERVIDOR (Vercel), nunca en el navegador.
//
// Acá sí puede vivir la clave secreta de Supabase (service role), que permite
// crear usuarios de Authentication. El navegador solo tiene la clave pública.
//
// Acciones (POST con JSON):
//   { accion: "alta",        email, personaje }  → crea el usuario con una clave
//                                                  generada + inserta en `miembros`.
//                                                  Devuelve la clave para pasársela.
//   { accion: "nueva_clave", email }             → genera otra clave para ese usuario.
//   { accion: "baja",        email }             → borra el usuario de Authentication
//                                                  y la fila de `miembros`.
//
// Seguridad: exige `Authorization: Bearer <access_token>` de una sesión cuyo
// email esté en ADMIN_EMAILS (lib/admins.ts). Si no, 401/403.
//
// Variables de entorno (Vercel):
//   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY  (ya existen)
//   SUPABASE_SERVICE_ROLE_KEY  ← NUEVA, server-only, se puede marcar Sensitive
// =====================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Accion = "alta" | "nueva_clave" | "baja";

interface Body {
  accion?: Accion;
  email?: string;
  personaje?: string;
}

function json(status: number, data: Record<string, unknown>) {
  return NextResponse.json(data, { status });
}

/** Clave legible de 10 caracteres, sin caracteres que se confunden (0/O, 1/l/I). */
function generarClave(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    return json(500, { error: "Faltan NEXT_PUBLIC_SUPABASE_URL / ANON_KEY en Vercel." });
  }
  if (!serviceKey) {
    return json(500, {
      error:
        "Falta SUPABASE_SERVICE_ROLE_KEY en Vercel (Settings → Environment Variables). Después de agregarla hay que redeployar.",
    });
  }

  // ---------- 1. ¿Quién llama? ----------
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return json(401, { error: "Sin sesión." });

  const publico = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: quien, error: errQuien } = await publico.auth.getUser(token);
  if (errQuien || !quien.user?.email) return json(401, { error: "Sesión inválida o vencida." });
  if (!esEmailAdmin(quien.user.email)) return json(403, { error: "Solo el admin puede hacer esto." });

  // ---------- 2. Qué pide ----------
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json(400, { error: "Body inválido." });
  }
  const accion = body.accion;
  const email = (body.email ?? "").trim().toLowerCase();
  const personaje = (body.personaje ?? "").trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: "Email inválido." });

  // Cliente con la clave secreta: salta RLS y puede administrar Authentication.
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ---------- 3. Acciones ----------
  if (accion === "alta") {
    if (personaje.length < 2) return json(400, { error: "Personaje demasiado corto." });

    // ¿Ya está en miembros?
    const { data: existente } = await admin.from("miembros").select("id").eq("email", email).maybeSingle();
    if (existente) return json(409, { error: "Ese email ya está cargado como miembro." });

    const clave = generarClave();
    let usuarioYaExistia = false;

    const { error: errCrear } = await admin.auth.admin.createUser({
      email,
      password: clave,
      email_confirm: true,
      user_metadata: { personaje },
    });

    if (errCrear) {
      // Si el usuario de Authentication ya existía (lo creaste a mano antes),
      // no lo tocamos: queda con su clave. Solo agregamos la fila de miembro.
      const msg = errCrear.message.toLowerCase();
      if (msg.includes("already") || msg.includes("exists") || msg.includes("registered")) {
        usuarioYaExistia = true;
      } else {
        return json(500, { error: "No se pudo crear el usuario: " + errCrear.message });
      }
    }

    const { error: errFila } = await admin.from("miembros").insert({ email, personaje, activo: true });
    if (errFila) return json(500, { error: "Usuario creado pero falló la fila de miembro: " + errFila.message });

    return json(200, {
      ok: true,
      email,
      personaje,
      clave: usuarioYaExistia ? null : clave,
      usuarioYaExistia,
    });
  }

  // Para nueva_clave y baja necesitamos el id del usuario de Authentication.
  async function buscarUsuarioId(): Promise<string | null> {
    // listUsers no filtra por email en esta versión: paginamos hasta encontrarlo.
    for (let page = 1; page <= 20; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error || !data?.users?.length) return null;
      const u = data.users.find((x) => x.email?.toLowerCase() === email);
      if (u) return u.id;
      if (data.users.length < 200) return null;
    }
    return null;
  }

  if (accion === "nueva_clave") {
    const id = await buscarUsuarioId();
    if (!id) return json(404, { error: "No existe un usuario de Authentication con ese email." });
    const clave = generarClave();
    const { error } = await admin.auth.admin.updateUserById(id, { password: clave });
    if (error) return json(500, { error: "No se pudo cambiar la clave: " + error.message });
    return json(200, { ok: true, email, clave });
  }

  if (accion === "baja") {
    if (esEmailAdmin(email)) return json(400, { error: "No podés borrar un email de admin desde acá." });
    const id = await buscarUsuarioId();
    if (id) {
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) return json(500, { error: "No se pudo borrar el usuario: " + error.message });
    }
    const { error: errFila } = await admin.from("miembros").delete().eq("email", email);
    if (errFila) return json(500, { error: "Usuario borrado pero falló la fila: " + errFila.message });
    return json(200, { ok: true, email, usuarioBorrado: !!id });
  }

  return json(400, { error: "Acción desconocida." });
}
