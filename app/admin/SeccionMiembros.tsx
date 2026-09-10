"use client";

import { useEffect, useState } from "react";
import { FieldLabel, TextInput } from "@/components/ui/FormField";
import { GUILD_ICONO, GUILD_LABEL, GUILDS, guildDe, otraGuild, type Guild } from "@/lib/guilds";
import {
  actualizarMiembro,
  altaMiembroCompleta,
  bajaMiembroCompleta,
  listarMiembros,
  nuevaClaveMiembro,
  type AltaResultado,
} from "@/lib/miembros";
import type { MiembroRow } from "@/lib/database.types";

// =====================================================
// Admin · Miembros
// Alta en UN paso: crea el usuario de Authentication (con clave generada)
// y la fila en `miembros`, vía app/api/admin/miembros (servidor).
// Requiere SUPABASE_SERVICE_ROLE_KEY en Vercel.
// Alianza (10/09): al dar de alta se elige la guild (propia / alianza); la
// columna "Guild" de la tabla se cambia con un click.
// =====================================================

const URL_MIEMBROS = "https://camustore-web.vercel.app/miembros";

function mensajeBienvenida(personaje: string, email: string, clave: string | null, guild: Guild): string {
  const lineaClave = clave ? `Tu clave es: ${clave}\n` : "Entrás con la clave que ya tenías.\n";
  const cierre =
    guild === "alianza"
      ? `Ahí está la timeline de eventos y los timers de Gaion, Kundun y Cryonox de tu guild. Cuando alguno se comparte con la alianza, lo vemos las dos guilds.`
      : `Ahí están los timers compartidos de Gaion, Kundun y Cryonox: el que carga, lo ve toda la guild.`;
  return (
    `Hola ${personaje}! Te di de alta en la zona de miembros de CamuStore.\n` +
    `Entrá en ${URL_MIEMBROS} con tu email ${email}.\n` +
    lineaClave +
    cierre
  );
}

async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

export default function SeccionMiembros() {
  const [miembros, setMiembros] = useState<MiembroRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Última clave generada (alta o nueva clave), para mostrarla y copiarla. */
  const [claveReciente, setClaveReciente] = useState<AltaResultado | null>(null);

  async function cargar() {
    setLoading(true);
    setError(null);
    try {
      setMiembros(await listarMiembros());
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la lista.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    cargar();
  }, []);

  async function toggleGuild(m: MiembroRow) {
    const nueva = otraGuild(guildDe(m.guild));
    if (!confirm(`¿Pasar a ${m.personaje} a "${GUILD_LABEL[nueva]}"? Va a ver los horarios privados de esa guild, no los de la actual.`)) return;
    try {
      await actualizarMiembro(m.id, { guild: nueva });
      cargar();
    } catch (e) {
      alert("Error: " + (e instanceof Error ? e.message : e));
    }
  }

  async function toggleActivo(m: MiembroRow) {
    try {
      await actualizarMiembro(m.id, { activo: !m.activo });
      cargar();
    } catch (e) {
      alert("Error: " + (e instanceof Error ? e.message : e));
    }
  }

  async function nuevaClave(m: MiembroRow) {
    if (!confirm(`¿Generar una clave nueva para ${m.personaje}? La anterior deja de servir.`)) return;
    try {
      const clave = await nuevaClaveMiembro(m.email);
      setClaveReciente({ email: m.email, personaje: m.personaje, clave, usuarioYaExistia: false, guild: guildDe(m.guild) });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      alert("Error: " + (e instanceof Error ? e.message : e));
    }
  }

  async function baja(m: MiembroRow) {
    if (!confirm(`¿Dar de baja a ${m.personaje} (${m.email})? Se borra su usuario y deja de poder entrar. Sus registros quedan.`)) return;
    try {
      await bajaMiembroCompleta(m.email);
      if (claveReciente?.email === m.email) setClaveReciente(null);
      cargar();
    } catch (e) {
      alert("Error: " + (e instanceof Error ? e.message : e));
    }
  }

  const activos = miembros.filter((m) => m.activo).length;
  const deAlianza = miembros.filter((m) => guildDe(m.guild) === "alianza").length;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="font-display font-bold text-2xl text-text-primary">👥 Miembros</h2>
        <span className="font-body text-xs text-text-secondary">
          {activos} activo{activos === 1 ? "" : "s"} · {miembros.length} en total
          {deAlianza > 0 && <> · {deAlianza} de {GUILD_LABEL.alianza}</>}
        </span>
      </div>

      {claveReciente && (
        <PanelClave datos={claveReciente} onCerrar={() => setClaveReciente(null)} />
      )}

      <AltaForm
        onSaved={(r) => {
          setClaveReciente(r);
          cargar();
        }}
      />

      {error && <p className="font-body text-sm text-danger-red">{error}</p>}

      {loading ? (
        <p className="font-body text-text-secondary animate-pulse">Cargando…</p>
      ) : miembros.length === 0 ? (
        <p className="font-body text-text-muted text-center py-8">Todavía no hay miembros cargados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-base text-left font-body text-xs uppercase tracking-wider text-text-muted">
                <th className="py-2 pr-3">Personaje</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Guild</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3 hidden md:table-cell">Alta</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {miembros.map((m) => (
                <tr key={m.id} className="border-b border-border-base/40 font-body hover:bg-bg-card/30">
                  <td className="py-2 pr-3 text-text-primary font-bold">{m.personaje}</td>
                  <td className="py-2 pr-3 text-text-secondary break-all">{m.email}</td>
                  <td className="py-2 pr-3">
                    <button
                      onClick={() => toggleGuild(m)}
                      className={`badge border transition-colors whitespace-nowrap ${
                        guildDe(m.guild) === "alianza"
                          ? "bg-luck-gold/10 text-luck-gold border-luck-gold/40 hover:bg-luck-gold/20"
                          : "bg-success-green/10 text-success-green border-success-green/40 hover:bg-success-green/20"
                      }`}
                      title="Click para pasarlo a la otra guild"
                    >
                      {GUILD_ICONO[guildDe(m.guild)]} {GUILD_LABEL[guildDe(m.guild)]}
                    </button>
                  </td>
                  <td className="py-2 pr-3">
                    <button
                      onClick={() => toggleActivo(m)}
                      className={`badge border transition-colors ${
                        m.activo
                          ? "bg-success-green/15 text-success-green border-success-green/40 hover:bg-success-green/25"
                          : "bg-bg-card text-text-muted border-border-base hover:border-border-strong"
                      }`}
                      title={m.activo ? "Click para desactivar (no puede entrar, conserva el usuario)" : "Click para activar"}
                    >
                      {m.activo ? "activo" : "inactivo"}
                    </button>
                  </td>
                  <td className="py-2 pr-3 text-text-muted hidden md:table-cell">
                    {new Date(m.created_at).toLocaleDateString("es-AR")}
                  </td>
                  <td className="py-2 text-right whitespace-nowrap">
                    <button
                      onClick={() => nuevaClave(m)}
                      className="px-2 py-1 rounded font-body text-xs border border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10 transition-colors"
                      title="Genera una clave nueva (si se la olvidó)"
                    >
                      Nueva clave
                    </button>
                    <button
                      onClick={() => baja(m)}
                      className="ml-2 px-2 py-1 rounded font-body text-xs text-text-muted hover:text-danger-red transition-colors"
                    >
                      Baja
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="font-body text-[11px] text-text-muted">
        <span className="text-text-secondary">Inactivo</span> = no puede entrar pero conserva usuario y clave.{" "}
        <span className="text-text-secondary">Baja</span> = se borra el usuario; si vuelve, se lo da de alta de nuevo.{" "}
        <span className="text-text-secondary">Guild</span> = qué horarios privados ve (los de{" "}
        {GUILD_LABEL.propia} o los de {GUILD_LABEL.alianza}); un click lo cambia.
        Vos entrás a /miembros aunque no estés en la lista (sos admin, contás como {GUILD_LABEL.propia}); agregate si querés firmar con tu personaje.
      </p>
    </div>
  );
}

// =====================================================
// Alta (un paso)
// =====================================================

function AltaForm({ onSaved }: { onSaved: (r: AltaResultado) => void }) {
  const [email, setEmail] = useState("");
  const [personaje, setPersonaje] = useState("");
  const [guild, setGuild] = useState<Guild>("propia");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const valido = emailOk && personaje.trim().length >= 2;

  async function guardar() {
    if (!valido) return;
    setGuardando(true);
    setError(null);
    try {
      const r = await altaMiembroCompleta(email, personaje, guild);
      setEmail("");
      setPersonaje("");
      onSaved({ ...r, guild });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo dar de alta.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="gamer-card rounded-lg p-4 sm:p-5">
      <h3 className="font-display font-bold text-base text-text-primary mb-1">Nuevo miembro</h3>
      <p className="font-body text-xs text-text-secondary mb-3">
        Se crea el usuario con una clave generada y queda listo para entrar. La clave aparece acá
        arriba para que se la pases por WhatsApp. Mismo login para las dos guilds: la guild define
        qué horarios privados ve.
      </p>
      <div className="mb-3">
        <FieldLabel>Guild</FieldLabel>
        <div className="inline-flex bg-bg-card border border-border-base rounded p-0.5 gap-0.5">
          {GUILDS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGuild(g)}
              className={`px-4 py-1.5 rounded font-body text-xs uppercase tracking-wider transition-all ${
                guild === g
                  ? g === "alianza"
                    ? "bg-luck-gold text-bg-deep font-bold"
                    : "bg-success-green text-bg-deep font-bold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {GUILD_ICONO[g]} {GUILD_LABEL[g]}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <div>
          <FieldLabel>Email</FieldLabel>
          <TextInput value={email} onChange={setEmail} placeholder="compa@gmail.com" />
        </div>
        <div>
          <FieldLabel>Personaje</FieldLabel>
          <TextInput value={personaje} onChange={setPersonaje} placeholder="Nombre en el juego" />
        </div>
        <button
          onClick={guardar}
          disabled={!valido || guardando}
          className="btn-primary px-5 py-2.5 rounded font-body text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {guardando ? "Creando…" : "Dar de alta"}
        </button>
      </div>
      {error && <p className="font-body text-xs text-danger-red mt-3">{error}</p>}
    </section>
  );
}

// =====================================================
// Panel con la clave recién generada (se muestra una sola vez)
// =====================================================

function PanelClave({ datos, onCerrar }: { datos: AltaResultado; onCerrar: () => void }) {
  const [copiadoClave, setCopiadoClave] = useState(false);
  const [copiadoMsg, setCopiadoMsg] = useState(false);

  async function copiarClave() {
    if (!datos.clave) return;
    if (await copiarTexto(datos.clave)) {
      setCopiadoClave(true);
      setTimeout(() => setCopiadoClave(false), 1800);
    }
  }

  async function copiarMensaje() {
    if (await copiarTexto(mensajeBienvenida(datos.personaje, datos.email, datos.clave, datos.guild ?? "propia"))) {
      setCopiadoMsg(true);
      setTimeout(() => setCopiadoMsg(false), 1800);
    }
  }

  return (
    <section className="rounded-lg border border-success-green/50 bg-success-green/5 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-body text-[10px] uppercase tracking-[0.3em] text-success-green mb-1">
            {datos.usuarioYaExistia ? "Miembro cargado" : "Listo para entrar"}
          </p>
          <p className="font-body text-sm text-text-primary">
            <span className="font-bold">{datos.personaje}</span>{" "}
            <span className="text-text-secondary break-all">({datos.email})</span>
            {datos.guild && (
              <span className={`ml-2 badge border ${
                datos.guild === "alianza"
                  ? "bg-luck-gold/10 text-luck-gold border-luck-gold/40"
                  : "bg-success-green/10 text-success-green border-success-green/40"
              }`}>
                {GUILD_ICONO[datos.guild]} {GUILD_LABEL[datos.guild]}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={onCerrar}
          className="px-2 py-1 rounded font-body text-xs text-text-muted hover:text-text-secondary"
          title="Cerrar"
        >
          ✕
        </button>
      </div>

      {datos.clave ? (
        <>
          <p className="font-body text-xs text-text-secondary mt-3">
            Clave (se muestra una sola vez; si se pierde, &quot;Nueva clave&quot;):
          </p>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <code className="font-numeric text-xl sm:text-2xl tracking-widest text-luck-gold bg-black/50 border border-border-strong rounded px-3 py-1.5 select-all">
              {datos.clave}
            </code>
            <button
              onClick={copiarClave}
              className="px-3 py-1.5 rounded font-body text-xs uppercase tracking-widest border border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10 transition-colors"
            >
              {copiadoClave ? "✓ Copiada" : "Copiar clave"}
            </button>
          </div>
        </>
      ) : (
        <p className="font-body text-xs text-text-secondary mt-3">
          El usuario ya existía en Supabase: entra con la clave que tenía. Si no la sabe, usá &quot;Nueva clave&quot;.
        </p>
      )}

      <button
        onClick={copiarMensaje}
        className="btn-primary mt-3 px-4 py-2 rounded font-body text-xs uppercase tracking-widest"
      >
        {copiadoMsg ? "✓ Copiado" : "Copiar mensaje de bienvenida para WhatsApp"}
      </button>
    </section>
  );
}
