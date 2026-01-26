
import { test, expect } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

test.describe('Auditoría de Performance (Lighthouse)', () => {

  test('La Home Page debe cumplir con los estándares de Core Web Vitals', async ({ page, baseURL, browserName }) => {
    // Lighthouse solo funciona en Chromium.
    // Aunque tu config ya lo aísla, este skip es una buena práctica de seguridad.
    test.skip(browserName !== 'chromium', 'Lighthouse solo soporta Chromium');

    // 1. Navegar a la página
    // Usamos '/' para que tome el baseURL definido en tu config (http://localhost:4321)
    await page.goto('/');

    // 2. Ejecutar la auditoría
    await playAudit({
      page: page,
      port: 9222, // DEBE coincidir con el puerto en tu playwright.config.ts

      thresholds: {
        performance: 95, // Astro es rápido por defecto, seamos exigentes
        accessibility: 90,
        'best-practices': 90,
        seo: 90,
        pwa: 0, // Ponlo en 0 si no estás haciendo una PWA todavía
      },

      reports: {
        formats: {
          html: true, // Genera un reporte visual bonito
          json: true,
        },
        // Guardará los reportes en esta carpeta para que puedas revisarlos luego
        name: 'lighthouse-report-home',
        directory: 'test-results/lighthouse',
      },
    });
  });

  // Puedes agregar más tests aquí para otras rutas críticas
  // test('Login Page Performance', async ({ page }) => { ... })
});
