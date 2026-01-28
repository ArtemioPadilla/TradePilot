# Settings User Journeys

## Descripción
Flujos de configuración de cuenta, apariencia, seguridad y conexiones.

## Páginas Cubiertas
- `/dashboard/settings` - Configuración de usuario

## Componentes Clave
- `AccountSettingsForm` - Configuración de perfil
- `AppearanceSettingsForm` - Tema y densidad visual
- `SecuritySettingsForm` - Contraseña y 2FA
- `ConnectionsSettingsForm` - Conexiones de broker

## User Journeys

### 1. Profile Settings (profile-settings.spec.ts)
**Descripción**: Usuario actualiza su información de perfil.

**Precondiciones**:
- Usuario autenticado

**Flujo**:
1. Navegar a `/dashboard/settings`
2. Ver/editar nombre de display
3. Ver/editar email (si permitido)
4. Actualizar foto de perfil
5. Guardar cambios

**Assertions**:
- Datos actuales pre-llenados
- Validación de campos
- Mensaje de éxito al guardar

### 2. Appearance Settings (appearance-settings.spec.ts)
**Descripción**: Usuario personaliza la apariencia de la app.

**Flujo**:
1. Navegar a settings
2. Ver opciones de tema
3. Seleccionar tema (Light, Dark, Bloomberg, Modern)
4. Seleccionar densidad (Compact, Comfortable, Spacious)
5. Ver preview en tiempo real
6. Guardar preferencias

**Assertions**:
- Temas disponibles visibles
- Cambio de tema se aplica inmediatamente
- Preferencia persiste entre sesiones

### 3. Security Settings (security-settings.spec.ts)
**Descripción**: Usuario actualiza configuración de seguridad.

**Flujo**:
1. Navegar a security settings
2. Cambiar contraseña
3. Habilitar/deshabilitar 2FA
4. Ver sesiones activas
5. Cerrar otras sesiones

**Assertions**:
- Formulario de cambio de contraseña
- Validación de contraseña actual
- Confirmación de nueva contraseña
- Estado de 2FA visible

### 4. Connections Settings (connections-settings.spec.ts)
**Descripción**: Usuario gestiona conexiones a servicios externos.

**Flujo**:
1. Navegar a connections settings
2. Ver conexiones activas (Alpaca, etc.)
3. Agregar nueva conexión
4. Eliminar conexión existente

**Assertions**:
- Lista de conexiones visible
- Estado de cada conexión
- Acciones de conectar/desconectar

## Temas Disponibles

| Tema | Descripción |
|------|-------------|
| Light | Tema claro por defecto |
| Dark | Tema oscuro |
| Bloomberg | Estilo terminal Bloomberg |
| Modern | Diseño moderno minimalista |
| Custom | Tema personalizado (futuro) |

## Opciones de Densidad

| Densidad | Descripción |
|----------|-------------|
| Compact | UI más compacta, más información visible |
| Comfortable | Balance entre densidad y legibilidad |
| Spacious | UI más espaciada, mejor accesibilidad |

## Estructura de la Página de Settings

```
┌─────────────────────────────────────────────────────────┐
│  Settings                                                │
├───────────────┬─────────────────────────────────────────┤
│               │                                          │
│  [Account]    │  Account Settings                        │
│               │  ────────────────────────                │
│  [Appearance] │  Display Name: [John Doe        ]       │
│               │  Email: john@example.com                 │
│  [Security]   │  Profile Photo: [Upload]                 │
│               │                                          │
│  [Connections]│            [Save Changes]                │
│               │                                          │
│  [Notifications]│                                        │
│               │                                          │
└───────────────┴─────────────────────────────────────────┘
```

## Código de Ejemplo

```typescript
import { test, expect } from '@playwright/test';
import { ensureAuthenticated, waitForPageReady } from '../_shared';

test.describe('Journey: Appearance Settings', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/settings');
    await waitForPageReady(page);
  });

  test('should display theme options', async ({ page }) => {
    // Navigate to appearance section
    const appearanceTab = page.getByRole('tab', { name: /appearance/i });
    if (await appearanceTab.isVisible()) {
      await appearanceTab.click();
    }

    // Check for theme options
    const lightTheme = page.locator('text=/light/i');
    const darkTheme = page.locator('text=/dark/i');

    await expect(lightTheme.first()).toBeVisible();
    await expect(darkTheme.first()).toBeVisible();
  });

  test('should change theme on selection', async ({ page }) => {
    // Navigate to appearance
    const appearanceTab = page.getByRole('tab', { name: /appearance/i });
    if (await appearanceTab.isVisible()) {
      await appearanceTab.click();
    }

    // Click dark theme
    const darkButton = page.getByRole('button', { name: /dark/i });
    if (await darkButton.isVisible()) {
      await darkButton.click();

      // Verify theme changed
      const html = page.locator('html');
      await expect(html).toHaveAttribute('data-theme', /dark/i);
    }
  });
});
```
