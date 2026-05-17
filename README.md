# CamuStore

Tienda web de items de Mu Online (servidor Guerra Eterna).

## Stack

- **Framework**: Next.js 14 (App Router)
- **Estilos**: Tailwind CSS 3
- **Fuentes**: Cinzel (display), JetBrains Mono (body), Orbitron (numérico)
- **Deploy**: Vercel
- **Datos**: Mock data en `lib/items-mock.ts` (Phase 1)

## Páginas

- `/` — Landing con hero y CTAs
- `/items` — Catálogo público con buscador y filtros
- `/cotizador` — Placeholder (en desarrollo)
- `/consignar` — Placeholder (en desarrollo)

## Configuración

Editá `lib/config.ts` para personalizar:

- `WHATSAPP_NUMBER` — tu número en formato internacional (ej: `5493510000000`)
- `STORE_NAME` — nombre de la tienda
- `STORE_TAGLINE` — tagline

## Desarrollo local

```bash
npm install
npm run dev
```

Después abrí http://localhost:3000

## Deploy en Vercel

1. Subí este repo a GitHub.
2. En Vercel: New Project → Import → seleccioná el repo.
3. Vercel detecta Next.js automáticamente. Clic en Deploy.
4. Listo: tu web estará en `camustore-web-XXX.vercel.app`.

## Próximos pasos (Phase 2)

- [ ] Conectar Supabase para datos reales
- [ ] Cotizador funcional con cálculos en vivo
- [ ] Auth con Google para consignación
- [ ] Panel admin (aprobar items)
- [ ] Categorías de jewels y seeds
- [ ] Imágenes de personajes por raza 
