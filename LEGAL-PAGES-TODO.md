# Páginas legales pendientes

Handoff para la sesión de frontend público. Todo esto es UI/contenido, no requiere backend nuevo salvo lo que se marca abajo.

## Páginas a crear

1. `/privacidad` — Política de Privacidad
2. `/terminos` — Términos de Servicio
3. `/dmca` — Política de DMCA / derechos de autor
4. `/cookies` — Política de Cookies (puede ir dentro de Privacidad como sección)

## Contenido mínimo de cada una

**Privacidad**
- Qué datos se recolectan: cuenta (nombre, email, avatar de Google), comentarios, likes/favoritos, IP para límites de rate/vistas
- Con quién se comparten: Google (login), proveedores de IA usados para redactar/generar imágenes (Anthropic, OpenAI — no se les manda dato personal del usuario, solo contenido editorial)
- Cómo pedir borrado de cuenta/datos
- Contacto para consultas de privacidad

**Términos de Servicio**
- Reglas de uso del sitio y de los comentarios
- Que el contenido editorial es reescrito/curado a partir de otras fuentes, con crédito
- Limitación de responsabilidad
- Qué pasa si se banean cuentas

**DMCA**
- Cómo reclamar por contenido con derechos de autor (imagen o texto)
- Email o formulario de contacto para reclamos
- Proceso de baja del contenido reclamado

**Cookies**
- Qué cookies usa el sitio (sesión, preferencia de tema claro/oscuro)
- Banner de consentimiento la primera vez que entra un visitante

## En el footer del sitio

Enlaces a las 4 páginas, visibles en todas las pantallas.

## Contacto legal

Un email o formulario visible en el footer y en la página de DMCA (ej. `legal@kawaiinews.com` o el que corresponda).

## Pendiente para mí (backend)

- Borrar cuenta ya existe (`ProfileSettingsController::destroy`, ajustes de perfil). Solo hay que linkear a eso desde la página de Privacidad.
- Guardar la fecha en que el usuario aceptó los Términos, si se decide pedir aceptación explícita al registrarse (no existe todavía).

## Fuentes de referencia

- https://www.copyright.gov/dmca/
- https://gdpr.eu
- https://termly.io
- https://www.argentina.gob.ar/aaip
- https://www.ftc.gov/business-guidance/resources/dot-com-disclosures-information-about-online-advertising
