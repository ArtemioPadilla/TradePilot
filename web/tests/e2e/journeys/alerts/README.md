# Alerts User Journeys

## Descripción
Flujos de creación y gestión de alertas de precio y notificaciones.

## Páginas Cubiertas
- `/dashboard/alerts` - Gestión de alertas

## Componentes Clave
- `AlertsPage` - Página principal de alertas
- `AlertCreationForm` - Formulario de creación de alerta
- `AlertsList` - Lista de alertas activas
- `NotificationCenter` - Centro de notificaciones
- `NotificationPreferencesForm` - Configuración de preferencias

## User Journeys

### 1. Create Price Alert (create-alert.spec.ts)
**Descripción**: Usuario crea una alerta de precio para un activo.

**Precondiciones**:
- Usuario autenticado

**Flujo**:
1. Navegar a `/dashboard/alerts`
2. Click en "Create Alert" o "New Alert"
3. Seleccionar tipo de alerta (Price, Volume, P&L)
4. Buscar y seleccionar símbolo
5. Configurar condición (above, below, crosses)
6. Establecer valor umbral
7. Seleccionar canales de notificación
8. Click en "Create Alert"

**Assertions**:
- Formulario de alerta visible
- Búsqueda de símbolos funciona
- Condiciones disponibles
- Alerta aparece en lista después de crear

**Edge Cases**:
- Símbolo inválido → Error de validación
- Valor umbral negativo → Error de validación
- Alerta duplicada → Advertencia

### 2. Manage Alerts (manage-alerts.spec.ts)
**Descripción**: Usuario gestiona sus alertas existentes.

**Flujo**:
1. Ver lista de alertas activas
2. Toggle enable/disable de alerta
3. Editar alerta existente
4. Eliminar alerta
5. Ver historial de alertas disparadas

**Assertions**:
- Lista muestra estado de cada alerta
- Toggle cambia estado visual
- Edición carga valores actuales
- Eliminación requiere confirmación

### 3. Notification Preferences (notification-preferences.spec.ts)
**Descripción**: Usuario configura preferencias de notificación.

**Flujo**:
1. Navegar a preferencias
2. Toggle notificaciones por tipo
3. Toggle canales (push, email, in-app)
4. Configurar horas silenciosas
5. Configurar frecuencia de digest
6. Guardar preferencias

**Assertions**:
- Toggles funcionan correctamente
- Cambios se persisten
- Preview de configuración visible

## Tipos de Alerta

| Tipo | Descripción | Condiciones |
|------|-------------|-------------|
| Price | Alerta de precio | Above, Below, Crosses |
| Volume | Alerta de volumen | Above, Below |
| P&L | Alerta de ganancia/pérdida | Gain %, Loss % |
| Portfolio | Alerta de valor total | Above, Below, Change % |

## Canales de Notificación

| Canal | Descripción |
|-------|-------------|
| Push | Notificación del navegador |
| Email | Correo electrónico |
| In-App | Notificación dentro de la app |
| SMS | Mensaje de texto (futuro) |

## Estructura de la Página de Alertas

```
┌─────────────────────────────────────────────────────────┐
│  My Alerts                          [+ Create Alert]    │
├─────────────────────────────────────────────────────────┤
│  Active Alerts (3)                                       │
│  ┌────────────────────────────────────────────────┐     │
│  │  🔔 AAPL Price Alert              [●] Active   │     │
│  │  Alert when AAPL crosses $180.00               │     │
│  │  Created: Jan 15, 2024   🔕 Push 📧 Email     │     │
│  │  [Edit] [Delete]                               │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  📈 Portfolio P&L Alert           [○] Disabled │     │
│  │  Alert when portfolio gains > 5%               │     │
│  │  Created: Jan 10, 2024   📧 Email             │     │
│  │  [Edit] [Delete]                               │     │
│  └────────────────────────────────────────────────┘     │
├─────────────────────────────────────────────────────────┤
│  Triggered Alerts                                        │
│  ┌────────────────────────────────────────────────┐     │
│  │  ✅ MSFT crossed $400.00 - Jan 20, 2024       │     │
│  └────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

## Código de Ejemplo

```typescript
import { test, expect } from '@playwright/test';
import { ensureAuthenticated, waitForPageReady } from '../_shared';

test.describe('Journey: Create Price Alert', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/alerts');
    await waitForPageReady(page);
  });

  test('should display create alert button', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create.*alert|new.*alert/i });
    await expect(createButton).toBeVisible();
  });

  test('should open alert creation form', async ({ page }) => {
    await page.getByRole('button', { name: /create.*alert/i }).click();

    // Form should appear
    const symbolInput = page.getByLabel(/symbol/i);
    const conditionSelector = page.locator('select, [role="combobox"]');

    await expect(symbolInput).toBeVisible();
  });

  test('should create price alert', async ({ page }) => {
    await page.getByRole('button', { name: /create.*alert/i }).click();

    // Fill symbol
    await page.getByLabel(/symbol/i).fill('AAPL');

    // Select condition
    const conditionSelect = page.getByLabel(/condition/i);
    if (await conditionSelect.isVisible()) {
      await conditionSelect.selectOption('above');
    }

    // Set threshold
    await page.getByLabel(/price|value|threshold/i).fill('200');

    // Submit
    await page.getByRole('button', { name: /create|save/i }).click();

    // Verify alert created
    await expect(page.locator('text=/aapl/i')).toBeVisible();
  });
});
```
