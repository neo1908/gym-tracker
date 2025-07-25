import { test, expect } from '@playwright/test';

test('homepage displays correctly', async ({ page }) => {
  await page.goto('/');
  
  // Check that the page loads
  await expect(page).toHaveTitle(/Gym Tracker/i);
  
  // Check for main heading
  await expect(page.locator('h1')).toHaveText('Gym Progress Tracker');
});

test('exercises are displayed when sheet data is available', async ({ page }) => {
  // Mock the API response to simulate successful data fetch
  await page.route('/api/exercises', async route => {
    const json = {
      exercises: {
        'Test Exercise': {
          name: 'Test Exercise',
          sessions: [
            { date: 'Session 1', weight: 10, reps: 8 },
            { date: 'Session 2', weight: 12, reps: 8 }
          ],
          parseErrors: []
        }
      }
    };
    await route.fulfill({ json });
  });

  await page.goto('/');
  
  // Wait for the controls section to appear
  await expect(page.locator('.controls')).toBeVisible();
  
  // Expand the exercise menu by clicking the collapse toggle
  await page.locator('.controls-header').click();
  
  // Check for exercise in the exercise list
  await expect(page.locator('.exercise-list label')).toContainText('Test Exercise');
});

test('handles API errors gracefully', async ({ page }) => {
  // Mock API error response
  await page.route('/api/exercises', async route => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Failed to fetch exercise data' })
    });
  });

  await page.goto('/');
  
  // Should display error message instead of crashing
  await expect(page.locator('.error')).toBeVisible();
  await expect(page.locator('.error')).toContainText('Failed to fetch exercise data');
});

test('displays message when no exercises are found', async ({ page }) => {
  // Mock empty response
  await page.route('/api/exercises', async route => {
    await route.fulfill({ json: { exercises: {} } });
  });

  await page.goto('/');
  
  // Should display no exercises message
  await expect(page.locator('.empty-state')).toBeVisible();
  await expect(page.locator('.empty-state')).toContainText('No exercise data found');
});

test('chart renders when exercise has data', async ({ page }) => {
  // Mock exercise with data
  await page.route('/api/exercises', async route => {
    const json = {
      exercises: {
        'Bench Press': {
          name: 'Bench Press',
          sessions: [
            { date: 'Session 1', weight: 80, reps: 8 },
            { date: 'Session 2', weight: 85, reps: 8 },
            { date: 'Session 3', weight: 90, reps: 6 }
          ],
          parseErrors: []
        }
      }
    };
    await route.fulfill({ json });
  });

  await page.goto('/');
  
  // Expand the exercise menu by clicking the collapse toggle
  await page.locator('.controls-header').click();
  
  // Exercise name should be in the exercise list
  await expect(page.locator('.exercise-list label')).toContainText('Bench Press');
  
  // Wait for chart to load - charts are rendered lazily when selected
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
});

test('handles time-based exercises correctly', async ({ page }) => {
  // Mock time-based exercise
  await page.route('/api/exercises', async route => {
    const json = {
      exercises: {
        'Plank': {
          name: 'Plank',
          sessions: [
            { date: 'Session 1', weight: 60, reps: 1, isTime: true },
            { date: 'Session 2', weight: 90, reps: 1, isTime: true }
          ],
          parseErrors: []
        }
      }
    };
    await route.fulfill({ json });
  });

  await page.goto('/');
  
  // Expand the exercise menu by clicking the collapse toggle
  await page.locator('.controls-header').click();
  
  // Should display the time-based exercise in the list
  await expect(page.locator('.exercise-list label')).toContainText('Plank');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
});