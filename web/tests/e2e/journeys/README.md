# User Journey Tests

Este directorio contiene tests E2E organizados por página/área funcional, documentando y verificando los flujos de usuario completos.

## Estructura

```
journeys/
├── _shared/           # Helpers compartidos
│   ├── auth.helpers.ts
│   ├── navigation.helpers.ts
│   ├── assertions.helpers.ts
│   └── index.ts
├── landing/           # Página de aterrizaje (público)
├── auth/              # Flujos de autenticación
├── dashboard/         # Dashboard principal
├── accounts/          # Gestión de cuentas
├── trading/           # Trading y órdenes
├── markets/           # Datos de mercado
├── strategies/        # Estrategias de trading
├── backtest/          # Backtesting
├── alerts/            # Alertas y notificaciones
├── settings/          # Configuración
├── admin/             # Panel de administración
└── reports/           # Reportes y exportación
```

## Ejecución

```bash
# Ejecutar todos los journey tests
cd web && npx playwright test tests/e2e/journeys/ --project=chromium

# Ejecutar journeys de una página específica
npx playwright test tests/e2e/journeys/auth/ --project=chromium

# Ejecutar con UI interactiva
npx playwright test tests/e2e/journeys/ --ui
```

## Convenciones

### Nomenclatura de Archivos
- `[action]-[subject].spec.ts` - Ejemplo: `create-account.spec.ts`
- Un archivo por flujo principal

### Estructura de Tests
```typescript
import { test, expect } from '@playwright/test';
import { ensureAuthenticated, waitForPageReady } from '../_shared';

test.describe('Journey: [Nombre del Flujo]', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
  });

  test('[descripción del paso]', async ({ page }) => {
    // 1. Navegar
    // 2. Interactuar
    // 3. Verificar
  });
});
```

### Requisitos de Entorno
Variables de entorno necesarias:
- `TEST_USER_EMAIL` - Email del usuario de prueba
- `TEST_USER_PASSWORD` - Password del usuario de prueba
- `TEST_ADMIN_EMAIL` - Email del admin de prueba
- `TEST_ADMIN_PASSWORD` - Password del admin de prueba

## Cobertura de Journeys por Área

| Área | Journeys | Tests |
|------|----------|-------|
| Auth | 4 | Login, Register, Forgot Password, Invite |
| Dashboard | 3 | Portfolio Review, Navigation, Performance |
| Accounts | 4 | Create, Add Position, Import CSV, Manage |
| Trading | 4 | Connect Broker, Place Order, Confirm, History |
| Backtest | 3 | Select Strategy, Configure, Run & Analyze |
| Strategies | 3 | Browse, Create, Share |
| Alerts | 3 | Create Alert, Manage, Preferences |
| Settings | 4 | Profile, Appearance, Security, Connections |
| Admin | 2 | User Management, Invites |
| Markets | 2 | Browse, Watchlist |
| Reports | 2 | Generate, Export |

## Criterios de Éxito

- [ ] Todos los tests pasan en CI
- [ ] Cada área tiene al menos 2 journeys documentados
- [ ] No hay errores de consola durante los tests
- [ ] Tiempo de ejecución < 5 minutos para suite completa
