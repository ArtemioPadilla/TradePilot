# Dashboard User Journeys

## Descripción
Flujos de interacción con el dashboard principal del portfolio.

## Páginas Cubiertas
- `/dashboard` - Dashboard principal con overview
- `/home` - Página de inicio post-login

## Componentes Clave
- `PortfolioSummary` - Resumen de valor total, P&L, cambio diario
- `PerformanceChart` - Gráfica de rendimiento con selectores de período
- `AllocationChart` - Gráfica de distribución de assets
- `HoldingsTable` - Tabla de posiciones actuales
- `RecentActivity` - Actividad reciente (trades, dividendos)
- `WatchlistWidget` - Widget de watchlist

## User Journeys

### 1. Portfolio Overview (portfolio-overview.spec.ts)
**Descripción**: Usuario revisa el estado general de su portfolio.

**Precondiciones**:
- Usuario autenticado
- Al menos una cuenta con posiciones

**Flujo**:
1. Navegar a `/dashboard`
2. Ver métricas principales (Total Value, P&L, Daily Change)
3. Revisar gráfica de rendimiento
4. Cambiar período de la gráfica (1W, 1M, 3M, 1Y, ALL)
5. Ver distribución de assets

**Assertions**:
- Métricas de portfolio visibles
- Gráfica de rendimiento carga correctamente
- Selectores de período funcionan
- Allocation chart muestra distribución

### 2. Holdings Management (holdings-management.spec.ts)
**Descripción**: Usuario revisa y gestiona sus posiciones.

**Flujo**:
1. Ver tabla de holdings en dashboard
2. Click en "View All" para ir a accounts
3. Verificar datos de cada holding (Symbol, Qty, Price, Value, P&L)

**Assertions**:
- Tabla de holdings visible
- Datos formateados correctamente
- Link a accounts funciona

### 3. Watchlist Interaction (watchlist-interaction.spec.ts)
**Descripción**: Usuario interactúa con su watchlist.

**Flujo**:
1. Ver widget de watchlist
2. Click en botón "Edit"
3. Ver precios actuales
4. Identificar movimientos positivos/negativos

**Assertions**:
- Watchlist visible con símbolos
- Precios actualizados
- Colores indican dirección (verde/rojo)

### 4. Performance Analysis (performance-analysis.spec.ts)
**Descripción**: Usuario analiza el rendimiento del portfolio.

**Flujo**:
1. Ver gráfica de performance
2. Cambiar período a 1M
3. Cambiar período a 1Y
4. Verificar que los datos se actualizan

**Assertions**:
- Gráfica renderiza correctamente
- Botones de período cambian el rango
- Valores del eje Y se actualizan

## Elementos del Dashboard

```
┌──────────────────────────────────────────────────────┐
│  Total Value    Cost Basis    Total P&L    Daily    │
│  $69,347.50     $53,800.00    $15,547.50   +1.20%   │
├──────────────────────────────────────────────────────┤
│  Performance Chart                                   │
│  [1W] [1M] [3M] [1Y] [ALL]                          │
│  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~                        │
├────────────────────┬─────────────────────────────────┤
│  Asset Allocation  │  Holdings Table                 │
│  ┌───┐             │  Symbol | Name | Qty | P&L     │
│  │ ◉ │  VTI 36%    │  VTI    | ... | 100 | +26%    │
│  └───┘  MSFT 16%   │  MSFT   | ... | 30  | +35%    │
│         ...        │  ...                            │
├────────────────────┴─────────────────────────────────┤
│  Recent Activity         │  Watchlist                │
│  • Bought 10 AAPL        │  SPY  $478.32 +0.89%     │
│  • Sold 10 TSLA          │  QQQ  $412.56 -0.56%     │
│  • Dividend from VTI     │  BTC  $43,250 +2.98%     │
└──────────────────────────────────────────────────────┘
```

## Código de Ejemplo

```typescript
import { test, expect } from '@playwright/test';
import { ensureAuthenticated, waitForPageReady } from '../_shared';

test.describe('Journey: Portfolio Overview', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard');
    await waitForPageReady(page);
  });

  test('should display portfolio metrics', async ({ page }) => {
    // Check total value
    await expect(page.locator('text=/total.*value/i')).toBeVisible();

    // Check P&L
    await expect(page.locator('text=/p&l|profit.*loss/i')).toBeVisible();

    // Check daily change
    await expect(page.locator('text=/today|daily.*change/i')).toBeVisible();
  });

  test('should change performance chart period', async ({ page }) => {
    // Click 1M button
    await page.getByRole('button', { name: '1M' }).click();
    await page.waitForTimeout(500);

    // Verify chart updated (check for chart container)
    await expect(page.locator('.performance-chart, [data-testid="performance-chart"]')).toBeVisible();
  });
});
```
