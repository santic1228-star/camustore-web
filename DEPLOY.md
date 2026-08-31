# DEPLOY v9 — Timeline: fix Hydra + regla de los 20 min + Ice Queen lunes

**Qué deja en prod:** las ocurrencias ya no desaparecen al arrancar — todo entra
en **EN CURSO · quedan X min** (dura 20 min por default, tu regla); Pregunta
Seria con 00:15 y 21:15; Ice Queen con la del **lunes 10:30**; countdown en
**verde** cuando faltan menos de 5 min (como la ventana del juego).

**No hay SQL en este deploy.** Solo subir archivos.

## Qué hay en este ZIP

- `DEPLOY.md` ← este archivo (no hace falta subirlo)
- carpeta `lib/` (3 archivos)
- carpeta `components/` (1 archivo)
- carpeta `app/` (1 archivo)

Son **5 archivos** en total. Nunca más de 100: este ZIP trae SOLO lo que cambia.

## Pasos (5 minutos)

1. Descargar el ZIP y **click derecho → "Extraer todo"**. ⚠ Nunca arrastrar
   desde adentro del ZIP abierto: Windows aplana las carpetas.
2. Ir a github.com → tu repo. **Mirar la barra de ruta: tiene que decir solo
   `camustore-web`**, sin ninguna carpeta después. Si dice `camustore-web / app`
   o similar, volver a la raíz del repo antes de seguir.
3. `Add file` → `Upload files`.
4. De la carpeta extraída, **seleccionar las 3 carpetas** (`lib`, `components`,
   `app`) **y arrastrarlas juntas, de una sola vez**. El `DEPLOY.md` quedarse
   afuera (si va, no rompe nada).
5. Antes de confirmar: la lista de carga tiene que mostrar **rutas con barras**
   (ej: `lib/eventos-catalogo.ts`). Si ves nombres pelados sin carpeta, cancelar
   y volver al paso 1.
6. Commit directo a `main` con cualquier mensaje corto (ej: "timeline v9").
   En el commit deberían figurar **hasta 5 archivos**:
   - `lib/eventos-catalogo.ts`
   - `lib/itinerario.ts`
   - `lib/timeline-items.ts`
   - `components/TimelineZig.tsx`
   - `app/admin/SeccionEventos.tsx`
   (si subiste alguna versión intermedia antes, pueden figurar menos — es
   normal: GitHub ignora los idénticos)
7. Esperar el verde de Vercel (1-2 min). Rojo = captura del log al chat.

## Cómo probar que funcionó

- `/herramientas/timeline`: en "Fijos de la semana", Ice Queen tiene que decir
  **lunes 10:30**.
- Cuando a un evento le falten menos de 5 minutos, su countdown se pone
  **verde**.
- Cuando un evento arranque (probá con cualquiera: hay uno cada rato), en vez
  de desaparecer tiene que mostrar **EN CURSO · quedan X min** durante 20
  minutos (lunes 10:30 la Ice Queen mismo 🧊).
- En `/admin` → 🗓 Eventos, el campo de duración ahora dice "vacío = 20".

Cualquier cosa rara: captura y al chat.
