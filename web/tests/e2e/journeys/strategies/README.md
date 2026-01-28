# Strategies User Journeys

## Descripción
Flujos de creación, gestión y compartición de estrategias de trading.

## Páginas Cubiertas
- `/dashboard/strategies` - Lista y gestión de estrategias

## Componentes Clave
- `StrategiesPage` - Página principal de estrategias
- `StrategyList` - Lista de estrategias del usuario
- `StrategyCard` - Tarjeta de vista previa de estrategia
- `StrategyEditor` - Editor de código (futuro: Monaco)
- `StrategyTemplates` - Plantillas pre-definidas
- `PublicStrategiesBrowser` - Navegador de estrategias públicas

## User Journeys

### 1. Browse Public Strategies (browse-public.spec.ts)
**Descripción**: Usuario explora estrategias compartidas por la comunidad.

**Precondiciones**:
- Usuario autenticado

**Flujo**:
1. Navegar a `/dashboard/strategies`
2. Ver sección de estrategias públicas
3. Filtrar por categoría
4. Buscar por nombre
5. Ver detalles de estrategia
6. Opcionalmente copiar estrategia

**Assertions**:
- Lista de estrategias públicas visible
- Filtros funcionan correctamente
- Búsqueda devuelve resultados relevantes
- Detalles muestran información completa

### 2. Create Strategy (create-strategy.spec.ts)
**Descripción**: Usuario crea una nueva estrategia desde plantilla o desde cero.

**Flujo**:
1. Click en "New Strategy"
2. Seleccionar plantilla o empezar vacío
3. Nombrar la estrategia
4. Agregar descripción
5. Configurar parámetros
6. Guardar estrategia

**Assertions**:
- Selector de plantillas disponible
- Plantillas pre-llenan configuración
- Validación de nombre único
- Estrategia aparece en lista

### 3. Configure Strategy (configure-strategy.spec.ts)
**Descripción**: Usuario configura parámetros de una estrategia.

**Flujo**:
1. Seleccionar estrategia existente
2. Editar parámetros dinámicos
3. Ver preview de cambios
4. Guardar configuración

**Assertions**:
- Formulario dinámico se genera correctamente
- Parámetros se validan
- Cambios se persisten

### 4. Share Strategy (share-strategy.spec.ts)
**Descripción**: Usuario comparte su estrategia con la comunidad.

**Flujo**:
1. Seleccionar estrategia personal
2. Click en "Share"
3. Configurar visibilidad
4. Agregar tags
5. Publicar

**Assertions**:
- Opción de compartir visible
- Configuración de visibilidad funciona
- Estrategia aparece en públicas después de compartir

## Plantillas de Estrategia Disponibles

| Plantilla | Descripción |
|-----------|-------------|
| Blank | Empezar desde cero |
| Momentum | Ranking por retornos recientes |
| Mean Reversion | Comprar activos sobrevendidos |
| Equal Weight | Distribución equitativa |
| Risk Parity | Balanceo por volatilidad |
| Multi-Factor | Combinación de factores |
| 60/40 Buy-Hold | Portafolio clásico 60/40 |

## Estructura de la Página de Estrategias

```
┌─────────────────────────────────────────────────────────┐
│  My Strategies                    [+ New Strategy]      │
├─────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐     │
│  │  🚀 My Momentum Strategy           ★★★★☆       │     │
│  │  Ranks top 5 assets by 90-day momentum         │     │
│  │  [Edit] [Backtest] [Share]         Private     │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  📊 Conservative Portfolio         ★★★☆☆       │     │
│  │  60/40 stock/bond allocation                   │     │
│  │  [Edit] [Backtest] [Share]         Public      │     │
│  └────────────────────────────────────────────────┘     │
├─────────────────────────────────────────────────────────┤
│  Public Strategies                                       │
│  ┌────────────────────────────────────────────────┐     │
│  │  🏆 Top Performer by @trader123    ★★★★★       │     │
│  │  Multi-factor value strategy                   │     │
│  │  [Copy] [View Details]             245 copies  │     │
│  └────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

## Código de Ejemplo

```typescript
import { test, expect } from '@playwright/test';
import { ensureAuthenticated, waitForPageReady } from '../_shared';

test.describe('Journey: Create Strategy', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/strategies');
    await waitForPageReady(page);
  });

  test('should display new strategy button', async ({ page }) => {
    const newButton = page.getByRole('button', { name: /new.*strategy|create/i });
    await expect(newButton).toBeVisible();
  });

  test('should show template selector on new strategy', async ({ page }) => {
    await page.getByRole('button', { name: /new.*strategy/i }).click();

    // Check for templates
    const templates = page.locator('text=/momentum|mean.*reversion|equal.*weight/i');
    await expect(templates.first()).toBeVisible();
  });

  test('should create strategy from template', async ({ page }) => {
    await page.getByRole('button', { name: /new.*strategy/i }).click();

    // Select momentum template
    await page.locator('text=/momentum/i').first().click();

    // Fill name
    await page.getByLabel(/name/i).fill('Test Strategy');

    // Save
    await page.getByRole('button', { name: /create|save/i }).click();

    // Verify created
    await expect(page.locator('text=/test strategy/i')).toBeVisible();
  });
});
```
