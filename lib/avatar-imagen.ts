/**
 * Avatares por imagen (M4, 31/08/2026) — la parte de IMAGEN, sin Supabase.
 *
 * El miembro elige una foto, la encuadra (arrastra y hace zoom dentro de un
 * marco cuadrado) y la web la recorta y redimensiona EN EL NAVEGADOR a
 * AVATAR_PX × AVATAR_PX antes de subirla (DECISIONES §12): el free de Supabase
 * no tiene transformaciones de imagen y así 100 miembros son ~2 MB de storage.
 *
 * Todo lo que es matemática pura (cómo se mapea el marco a la imagen) está
 * separado de lo que toca el DOM (canvas), para poder probarlo con `node -e`.
 */

/** Lado del avatar guardado, en px (Santi, 31/08: 256). */
export const AVATAR_PX = 256;
/** Zoom máximo sobre el encuadre mínimo (1 = la imagen justo cubre el marco). */
export const ZOOM_MAX = 3;
/** Tamaño máximo del archivo original que aceptamos leer (la foto de un celu ronda 2-5 MB). */
export const ORIGINAL_MAX_BYTES = 20 * 1024 * 1024;
/** Tamaño máximo del archivo que subimos; el bucket tiene el mismo tope como red de seguridad. */
export const SUBIDA_MAX_BYTES = 300 * 1024;

/** Encuadre elegido por el miembro, en px del MARCO (no de la imagen). */
export interface Encuadre {
  /** Zoom relativo al encuadre mínimo que cubre el marco: 1 … ZOOM_MAX. */
  zoom: number;
  /** Desplazamiento del centro de la imagen respecto del centro del marco. */
  dx: number;
  dy: number;
}

export interface Dimensiones {
  ancho: number;
  alto: number;
}

/**
 * Escala con la que la imagen queda mostrada dentro de un marco cuadrado de
 * lado `marco` con el zoom dado. Con zoom 1 el lado MENOR de la imagen mide
 * exactamente `marco` (cover).
 */
export function escalaMostrada(img: Dimensiones, marco: number, zoom: number): number {
  return (marco / Math.min(img.ancho, img.alto)) * zoom;
}

/** Máximo desplazamiento permitido en cada eje para que la imagen siga cubriendo el marco. */
export function limitesDesplazamiento(img: Dimensiones, marco: number, zoom: number): { maxDx: number; maxDy: number } {
  const s = escalaMostrada(img, marco, zoom);
  return {
    maxDx: Math.max(0, (img.ancho * s - marco) / 2),
    maxDy: Math.max(0, (img.alto * s - marco) / 2),
  };
}

/** Devuelve el encuadre con zoom acotado a [1, ZOOM_MAX] y dx/dy dentro de los límites. */
export function acotarEncuadre(img: Dimensiones, marco: number, e: Encuadre): Encuadre {
  const zoom = Math.min(ZOOM_MAX, Math.max(1, e.zoom));
  const { maxDx, maxDy } = limitesDesplazamiento(img, marco, zoom);
  return {
    zoom,
    dx: Math.min(maxDx, Math.max(-maxDx, e.dx)),
    dy: Math.min(maxDy, Math.max(-maxDy, e.dy)),
  };
}

/**
 * Cómo se posiciona la imagen dentro del marco (CSS): tamaño mostrado y
 * esquina superior izquierda relativa al marco.
 */
export function posicionMostrada(img: Dimensiones, marco: number, e: Encuadre) {
  const s = escalaMostrada(img, marco, e.zoom);
  const ancho = img.ancho * s;
  const alto = img.alto * s;
  return {
    ancho,
    alto,
    left: marco / 2 + e.dx - ancho / 2,
    top: marco / 2 + e.dy - alto / 2,
  };
}

/** Rectángulo de la imagen ORIGINAL (en px de la imagen) que ocupa el marco. */
export function rectanguloOrigen(img: Dimensiones, marco: number, e: Encuadre) {
  const s = escalaMostrada(img, marco, e.zoom);
  const p = posicionMostrada(img, marco, e);
  return {
    sx: -p.left / s,
    sy: -p.top / s,
    sw: marco / s,
    sh: marco / s,
  };
}

// =====================================================
// Lo que toca el DOM
// =====================================================

/** Lee un File como <img> listo para dibujar. Rechaza con un mensaje entendible. */
export function leerImagen(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (file.size > ORIGINAL_MAX_BYTES) {
      reject(new Error(`La foto pesa ${(file.size / 1024 / 1024).toFixed(1)} MB; el máximo es 20 MB.`));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo abrir esa imagen. Probá con un JPG, PNG o WebP."));
    };
    img.src = url;
  });
}

/**
 * Recorta el `rectanguloOrigen` y lo reduce a AVATAR_PX × AVATAR_PX.
 * Reduce en pasos de a la mitad (mejor calidad que un solo drawImage de 4000 → 256).
 * Devuelve WebP; si el navegador no sabe codificar WebP (Safari viejo), JPEG.
 */
export async function generarAvatar(
  img: HTMLImageElement,
  marco: number,
  encuadre: Encuadre,
): Promise<{ blob: Blob; extension: "webp" | "jpg" }> {
  const dims: Dimensiones = { ancho: img.naturalWidth, alto: img.naturalHeight };
  const { sx, sy, sw, sh } = rectanguloOrigen(dims, marco, acotarEncuadre(dims, marco, encuadre));

  // Paso 1: recorte a un canvas del tamaño del recorte (o ya reducido si es enorme).
  let lado = Math.round(sw);
  let fuente: CanvasImageSource = img;
  let src = { x: sx, y: sy, w: sw, h: sh };
  while (lado > AVATAR_PX * 2) {
    lado = Math.ceil(lado / 2);
    const c = document.createElement("canvas");
    c.width = lado;
    c.height = lado;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("El navegador no soporta canvas.");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(fuente, src.x, src.y, src.w, src.h, 0, 0, lado, lado);
    fuente = c;
    src = { x: 0, y: 0, w: lado, h: lado };
  }

  // Paso 2: al tamaño final.
  const final = document.createElement("canvas");
  final.width = AVATAR_PX;
  final.height = AVATAR_PX;
  const ctx = final.getContext("2d");
  if (!ctx) throw new Error("El navegador no soporta canvas.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(fuente, src.x, src.y, src.w, src.h, 0, 0, AVATAR_PX, AVATAR_PX);

  const webp = await aBlob(final, "image/webp", 0.86);
  if (webp && webp.type === "image/webp") return { blob: webp, extension: "webp" };
  const jpg = await aBlob(final, "image/jpeg", 0.86);
  if (!jpg) throw new Error("No se pudo generar la imagen.");
  return { blob: jpg, extension: "jpg" };
}

function aBlob(canvas: HTMLCanvasElement, tipo: string, calidad: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, tipo, calidad));
}

/** Texto amigable del peso de un archivo. */
export function textoPeso(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
