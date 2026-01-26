# Authentication User Journeys

## Descripción
Flujos de autenticación y gestión de sesión de usuarios.

## Páginas Cubiertas
- `/auth/login` - Inicio de sesión
- `/auth/register` - Registro de cuenta
- `/auth/forgot-password` - Recuperación de contraseña
- `/auth/invite` - Registro por invitación
- `/auth/pending` - Aprobación pendiente
- `/auth/suspended` - Cuenta suspendida

## User Journeys

### 1. Login Flow (login-flow.spec.ts)
**Descripción**: Usuario existente inicia sesión con email/password.

**Precondiciones**:
- Usuario registrado y activo en Firebase
- Credenciales válidas

**Flujo**:
1. Navegar a `/auth/login`
2. Ingresar email en campo `#email`
3. Ingresar password en campo `#password`
4. Click en botón "Log in"
5. Esperar redirección a `/dashboard`
6. Verificar que el usuario está autenticado

**Assertions**:
- URL contiene `/dashboard`
- Menu de usuario visible
- Sidebar de navegación visible

**Edge Cases**:
- Credenciales inválidas → Mostrar mensaje de error
- Campo email vacío → Validación de formulario
- Campo password vacío → Validación de formulario
- Usuario pendiente → Redirigir a `/auth/pending`
- Usuario suspendido → Redirigir a `/auth/suspended`

### 2. Registration Flow (registration-flow.spec.ts)
**Descripción**: Nuevo usuario se registra con código de invitación.

**Precondiciones**:
- Código de invitación válido
- Email no registrado previamente

**Flujo**:
1. Navegar a `/auth/invite?code=VALID_CODE`
2. Verificar que el código es válido
3. Ingresar datos de registro (nombre, email, password)
4. Click en "Create Account"
5. Verificar confirmación de registro
6. Esperar aprobación de admin

**Assertions**:
- Formulario de registro visible
- Mensaje de confirmación después de registro
- Redirección a `/auth/pending` si requiere aprobación

### 3. Password Recovery (password-recovery.spec.ts)
**Descripción**: Usuario olvidó su contraseña y la recupera.

**Flujo**:
1. Navegar a `/auth/forgot-password`
2. Ingresar email
3. Click en "Send Reset Link"
4. Verificar mensaje de confirmación
5. (Email enviado - no testeable en E2E)

**Assertions**:
- Mensaje de éxito visible
- Link para volver a login visible

### 4. Invite Acceptance (invite-acceptance.spec.ts)
**Descripción**: Usuario acepta invitación y completa registro.

**Flujo**:
1. Navegar a `/auth/invite?code=INVITE_CODE`
2. Sistema valida el código
3. Si válido: mostrar formulario de registro
4. Si inválido: mostrar mensaje de error
5. Completar registro

**Assertions**:
- Código válido → Formulario visible
- Código inválido → Mensaje de error
- Código expirado → Mensaje de expiración

## Datos de Prueba

```typescript
// Usuario de prueba (configurar en .env)
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!

// Códigos de invitación de prueba
VALID_INVITE_CODE=TESTCODE123
EXPIRED_INVITE_CODE=EXPIRED123
INVALID_INVITE_CODE=INVALID123
```

## Código de Ejemplo

```typescript
import { test, expect } from '@playwright/test';
import { waitForPageReady } from '../_shared';

test.describe('Journey: Login Flow', () => {
  test('User logs in with valid credentials', async ({ page }) => {
    // Step 1: Navigate to login
    await page.goto('/auth/login');
    await waitForPageReady(page);

    // Step 2: Fill form
    await page.locator('#email').fill(process.env.TEST_USER_EMAIL!);
    await page.locator('#password').fill(process.env.TEST_USER_PASSWORD!);

    // Step 3: Submit
    await page.getByRole('button', { name: /log in/i }).click();

    // Step 4: Verify redirect
    await page.waitForURL('**/dashboard**', { timeout: 30000 });

    // Step 5: Verify authenticated state
    await expect(page.locator('.user-menu-btn')).toBeVisible();
  });
});
```
