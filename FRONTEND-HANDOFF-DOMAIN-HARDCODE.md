# Dominio hardcodeado — reemplazar por props dinámicas

Encontré `kawaiinews.com` tipeado a mano en 4 lugares del frontend público. El backend ya no tiene ningún dominio hardcodeado (usa `url()`/`config('app.url')` en todos lados), así que agregué dos props compartidas por Inertia que ahora llegan a **todas** las páginas (públicas y admin), siempre en sync con el dominio real:

```ts
const { siteUrl, contactEmail } = usePage().props;
// siteUrl      -> "https://kawaiinews.com" (o el dominio que sea, sin barra final)
// contactEmail -> "legal@kawaiinews.com" (o el que se cargue en Configuración del sitio, si no, se arma solo con el dominio real)
```

Ya están tipadas en `resources/js/types/global.d.ts` (`sharedPageProps.siteUrl: string`, `sharedPageProps.contactEmail: string`).

## Archivos a corregir

1. **`resources/js/pages/public/legal/privacy.tsx`** (líneas ~93-96) — `mailto:legal@kawaiinews.com` y el texto visible → usar `contactEmail`.
2. **`resources/js/pages/public/legal/legal-layout.tsx`** (líneas ~83-86) — mismo caso.
3. **`resources/js/pages/public/legal/dmca.tsx`** (líneas ~39-42) — mismo caso.
4. **`resources/js/components/public/share-story-modal.tsx`** (líneas ~198 y ~312) — el texto `'kawaiinews.com'` dibujado en el canvas de la imagen para compartir, y el que se muestra en pantalla → usar `siteUrl` (sacándole el `https://` si hace falta un texto más corto, ej. `siteUrl.replace(/^https?:\/\//, '')`).

## Por qué así y no un campo nuevo en Configuración del sitio

El dominio (`siteUrl`) **no** se agregó como campo editable a mano en `/admin/site-settings` — se deriva siempre de `APP_URL` (que ya es la fuente de verdad real del dominio en producción). Un campo de texto aparte se podría desincronizar si el sitio cambia de dominio y alguien se olvida de actualizarlo a mano. `contactEmail` sí es editable (Configuración del sitio → tab "Identidad y SEO" → "Email de contacto"), porque el local-part del email (`legal@`, `soporte@`, `dmca@`) no se puede inferir solo del dominio — pero si se deja vacío, cae solo a `legal@{dominio real}`.
