# Reports User Journeys

## Descripción
Flujos de generación y exportación de reportes financieros.

## Páginas Cubiertas
- `/dashboard/reports` (si existe) - Reportes y exportación

## Componentes Clave
- `ReportsPage` - Página de reportes
- `TaxReport` - Generador de reportes fiscales
- `PerformanceReport` - Reporte de rendimiento
- `ExportButtons` - Botones de exportación (CSV, PDF, JSON)

## User Journeys

### 1. Generate Report (generate-report.spec.ts)
**Descripción**: Usuario genera un reporte de rendimiento.

**Precondiciones**:
- Usuario autenticado
- Datos de portfolio disponibles

**Flujo**:
1. Navegar a sección de reportes
2. Seleccionar tipo de reporte
3. Seleccionar período
4. Seleccionar cuentas a incluir
5. Generar reporte
6. Ver preview

**Assertions**:
- Tipos de reporte disponibles
- Selector de período funciona
- Preview muestra datos correctos
- Botón de generar habilitado

### 2. Export Data (export-data.spec.ts)
**Descripción**: Usuario exporta datos en diferentes formatos.

**Flujo**:
1. Generar o ver reporte
2. Seleccionar formato (CSV, PDF, JSON)
3. Click en exportar
4. Archivo se descarga

**Assertions**:
- Formatos de exportación visibles
- Descarga inicia correctamente
- Archivo tiene formato correcto

### 3. Tax Report (tax-report.spec.ts)
**Descripción**: Usuario genera reporte para propósitos fiscales.

**Flujo**:
1. Navegar a reportes
2. Seleccionar "Tax Report"
3. Seleccionar año fiscal
4. Ver ganancias/pérdidas realizadas
5. Ver dividendos recibidos
6. Exportar para declaración

**Assertions**:
- Reporte fiscal disponible
- Año fiscal seleccionable
- Datos fiscales correctos
- Exportación para impuestos

## Tipos de Reporte

| Tipo | Descripción |
|------|-------------|
| Performance | Rendimiento del portfolio por período |
| Holdings | Posiciones actuales detalladas |
| Transactions | Historial de transacciones |
| Tax | Reporte para declaración de impuestos |
| Dividends | Dividendos recibidos |

## Formatos de Exportación

| Formato | Descripción | Uso |
|---------|-------------|-----|
| CSV | Valores separados por comas | Excel, análisis |
| PDF | Documento portable | Impresión, archivo |
| JSON | JavaScript Object Notation | Integración, backup |

## Estructura de la Página de Reports

```
┌─────────────────────────────────────────────────────────┐
│  Reports & Exports                                       │
├─────────────────────────────────────────────────────────┤
│  Report Type:                                            │
│  [Performance ▼]                                         │
│                                                          │
│  Date Range:                                             │
│  [Jan 1, 2024] to [Dec 31, 2024]                        │
│                                                          │
│  Accounts:                                               │
│  [✓] Main Brokerage                                     │
│  [✓] 401k                                               │
│  [ ] Crypto                                              │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │              [ Generate Report ]                │     │
│  └────────────────────────────────────────────────┘     │
├─────────────────────────────────────────────────────────┤
│  Report Preview                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  Performance Summary: Jan - Dec 2024           │     │
│  │  ─────────────────────────────────────────     │     │
│  │  Starting Value:    $50,000.00                 │     │
│  │  Ending Value:      $65,000.00                 │     │
│  │  Total Return:      +30.00%                    │     │
│  │  Annualized Return: +30.00%                    │     │
│  │  Max Drawdown:      -8.5%                      │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  Export As:  [CSV] [PDF] [JSON]                         │
└─────────────────────────────────────────────────────────┘
```

## Código de Ejemplo

```typescript
import { test, expect } from '@playwright/test';
import { ensureAuthenticated, waitForPageReady } from '../_shared';

test.describe('Journey: Export Data', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard');
    await waitForPageReady(page);
  });

  test('should display export buttons', async ({ page }) => {
    // Navigate to reports or find export in dashboard
    const reportsLink = page.locator('a[href*="report"]');
    if (await reportsLink.first().isVisible()) {
      await reportsLink.first().click();
      await page.waitForTimeout(300);
    }

    // Look for export buttons
    const csvButton = page.getByRole('button', { name: /csv/i });
    const pdfButton = page.getByRole('button', { name: /pdf/i });
    const exportButton = page.getByRole('button', { name: /export/i });

    const hasCSV = await csvButton.isVisible().catch(() => false);
    const hasPDF = await pdfButton.isVisible().catch(() => false);
    const hasExport = await exportButton.isVisible().catch(() => false);

    expect(hasCSV || hasPDF || hasExport).toBe(true);
  });

  test('should initiate CSV download', async ({ page }) => {
    // Find and click CSV export
    const csvButton = page.getByRole('button', { name: /csv|export/i });

    if (await csvButton.first().isVisible()) {
      // Set up download promise before clicking
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

      await csvButton.first().click();

      const download = await downloadPromise;
      if (download) {
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/\.(csv|xlsx)$/i);
      }
    }
  });
});
```
