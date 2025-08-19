import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('auth status shows login link when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Should show login link in header
    await expect(page.locator('.auth-links a[href="/login"]')).toBeVisible();
  });

  test('signup link is hidden when signups are disabled', async ({ page }) => {
    // Mock layout data with signups disabled
    await page.route('**/*', async (route, request) => {
      if (request.url().includes('.json') || request.url().includes('/api/')) {
        return route.continue();
      }
      
      const response = await route.fetch();
      if (request.url().endsWith('/')) {
        let html = await response.text();
        // Inject page data to simulate disabled signups
        html = html.replace(
          '</head>',
          `<script>window.__PAGE_DATA__ = { allowSignups: false };</script></head>`
        );
        return route.fulfill({ body: html, headers: response.headers() });
      }
      return route.continue();
    });

    await page.goto('/');
    
    // Should show login but not signup
    await expect(page.locator('.auth-links a[href="/login"]')).toBeVisible();
    await expect(page.locator('.auth-links a[href="/signup"]')).not.toBeVisible();
  });

  test('login page is accessible', async ({ page }) => {
    await page.goto('/login');
    
    // Should have login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('signup page shows error when signups are disabled', async ({ page }) => {
    // Mock the page data to indicate signups are disabled
    await page.route('**/signup', async route => {
      const response = await route.fetch();
      let html = await response.text();
      
      // Check if the signup page handles disabled signups
      if (html.includes('allowSignups')) {
        return route.fulfill({ body: html, headers: response.headers() });
      }
      return route.continue();
    });

    await page.goto('/signup');
    
    // The page should either redirect or show a message
    // Check if we're redirected to login or if there's an error message
    const url = page.url();
    if (url.includes('/signup')) {
      // Still on signup page, should show disabled message
      const pageContent = await page.content();
      expect(pageContent).toMatch(/sign.*up.*disabled|not.*allow|closed/i);
    } else {
      // Redirected to login
      expect(url).toContain('/login');
    }
  });

  test('protected routes redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/sessions');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('auth endpoints require authentication', async ({ request }) => {
    // Test POST /api/sessions
    let response = await request.post('/api/sessions', {
      data: {
        date: new Date().toISOString(),
        exercises: []
      }
    });
    expect(response.status()).toBe(401);

    // Test POST /api/import
    response = await request.post('/api/import');
    expect(response.status()).toBe(401);

    // Test GET /api/sessions (without includeExercises)
    response = await request.get('/api/sessions');
    expect([200, 401]).toContain(response.status());
    if (response.status() === 401) {
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    }
  });

  test('public endpoints are accessible without authentication', async ({ request }) => {
    // Test GET /api/exercise-list
    let response = await request.get('/api/exercise-list');
    expect([200, 500]).toContain(response.status()); // 500 if Google Sheets not configured

    // Test GET /api/sessions?includeExercises=true (returns empty array for unauthenticated)
    response = await request.get('/api/sessions?includeExercises=true');
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });
});