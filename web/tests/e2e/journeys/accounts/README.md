# Accounts User Journeys

## Descripción
Flujos de gestión de cuentas y posiciones de inversión.

## Páginas Cubiertas
- `/dashboard/accounts` - Lista de cuentas
- `/dashboard/account?id=` - Detalle de cuenta específica

## Componentes Clave
- `AccountsList` - Lista de cuentas del usuario
- `AccountDetail` - Vista detallada de cuenta
- `AddAccountModal` - Modal para crear nueva cuenta
- `AddPositionForm` - Formulario para agregar posiciones
- `HoldingsTable` - Tabla de posiciones con filtros y ordenamiento
- `CSVImporter` - Componente de importación CSV

## User Journeys

### 1. Create Account (create-account.spec.ts)
**Descripción**: Usuario crea una nueva cuenta de inversión.

**Precondiciones**:
- Usuario autenticado

**Flujo**:
1. Navegar a `/dashboard/accounts`
2. Click en "Add Account"
3. Ingresar nombre de cuenta
4. Seleccionar tipo (Brokerage, 401k, IRA, Crypto, Other)
5. Seleccionar moneda
6. Opcionalmente agregar institución
7. Opcionalmente agregar notas
8. Establecer balance inicial de efectivo
9. Click en "Create Account"

**Assertions**:
- Modal de creación aparece
- Campos requeridos se validan
- Tipos de cuenta disponibles
- Monedas soportadas visibles
- Cuenta aparece en lista después de crear

**Edge Cases**:
- Nombre duplicado → Mostrar advertencia
- Balance negativo → Validación de entrada

### 2. Add Position (add-position.spec.ts)
**Descripción**: Usuario agrega una posición manual a una cuenta.

**Precondiciones**:
- Usuario autenticado
- Al menos una cuenta existente

**Flujo**:
1. Navegar a detalle de cuenta
2. Click en "Add Position"
3. Ingresar símbolo (AAPL, MSFT, etc.)
4. Ingresar cantidad
5. Ingresar costo base por acción
6. Seleccionar fecha de compra
7. Seleccionar tipo de activo
8. Click en "Add Position"

**Assertions**:
- Formulario de posición aparece
- Símbolo se valida (formato válido)
- Cantidad debe ser positiva
- Posición aparece en tabla de holdings

### 3. CSV Import (csv-import.spec.ts)
**Descripción**: Usuario importa posiciones desde archivo CSV.

**Flujo**:
1. Navegar a cuenta
2. Click en "Import CSV"
3. Seleccionar archivo CSV
4. Ver preview de datos
5. Mapear columnas si necesario
6. Verificar datos a importar
7. Click en "Import"
8. Ver resumen de importación

**Assertions**:
- Uploader de archivo funciona
- Preview muestra datos correctamente
- Errores de parsing se muestran
- Importación exitosa muestra count

### 4. Edit Position (edit-position.spec.ts)
**Descripción**: Usuario edita una posición existente.

**Flujo**:
1. Ver tabla de holdings
2. Click en posición específica
3. Click en "Edit"
4. Modificar cantidad o costo base
5. Guardar cambios

**Assertions**:
- Modal de edición aparece
- Valores actuales pre-llenados
- Cambios se reflejan en tabla

### 5. Account Management (account-management.spec.ts)
**Descripción**: Usuario gestiona configuración de cuenta.

**Flujo**:
1. Ver detalle de cuenta
2. Editar nombre/notas
3. Cambiar configuración
4. Opcionalmente eliminar cuenta

**Assertions**:
- Configuración editable
- Confirmación requerida para eliminar
- Cuenta desaparece de lista al eliminar

## Tipos de Cuenta

| Tipo | Descripción |
|------|-------------|
| Brokerage | Cuenta de corretaje estándar |
| 401k | Plan de retiro 401(k) |
| IRA | Cuenta Individual de Retiro |
| Roth IRA | IRA con ventajas fiscales |
| Crypto | Cuenta de criptomonedas |
| Other | Otro tipo de cuenta |

## Estructura de la Página de Cuentas

```
┌─────────────────────────────────────────────────────────┐
│  My Accounts                        [+ Add Account]     │
├─────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐     │
│  │  📊 Main Brokerage              $45,230.50     │     │
│  │  Type: Brokerage | 12 positions | +5.2%       │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  💼 401k Retirement             $125,800.00    │     │
│  │  Type: 401k | 5 positions | +12.3%            │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  🪙 Crypto Portfolio            $8,500.00      │     │
│  │  Type: Crypto | 3 positions | -2.1%           │     │
│  └────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

## Código de Ejemplo

```typescript
import { test, expect } from '@playwright/test';
import { ensureAuthenticated, waitForPageReady } from '../_shared';

test.describe('Journey: Create Account', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/dashboard/accounts');
    await waitForPageReady(page);
  });

  test('should display add account button', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add.*account/i });
    await expect(addButton).toBeVisible();
  });

  test('should open add account modal', async ({ page }) => {
    await page.getByRole('button', { name: /add.*account/i }).click();

    // Modal should appear
    const modal = page.locator('[role="dialog"], .modal');
    await expect(modal).toBeVisible();

    // Should have account name field
    await expect(page.getByLabel(/account.*name|name/i)).toBeVisible();
  });

  test('should create new account', async ({ page }) => {
    await page.getByRole('button', { name: /add.*account/i }).click();

    // Fill form
    await page.getByLabel(/account.*name|name/i).fill('Test Account');

    // Select type if available
    const typeSelector = page.locator('select, [role="combobox"]').first();
    if (await typeSelector.isVisible()) {
      await typeSelector.selectOption({ index: 1 });
    }

    // Submit
    const createButton = page.getByRole('button', { name: /create|save|add/i });
    await createButton.click();

    // Verify account appears or success message
    await page.waitForTimeout(1000);
    const hasAccount = await page.locator('text=/test account/i').isVisible().catch(() => false);
    const hasSuccess = await page.locator('text=/created|success/i').isVisible().catch(() => false);

    expect(hasAccount || hasSuccess).toBe(true);
  });
});
```
