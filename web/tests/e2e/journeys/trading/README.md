# Trading User Journeys

## Descripción
Flujos de trading y gestión de órdenes con integración Alpaca.

## Páginas Cubiertas
- `/dashboard/trading` - Interfaz principal de trading

## Componentes Clave
- `AlpacaConnectionForm` - Formulario de conexión de broker
- `OrderForm` - Formulario de creación de órdenes
- `OrderConfirmationModal` - Modal de confirmación
- `OrderHistoryTable` - Historial de órdenes
- `PriceDisplay` - Display de precios en tiempo real

## User Journeys

### 1. Connect Broker (connect-broker.spec.ts)
**Descripción**: Usuario conecta su cuenta de Alpaca para habilitar trading.

**Precondiciones**:
- Usuario autenticado
- Cuenta de Alpaca (paper o live) creada
- API keys disponibles

**Flujo**:
1. Navegar a `/dashboard/trading`
2. Ver formulario de conexión de Alpaca
3. Seleccionar entorno (Paper Trading / Live Trading)
4. Ingresar API Key
5. Ingresar API Secret
6. Click en "Test Connection"
7. Verificar conexión exitosa
8. Click en "Save & Connect"

**Assertions**:
- Formulario visible con campos requeridos
- Botón Paper Trading seleccionable
- Botón Live Trading seleccionable
- Campo API Key acepta texto
- Campo API Secret oculto por defecto
- Toggle de visibilidad de secret funciona
- Botón "Test Connection" deshabilitado hasta completar campos
- Mensaje de éxito/error después de test

**Edge Cases**:
- API Key inválido → Mostrar error de conexión
- API Secret inválido → Mostrar error de autenticación
- Conexión exitosa → Habilitar botón "Save & Connect"

### 2. Place Order (place-order.spec.ts)
**Descripción**: Usuario crea una orden de compra/venta.

**Precondiciones**:
- Broker conectado
- Buying power disponible

**Flujo**:
1. Ver formulario de orden
2. Buscar/seleccionar símbolo
3. Seleccionar lado (Buy/Sell)
4. Seleccionar tipo de orden (Market/Limit/Stop)
5. Ingresar cantidad
6. (Si Limit) Ingresar precio límite
7. Ver estimación de costo
8. Click en "Review Order"

**Assertions**:
- Formulario acepta símbolo válido
- Selector de lado funciona
- Selector de tipo de orden funciona
- Cantidad se valida como número positivo
- Estimación se calcula correctamente
- Botón Review habilitado cuando válido

### 3. Order Confirmation (order-confirmation.spec.ts)
**Descripción**: Usuario confirma y ejecuta una orden.

**Flujo**:
1. Completar formulario de orden
2. Click "Review Order"
3. Ver modal de confirmación
4. Verificar detalles de la orden
5. Ver advertencias si aplican
6. Click "Confirm Order"
7. Ver estado de ejecución

**Assertions**:
- Modal muestra resumen correcto
- Advertencias visibles para órdenes riesgosas
- Botón de confirmación requiere acción explícita
- Estado de orden actualiza después de submit

### 4. Order History (order-history.spec.ts)
**Descripción**: Usuario revisa historial de órdenes.

**Flujo**:
1. Navegar a sección de historial
2. Ver lista de órdenes pasadas
3. Filtrar por estado (Filled, Pending, Cancelled)
4. Filtrar por fecha
5. Ver detalles de orden específica

**Assertions**:
- Tabla de órdenes visible
- Filtros funcionan correctamente
- Detalles muestran información completa

## Estructura del Formulario de Conexión

```
┌─────────────────────────────────────────────────┐
│  Connect Your Brokerage                         │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  Alpaca Trading                         │   │
│  │  Connect your Alpaca account...         │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Trading Environment:                           │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ Paper Trading│  │ Live Trading │            │
│  │ (selected)   │  │              │            │
│  └──────────────┘  └──────────────┘            │
│                                                 │
│  API Key:                                       │
│  ┌──────────────────────────────────┐          │
│  │ Enter your Alpaca API Key        │          │
│  └──────────────────────────────────┘          │
│                                                 │
│  API Secret:                                    │
│  ┌──────────────────────────────────┐  ┌───┐  │
│  │ ••••••••••••••••••              │  │ 👁 │  │
│  └──────────────────────────────────┘  └───┘  │
│                                                 │
│  ┌─────────────────┐  ┌─────────────────┐      │
│  │ Test Connection │  │ Save & Connect  │      │
│  │   (disabled)    │  │   (disabled)    │      │
│  └─────────────────┘  └─────────────────┘      │
│                                                 │
│  Get your API keys from Alpaca Dashboard        │
│  🔒 Never share your API secret...             │
└─────────────────────────────────────────────────┘
```

## Código de Ejemplo

```typescript
import { test, expect } from '@playwright/test';
import { ensureAuthenticated, waitForPageReady } from '../_shared';

test.describe('Journey: Connect Broker', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/trading');
    await waitForPageReady(page);
  });

  test('should display connection form when not connected', async ({ page }) => {
    // Check for connection form
    const connectionForm = page.locator('[data-testid="alpaca-connection-form"], text=/connect.*brokerage/i');
    await expect(connectionForm.first()).toBeVisible();

    // Check environment selector
    await expect(page.getByRole('button', { name: /paper trading/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /live trading/i })).toBeVisible();

    // Check API inputs
    await expect(page.getByLabel(/api key/i)).toBeVisible();
    await expect(page.getByLabel(/api secret/i)).toBeVisible();
  });

  test('should select paper trading environment', async ({ page }) => {
    const paperButton = page.getByRole('button', { name: /paper trading/i });
    await paperButton.click();

    // Verify selection
    await expect(paperButton).toHaveClass(/selected|active/);
  });

  test('should toggle API secret visibility', async ({ page }) => {
    const secretInput = page.getByLabel(/api secret/i);
    const toggleButton = page.getByRole('button', { name: /show secret/i });

    // Initial: hidden
    await expect(secretInput).toHaveAttribute('type', 'password');

    // Click toggle
    await toggleButton.click();

    // Should be visible
    await expect(secretInput).toHaveAttribute('type', 'text');
  });

  test('should enable test connection when fields are filled', async ({ page }) => {
    // Fill API Key
    await page.getByLabel(/api key/i).fill('PKTEST123456789');

    // Fill API Secret
    await page.getByLabel(/api secret/i).fill('secretkey123456');

    // Test Connection button should be enabled
    const testButton = page.getByRole('button', { name: /test connection/i });
    await expect(testButton).toBeEnabled();
  });
});
```
