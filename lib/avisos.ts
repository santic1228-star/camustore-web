/**
 * Avisos de la zona de miembros — sonido, notificación del sistema y vibración.
 *
 * Umbrales (DECISIONES, 23/08): 15 min antes, 5 min antes y el momento exacto.
 * Todo es "best effort" del navegador:
 *   - Sonido: requiere que el usuario haya activado el toggle (gesto de usuario
 *     que desbloquea el AudioContext). Se genera con Web Audio, sin archivos.
 *   - Notificación del sistema: si el usuario dio permiso, suena/aparece aunque
 *     la pestaña esté en segundo plano. Con el navegador CERRADO no hay aviso
 *     (eso necesita un servidor de push → futuro bot).
 *   - Vibración: celulares que lo soporten.
 *
 * La preferencia se guarda en localStorage (funciona en la app de Vercel).
 */

const STORAGE_KEY = "camustore_avisos_v1";

export function avisosActivados(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

export function guardarAvisos(on: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {}
}

// =====================================================
// Sonido (Web Audio, sin assets)
// =====================================================

let ctx: AudioContext | null = null;

/** Llamar desde un click del usuario: desbloquea el audio y hace un beep de prueba. */
export function desbloquearSonido(): void {
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    tono(880, 0.12, 0);
  } catch {}
}

function tono(freq: number, dur: number, delay: number, volumen = 0.18): void {
  if (!ctx) return;
  try {
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volumen, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch {}
}

/**
 * Beep del aviso. urgencia: 15 → dos notas suaves · 5 → tres notas ·
 * 0 (¡abrió/respawneó!) → fanfarria corta ascendente.
 */
export function sonarAviso(umbral: number): void {
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
  if (umbral >= 15) {
    tono(660, 0.15, 0);
    tono(880, 0.2, 0.2);
  } else if (umbral > 0) {
    tono(660, 0.12, 0);
    tono(880, 0.12, 0.16);
    tono(1046, 0.22, 0.32);
  } else {
    tono(523, 0.12, 0);
    tono(659, 0.12, 0.14);
    tono(784, 0.12, 0.28);
    tono(1046, 0.35, 0.42);
  }
}

// =====================================================
// Notificaciones del sistema
// =====================================================

export function soportaNotificaciones(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function permisoNotificaciones(): NotificationPermission | "no-soportado" {
  return soportaNotificaciones() ? Notification.permission : "no-soportado";
}

/** Pedir permiso (solo tiene sentido desde un click). Devuelve si quedó concedido. */
export async function pedirPermisoNotificaciones(): Promise<boolean> {
  if (!soportaNotificaciones()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

export function notificar(titulo: string, cuerpo: string, tag: string): void {
  if (!soportaNotificaciones() || Notification.permission !== "granted") return;
  try {
    const n = new Notification(titulo, { body: cuerpo, tag, icon: "/favicon.ico" });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {}
}

// =====================================================
// Vibración (celulares)
// =====================================================

export function vibrar(umbral: number): void {
  try {
    navigator.vibrate?.(umbral === 0 ? [250, 100, 250, 100, 400] : [200, 100, 200]);
  } catch {}
}
