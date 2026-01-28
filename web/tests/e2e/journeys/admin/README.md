# Admin User Journeys

## Descripción
Flujos de administración de usuarios e invitaciones (solo para admins).

## Páginas Cubiertas
- `/admin` - Panel de administración
- `/admin/invites` - Gestión de invitaciones

## Componentes Clave
- `AdminLayout` - Layout exclusivo para admins
- `UserManagement` - Gestión de usuarios
- `InviteManagement` - Gestión de invitaciones

## User Journeys

### 1. User Management (user-management.spec.ts)
**Descripción**: Admin gestiona usuarios del sistema.

**Precondiciones**:
- Usuario autenticado con rol admin

**Flujo**:
1. Navegar a `/admin`
2. Ver lista de usuarios
3. Filtrar por estado (Active, Pending, Suspended)
4. Buscar usuario específico
5. Ver detalles de usuario
6. Cambiar rol de usuario
7. Aprobar/Suspender usuario

**Assertions**:
- Solo admins pueden acceder
- Lista de usuarios visible
- Filtros funcionan
- Acciones de gestión disponibles

**Edge Cases**:
- Usuario no-admin intenta acceder → Redirect a dashboard
- Suspender último admin → Prevenir acción

### 2. Invite Management (invite-management.spec.ts)
**Descripción**: Admin crea y gestiona invitaciones.

**Flujo**:
1. Navegar a `/admin/invites`
2. Ver invitaciones existentes
3. Crear nueva invitación
4. Copiar link de invitación
5. Revocar invitación
6. Ver invitaciones usadas

**Assertions**:
- Lista de invitaciones visible
- Crear invitación genera código único
- Botón de copiar funciona
- Revocar cambia estado

### 3. Approve User (approve-user.spec.ts)
**Descripción**: Admin aprueba usuario pendiente.

**Flujo**:
1. Ver usuarios pendientes
2. Revisar detalles del usuario
3. Aprobar usuario
4. Usuario recibe notificación

**Assertions**:
- Usuarios pendientes listados
- Botón de aprobar visible
- Estado cambia después de aprobar

## Roles de Usuario

| Rol | Permisos |
|-----|----------|
| user | Acceso estándar a dashboard y features |
| admin | user + acceso a panel de administración |
| superadmin | admin + gestión de otros admins |

## Estados de Usuario

| Estado | Descripción |
|--------|-------------|
| active | Usuario activo con acceso completo |
| pending | Usuario registrado esperando aprobación |
| suspended | Usuario suspendido sin acceso |

## Estructura del Panel Admin

```
┌─────────────────────────────────────────────────────────┐
│  Admin Panel                                             │
├─────────────────────────────────────────────────────────┤
│  Overview                                                │
│  ┌──────────────┬──────────────┬──────────────┐        │
│  │ Total Users  │ Pending      │ Active Today │        │
│  │     156      │      8       │      42      │        │
│  └──────────────┴──────────────┴──────────────┘        │
├─────────────────────────────────────────────────────────┤
│  Users                            [Search...] [Filter▼] │
│  ┌────────────────────────────────────────────────┐     │
│  │ john@email.com   │ Active  │ user  │ [Actions▼]│     │
│  │ jane@email.com   │ Pending │ user  │ [Approve] │     │
│  │ admin@email.com  │ Active  │ admin │ [Actions▼]│     │
│  └────────────────────────────────────────────────┘     │
├─────────────────────────────────────────────────────────┤
│  Invitations                       [+ Create Invite]    │
│  ┌────────────────────────────────────────────────┐     │
│  │ CODE123  │ Active   │ Created Jan 15 │ [Copy]  │     │
│  │ CODE456  │ Used     │ Used by john@  │         │     │
│  │ CODE789  │ Expired  │ Jan 1          │ [Delete]│     │
│  └────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

## Código de Ejemplo

```typescript
import { test, expect } from '@playwright/test';
import { ensureAdminAuthenticated, waitForPageReady } from '../_shared';

test.describe('Journey: User Management', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAdminAuthenticated(page);
    await page.goto('/admin');
    await waitForPageReady(page);
  });

  test('should display admin panel', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /admin/i });
    await expect(heading).toBeVisible();
  });

  test('should display users list', async ({ page }) => {
    const usersList = page.locator('table, .users-list');
    await expect(usersList).toBeVisible();
  });

  test('should filter users by status', async ({ page }) => {
    // Find filter dropdown
    const filterSelect = page.getByLabel(/status|filter/i);
    if (await filterSelect.isVisible()) {
      await filterSelect.selectOption('pending');

      // Verify filtered results
      await page.waitForTimeout(500);
      const pendingUsers = page.locator('text=/pending/i');
      await expect(pendingUsers.first()).toBeVisible();
    }
  });

  test('should approve pending user', async ({ page }) => {
    // Find approve button
    const approveButton = page.getByRole('button', { name: /approve/i });
    if (await approveButton.first().isVisible()) {
      await approveButton.first().click();

      // Confirm action
      const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Verify success
      await expect(page.locator('text=/approved|success/i')).toBeVisible();
    }
  });
});
```
