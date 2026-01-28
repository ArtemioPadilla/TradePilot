# Backtest User Journeys

## Descripción
Flujos de backtesting de estrategias de inversión con TradePilot.

## Páginas Cubiertas
- `/dashboard/backtest` - Interfaz principal de backtesting

## Componentes Clave
- `StrategySelector` - Selector de estrategias pre-construidas
- `StrategyConfigForm` - Formularios de configuración por tipo de estrategia
- `BacktestConfigForm` - Configuración general del backtest
- `BacktestProgress` - Indicador de progreso durante ejecución
- `BacktestResults` - Visualización de resultados
- `BacktestHistory` - Historial de backtests anteriores

## User Journeys

### 1. Run Backtest (run-backtest.spec.ts)
**Descripción**: Usuario ejecuta un backtest completo con una estrategia seleccionada.

**Precondiciones**:
- Usuario autenticado
- Estrategia disponible (pre-construida o custom)

**Flujo**:
1. Navegar a `/dashboard/backtest`
2. Seleccionar categoría de estrategia
3. Seleccionar estrategia específica
4. Configurar parámetros de la estrategia
5. Configurar universo de activos
6. Seleccionar rango de fechas
7. Establecer capital inicial
8. Seleccionar benchmark
9. Click en "Run Backtest"
10. Esperar resultados

**Assertions**:
- Selector de estrategias visible con 6 tipos
- Formulario de configuración se muestra según tipo
- Parámetros se pueden modificar
- Validación de fechas funciona
- Botón Run se habilita cuando válido
- Progress bar aparece durante ejecución
- Resultados se muestran al completar

**Edge Cases**:
- Rango de fechas inválido → Mostrar error de validación
- Capital insuficiente → Mostrar advertencia
- Cancelar backtest → Detener ejecución y mostrar parcial

### 2. Analyze Results (analyze-results.spec.ts)
**Descripción**: Usuario analiza los resultados de un backtest.

**Precondiciones**:
- Backtest completado con resultados

**Flujo**:
1. Ver métricas de rendimiento (CAGR, Sharpe, etc.)
2. Ver gráfica de equity curve
3. Comparar con benchmark
4. Ver drawdown chart
5. Revisar trade log
6. Ver heatmap de retornos mensuales

**Assertions**:
- Métricas muestran valores calculados
- Equity curve tiene línea de estrategia y benchmark
- Drawdown chart muestra períodos negativos
- Trade log muestra operaciones individuales
- Heatmap colorea según rendimiento

### 3. Compare Strategies (compare-strategies.spec.ts)
**Descripción**: Usuario compara múltiples backtests.

**Flujo**:
1. Navegar a historial de backtests
2. Seleccionar múltiples backtests para comparar
3. Ver comparación lado a lado
4. Analizar diferencias en métricas

**Assertions**:
- Lista de historial visible
- Checkboxes de selección funcionan
- Vista de comparación muestra ambos

### 4. Rerun Backtest (rerun-backtest.spec.ts)
**Descripción**: Usuario re-ejecuta un backtest desde el historial.

**Flujo**:
1. Ver historial de backtests
2. Seleccionar backtest anterior
3. Click en "Rerun"
4. Modificar parámetros opcionalmente
5. Ejecutar nuevo backtest

**Assertions**:
- Historial muestra backtests anteriores
- Configuración se carga correctamente
- Re-run ejecuta con mismos parámetros

## Tipos de Estrategias

| Tipo | Parámetros Clave |
|------|------------------|
| Momentum | Lookback period, Top N, Rebalance frequency |
| Mean Reversion | MA period, Deviation threshold |
| Equal Weight | Asset list, Rebalance frequency |
| Risk Parity | Target risk, Lookback period |
| Smart Beta | Factor weights, Rebalance frequency |
| Custom | Definido por usuario |

## Estructura de la Página de Backtest

```
┌─────────────────────────────────────────────────────────┐
│  Backtest Your Strategy                                  │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐    │
│  │  Strategy Selector                               │    │
│  │  [Momentum] [Mean Rev] [Equal] [Risk] [Smart]   │    │
│  │                                                  │    │
│  │  Selected: Momentum Strategy                     │    │
│  │  Description: Ranks assets by recent returns...  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Strategy Parameters                             │    │
│  │  Lookback Period: [──●─────] 90 days            │    │
│  │  Top N Assets:    [5 ▼]                         │    │
│  │  Rebalance:       [Monthly ▼]                   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Backtest Configuration                          │    │
│  │  Universe: [● S&P 500  ○ Custom]                │    │
│  │  Date Range: [2020-01-01] to [2023-12-31]       │    │
│  │  Initial Capital: [$100,000]                    │    │
│  │  Benchmark: [S&P 500 ▼]                         │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │                  [ Run Backtest ]                 │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Código de Ejemplo

```typescript
import { test, expect } from '@playwright/test';
import { ensureAuthenticated, waitForPageReady } from '../_shared';

test.describe('Journey: Run Backtest', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/backtest');
    await waitForPageReady(page);
  });

  test('should display strategy selector with all types', async ({ page }) => {
    // Check strategy type buttons
    const strategyTypes = ['Momentum', 'Mean Reversion', 'Equal Weight', 'Risk Parity', 'Smart Beta'];

    for (const type of strategyTypes) {
      const button = page.getByRole('button', { name: new RegExp(type, 'i') });
      await expect(button).toBeVisible();
    }
  });

  test('should show config form when strategy selected', async ({ page }) => {
    // Select Momentum strategy
    await page.getByRole('button', { name: /momentum/i }).click();

    // Verify config form appears
    await expect(page.locator('text=/lookback.*period/i')).toBeVisible();
    await expect(page.locator('text=/top.*assets/i')).toBeVisible();
    await expect(page.locator('text=/rebalance/i')).toBeVisible();
  });

  test('should configure and run backtest', async ({ page }) => {
    // Select strategy
    await page.getByRole('button', { name: /momentum/i }).click();

    // Configure backtest
    await page.getByLabel(/initial capital/i).fill('100000');

    // Set date range
    const startDate = page.locator('input[type="date"]').first();
    const endDate = page.locator('input[type="date"]').last();
    await startDate.fill('2020-01-01');
    await endDate.fill('2023-12-31');

    // Run backtest
    const runButton = page.getByRole('button', { name: /run backtest/i });
    await expect(runButton).toBeEnabled();
    await runButton.click();

    // Wait for results or progress
    const hasProgress = await page.locator('.progress-bar, [role="progressbar"]').isVisible().catch(() => false);
    const hasResults = await page.locator('text=/results|metrics|cagr/i').isVisible().catch(() => false);

    expect(hasProgress || hasResults).toBe(true);
  });
});
```
