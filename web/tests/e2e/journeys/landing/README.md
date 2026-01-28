# Landing Page User Journeys

## Descripción
Flujos de usuarios visitantes en la página de inicio pública.

## Páginas Cubiertas
- `/` - Landing page principal
- `/home` - Página de inicio (post-login redirect)

## Componentes Clave
- `Hero` - Sección principal con CTA
- `Features` - Lista de características
- `Pricing` - Planes de precios (si aplica)
- `Testimonials` - Testimonios
- `Footer` - Pie de página con links

## User Journeys

### 1. Visitor to Signup (visitor-to-signup.spec.ts)
**Descripción**: Visitante nuevo descubre la app y se registra.

**Precondiciones**:
- Usuario no autenticado
- Acceso a internet

**Flujo**:
1. Navegar a `/`
2. Ver hero section con propuesta de valor
3. Explorar características
4. Click en CTA "Get Started" o "Sign Up"
5. Ser redirigido a registro

**Assertions**:
- Hero section visible con texto principal
- Lista de features visible
- CTA button funcional
- Redirect a `/auth/register`

### 2. Visitor to Login (visitor-to-login.spec.ts)
**Descripción**: Usuario existente accede a login desde landing.

**Flujo**:
1. Navegar a `/`
2. Click en "Log In" en header
3. Ser redirigido a login

**Assertions**:
- Link de login visible en header
- Redirect a `/auth/login`

### 3. Explore Features (explore-features.spec.ts)
**Descripción**: Visitante explora las características de la app.

**Flujo**:
1. Ver landing page
2. Scroll a sección de features
3. Ver cada feature con descripción
4. Click en "Learn More" si disponible

**Assertions**:
- Features section visible
- Al menos 3 features listados
- Descripciones informativas

## Estructura de la Landing Page

```
┌─────────────────────────────────────────────────────────┐
│  [Logo] TradePilot              [Features] [Login]      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│         Trade Smarter, Not Harder                       │
│                                                          │
│    Backtest your strategies, manage your portfolio,     │
│    and execute trades - all in one place.               │
│                                                          │
│              [ Get Started Free ]                        │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Features                                                │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │ Backtest   │  │ Portfolio  │  │ Trading    │        │
│  │ Test your  │  │ Track all  │  │ Execute    │        │
│  │ strategies │  │ accounts   │  │ with Alpaca│        │
│  └────────────┘  └────────────┘  └────────────┘        │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  © 2024 TradePilot | Privacy | Terms                    │
└─────────────────────────────────────────────────────────┘
```

## Código de Ejemplo

```typescript
import { test, expect } from '@playwright/test';
import { waitForPageReady } from '../_shared';

test.describe('Journey: Visitor to Signup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);
  });

  test('should display hero section', async ({ page }) => {
    const heroHeading = page.getByRole('heading', { level: 1 });
    await expect(heroHeading).toBeVisible();
  });

  test('should display primary CTA button', async ({ page }) => {
    const ctaButton = page.getByRole('link', { name: /get started|sign up|try free/i });
    await expect(ctaButton).toBeVisible();
  });

  test('should navigate to signup on CTA click', async ({ page }) => {
    const ctaButton = page.getByRole('link', { name: /get started|sign up/i });
    await ctaButton.click();

    await expect(page).toHaveURL(/register|signup/);
  });

  test('should display feature cards', async ({ page }) => {
    const features = page.locator('.feature-card, [data-testid="feature"]');
    await expect(features.first()).toBeVisible();
  });

  test('should navigate to login from header', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /log in|sign in/i });
    await loginLink.click();

    await expect(page).toHaveURL(/login/);
  });
});
```
