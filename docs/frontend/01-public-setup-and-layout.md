# Layout y setup inicial público

Configuración del entorno público para visitantes, con diseño propio en Tailwind CSS v4 (sin componentes Shadcn del panel de administración), resolución de layout desacoplada y soporte de tema claro y oscuro.

## Separación de layouts en `resources/js/app.tsx`

Para evitar que el layout del panel administrativo (`AppLayout` con sidebar y header privado) se aplique en la navegación pública, `app.tsx` resuelve layouts por prefijo de ruta:

```tsx
layout: (name) => {
    switch (true) {
        case name === 'welcome' || name.startsWith('public/'):
            return null;
        case name.startsWith('auth/'):
            return AuthLayout;
        case name.startsWith('settings/'):
            return [AppLayout, SettingsLayout];
        case name.startsWith('admin/'):
            return AppLayout;
        default:
            return null;
    }
},
```

Las páginas públicas bajo `resources/js/pages/public/*` envuelven su contenido directamente en `PublicLayout`.

## Componentes del layout público

```
resources/js/
├── layouts/
│   └── public-layout.tsx               Layout público (Navbar + Main + Footer)
├── components/public/
│   ├── navbar.tsx                      Barra de navegación (Logo, categorías, botón de sesión, ThemeToggle)
│   ├── footer.tsx                      Pie de página
│   ├── theme-toggle.tsx                Alternador de modo claro/oscuro
│   └── category-badge.tsx              Etiqueta de categoría con colores temáticos
└── types/
    └── public.ts                       Tipos TypeScript del frontend público
```

## Modo Claro / Oscuro con `useAppearance`

`ThemeToggle` se integra con el hook `@/hooks/use-appearance` del proyecto:

- Alterna entre `light` y `dark` invocando `updateAppearance()`.
- Persiste la preferencia en `localStorage` y en cookie `appearance`.
- El layout y los componentes aplican clases duales de Tailwind (`bg-neutral-50 dark:bg-neutral-950`, bordes, sombras y contrastes tipográficos acordes a cada modo).
