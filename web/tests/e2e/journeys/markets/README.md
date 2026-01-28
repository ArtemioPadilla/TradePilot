# Markets User Journeys

## Descripción
Flujos de exploración de mercados y gestión de watchlist.

## Páginas Cubiertas
- `/dashboard/markets` - Exploración de mercados

## Componentes Clave
- `MarketsPage` - Página principal de mercados
- `MarketOverview` - Vista general del mercado
- `MarketIndices` - Índices principales
- `SectorHeatmap` - Mapa de calor por sector
- `WatchlistManager` - Gestión de watchlist
- `StockSearch` - Búsqueda de acciones

## User Journeys

### 1. Browse Markets (browse-markets.spec.ts)
**Descripción**: Usuario explora el estado actual del mercado.

**Precondiciones**:
- Usuario autenticado

**Flujo**:
1. Navegar a `/dashboard/markets`
2. Ver índices principales (S&P 500, NASDAQ, DOW)
3. Ver mapa de calor por sector
4. Filtrar por sector
5. Ver gainers/losers del día

**Assertions**:
- Índices muestran valores actuales
- Heatmap muestra colores según rendimiento
- Filtros cambian visualización
- Gainers/losers ordenados correctamente

### 2. Watchlist Management (watchlist-management.spec.ts)
**Descripción**: Usuario gestiona su watchlist personal.

**Flujo**:
1. Ver watchlist actual
2. Buscar nuevo símbolo
3. Agregar a watchlist
4. Reordenar items
5. Eliminar de watchlist

**Assertions**:
- Watchlist muestra símbolos con precios
- Búsqueda devuelve resultados
- Agregar actualiza lista
- Eliminar requiere confirmación

### 3. Stock Analysis (stock-analysis.spec.ts)
**Descripción**: Usuario analiza un activo específico.

**Flujo**:
1. Buscar símbolo
2. Ver precio actual y cambio
3. Ver gráfica de precio
4. Ver métricas fundamentales
5. Agregar a watchlist

**Assertions**:
- Datos del símbolo visibles
- Gráfica interactiva
- Métricas formateadas correctamente

## Índices Principales

| Índice | Símbolo |
|--------|---------|
| S&P 500 | SPY |
| NASDAQ | QQQ |
| Dow Jones | DIA |
| Russell 2000 | IWM |
| VIX | VIX |

## Sectores del Mercado

| Sector | ETF Representativo |
|--------|-------------------|
| Technology | XLK |
| Healthcare | XLV |
| Financials | XLF |
| Energy | XLE |
| Consumer Discretionary | XLY |
| Industrials | XLI |
| Materials | XLB |
| Utilities | XLU |
| Real Estate | XLRE |
| Communication Services | XLC |
| Consumer Staples | XLP |

## Estructura de la Página de Markets

```
┌─────────────────────────────────────────────────────────┐
│  Markets Overview                                        │
├─────────────────────────────────────────────────────────┤
│  Major Indices                                           │
│  ┌──────────────┬──────────────┬──────────────┐        │
│  │ S&P 500      │ NASDAQ       │ DOW          │        │
│  │ 4,783.35     │ 15,095.14    │ 37,545.33    │        │
│  │ +0.45%  ▲    │ +0.78%  ▲    │ +0.23%  ▲    │        │
│  └──────────────┴──────────────┴──────────────┘        │
├─────────────────────────────────────────────────────────┤
│  Sector Performance                                      │
│  ┌─────┬─────┬─────┬─────┬─────┐                       │
│  │ XLK │ XLV │ XLF │ XLE │ XLY │                       │
│  │+1.2%│-0.3%│+0.8%│+2.1%│+0.5%│                       │
│  └─────┴─────┴─────┴─────┴─────┘                       │
├──────────────────────┬──────────────────────────────────┤
│  Top Gainers         │  Top Losers                      │
│  NVDA  +5.2%         │  ABC   -3.8%                    │
│  AAPL  +2.1%         │  XYZ   -2.5%                    │
│  MSFT  +1.8%         │  DEF   -1.9%                    │
├──────────────────────┴──────────────────────────────────┤
│  My Watchlist                          [+ Add Symbol]   │
│  ┌────────────────────────────────────────────────┐     │
│  │ AAPL   $185.32  +1.23%  ▲     [Chart] [Remove] │     │
│  │ GOOGL  $141.89  -0.45%  ▼     [Chart] [Remove] │     │
│  │ TSLA   $248.50  +2.10%  ▲     [Chart] [Remove] │     │
│  └────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

## Código de Ejemplo

```typescript
import { test, expect } from '@playwright/test';
import { ensureAuthenticated, waitForPageReady } from '../_shared';

test.describe('Journey: Browse Markets', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/markets');
    await waitForPageReady(page);
  });

  test('should display market indices', async ({ page }) => {
    const indices = page.locator('text=/s&p|nasdaq|dow/i');
    await expect(indices.first()).toBeVisible();
  });

  test('should display sector heatmap', async ({ page }) => {
    const heatmap = page.locator('.heatmap, [data-testid="sector-heatmap"]');
    const sectors = page.locator('text=/technology|healthcare|financial/i');

    const hasHeatmap = await heatmap.isVisible().catch(() => false);
    const hasSectors = await sectors.first().isVisible().catch(() => false);

    expect(hasHeatmap || hasSectors).toBe(true);
  });

  test('should search for symbol', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search.*symbol|search.*stock/i);
    await searchInput.fill('AAPL');

    // Wait for results
    await page.waitForTimeout(500);

    // Should show Apple
    const result = page.locator('text=/apple|aapl/i');
    await expect(result.first()).toBeVisible();
  });

  test('should add symbol to watchlist', async ({ page }) => {
    // Search for symbol
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('MSFT');
    await page.waitForTimeout(500);

    // Click add button
    const addButton = page.getByRole('button', { name: /add|watch/i });
    if (await addButton.first().isVisible()) {
      await addButton.first().click();

      // Verify added
      await expect(page.locator('text=/added|watchlist/i')).toBeVisible();
    }
  });
});
```
