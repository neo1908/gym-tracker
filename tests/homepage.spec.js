import { test, expect } from '@playwright/test';

test('homepage displays correctly', async ({ page }) => {
  await page.goto('/');
  
  // Check that the page loads
  await expect(page).toHaveTitle(/Gym Tracker/i);
  
  // Check for main heading
  await expect(page.locator('h1')).toHaveText('Exercise Progress');
});

test('exercises are displayed when sheet data is available', async ({ page }) => {
  // Mock the API response to simulate successful data fetch
  await page.route('/api/exercises', async route => {
    const json = [
      {
        name: 'Test Exercise',
        sessions: [
          { date: '2024-01-01', weight: 10, reps: 8 },
          { date: '2024-01-02', weight: 12, reps: 8 }
        ]
      }
    ];
    await route.fulfill({ json });
  });

  await page.goto('/');
  
  // Wait for the exercise to appear
  await expect(page.locator('.exercise-card')).toBeVisible();
  await expect(page.locator('h2')).toHaveText('Test Exercise');
});

test('handles API errors gracefully', async ({ page }) => {
  // Mock API error response
  await page.route('/api/exercises', async route => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Failed to fetch data' })
    });
  });

  await page.goto('/');
  
  // Should display error message instead of crashing
  await expect(page.locator('body')).toContainText('Error loading exercises');
});

test('displays message when no exercises are found', async ({ page }) => {
  // Mock empty response
  await page.route('/api/exercises', async route => {
    await route.fulfill({ json: [] });
  });

  await page.goto('/');
  
  // Should display no exercises message
  await expect(page.locator('body')).toContainText('No exercises found');
});

test('chart renders when exercise has data', async ({ page }) => {
  // Mock exercise with data
  await page.route('/api/exercises', async route => {
    const json = [
      {
        name: 'Bench Press',
        sessions: [
          { date: '2024-01-01', weight: 80, reps: 8 },
          { date: '2024-01-02', weight: 85, reps: 8 },
          { date: '2024-01-03', weight: 90, reps: 6 }
        ]
      }
    ];
    await route.fulfill({ json });
  });

  await page.goto('/');
  
  // Wait for chart to load
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('h2')).toHaveText('Bench Press');
});

test('handles time-based exercises correctly', async ({ page }) => {
  // Mock time-based exercise
  await page.route('/api/exercises', async route => {
    const json = [
      {
        name: 'Plank',
        sessions: [
          { date: '2024-01-01', weight: 60, reps: 1, isTime: true },
          { date: '2024-01-02', weight: 90, reps: 1, isTime: true }
        ]
      }
    ];
    await route.fulfill({ json });
  });

  await page.goto('/');
  
  // Should display the time-based exercise
  await expect(page.locator('h2')).toHaveText('Plank');
  await expect(page.locator('canvas')).toBeVisible();
});