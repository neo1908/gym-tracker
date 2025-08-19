import { test, expect } from '@playwright/test';

test('homepage displays correctly', async ({ page }) => {
  await page.goto('/');
  
  // Check that the page loads
  await expect(page).toHaveTitle(/Gym Tracker/i);
  
  // Check for main heading - should be in main content, not header
  await expect(page.locator('main h1')).toContainText('Gym Progress Tracker');
});

test('displays login link in header when not authenticated', async ({ page }) => {
  await page.goto('/');
  
  // Check for login link in header
  await expect(page.locator('.auth-links a[href="/login"]')).toBeVisible();
});

test('exercises are displayed when session data is available', async ({ page }) => {
  // Mock the sessions API response to simulate data from database
  await page.route('/api/sessions?includeExercises=true', async route => {
    const json = [
      {
        id: 'session-1',
        date: '2024-01-01T00:00:00Z',
        userId: 'user-1',
        notes: 'Test session',
        exercises: [
          {
            id: 'exercise-1',
            exerciseName: 'Test Exercise',
            sets: 3,
            reps: 8,
            weight: '10',
            unit: 'kg'
          }
        ]
      },
      {
        id: 'session-2',
        date: '2024-01-02T00:00:00Z',
        userId: 'user-1',
        notes: 'Another session',
        exercises: [
          {
            id: 'exercise-2',
            exerciseName: 'Test Exercise',
            sets: 3,
            reps: 8,
            weight: '12',
            unit: 'kg'
          }
        ]
      }
    ];
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
  await page.route('/api/sessions?includeExercises=true', async route => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Failed to fetch sessions' })
    });
  });

  await page.goto('/');
  
  // Should display error message instead of crashing
  await expect(page.locator('.error')).toBeVisible();
  await expect(page.locator('.error')).toContainText('Failed to load exercise data');
});

test('displays message when no exercises are found', async ({ page }) => {
  // Mock empty response (no sessions)
  await page.route('/api/sessions?includeExercises=true', async route => {
    await route.fulfill({ json: [] });
  });

  await page.goto('/');
  
  // Should display no exercises message
  await expect(page.locator('.empty-state')).toBeVisible();
  await expect(page.locator('.empty-state')).toContainText('No exercise data found');
});

test('shows message for unauthenticated users in empty state', async ({ page }) => {
  // Mock empty sessions response
  await page.route('/api/sessions?includeExercises=true', async route => {
    await route.fulfill({ json: [] });
  });

  await page.goto('/');
  
  // Wait for empty state
  await expect(page.locator('.empty-state')).toBeVisible();
  
  // Should show login message for unauthenticated users
  await expect(page.locator('.empty-state')).toContainText('Please log in to view exercise data');
});

test('chart renders when exercise has data', async ({ page }) => {
  // Mock sessions with exercise data
  await page.route('/api/sessions?includeExercises=true', async route => {
    const json = [
      {
        id: 'session-1',
        date: '2024-01-01T00:00:00Z',
        userId: 'user-1',
        exercises: [
          {
            exerciseName: 'Bench Press',
            sets: 3,
            reps: 8,
            weight: '80',
            unit: 'kg'
          }
        ]
      },
      {
        id: 'session-2',
        date: '2024-01-02T00:00:00Z',
        userId: 'user-1',
        exercises: [
          {
            exerciseName: 'Bench Press',
            sets: 3,
            reps: 8,
            weight: '85',
            unit: 'kg'
          }
        ]
      },
      {
        id: 'session-3',
        date: '2024-01-03T00:00:00Z',
        userId: 'user-1',
        exercises: [
          {
            exerciseName: 'Bench Press',
            sets: 3,
            reps: 6,
            weight: '90',
            unit: 'kg'
          }
        ]
      }
    ];
    await route.fulfill({ json });
  });

  await page.goto('/');
  
  // Expand the exercise menu by clicking the collapse toggle
  await page.locator('.controls-header').click();
  
  // Exercise name should be in the exercise list
  await expect(page.locator('.exercise-list label')).toContainText('Bench Press');
  
  // Exercises are selected by default, so the chart should be rendered
  // Wait for the lazy loading container to be visible
  await expect(page.locator('.lazy-chart-container')).toBeVisible({ timeout: 5000 });
  
  // Scroll the chart container into view to trigger the IntersectionObserver
  await page.locator('.lazy-chart-container').scrollIntoViewIfNeeded();
  
  // Wait a bit for the lazy loading animation
  await page.waitForTimeout(500);
  
  // Wait for chart to load - charts are rendered lazily when visible
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
});

test('handles time-based exercises correctly', async ({ page }) => {
  // Mock time-based exercise data from sessions
  await page.route('/api/sessions?includeExercises=true', async route => {
    const json = [
      {
        id: 'session-1',
        date: '2024-01-01T00:00:00Z',
        userId: 'user-1',
        exercises: [
          {
            exerciseName: 'Plank',
            sets: 1,
            reps: 1,
            weight: '60',
            unit: 'seconds'
          }
        ]
      },
      {
        id: 'session-2',
        date: '2024-01-02T00:00:00Z',
        userId: 'user-1',
        exercises: [
          {
            exerciseName: 'Plank',
            sets: 1,
            reps: 1,
            weight: '90',
            unit: 'seconds'
          }
        ]
      }
    ];
    await route.fulfill({ json });
  });

  await page.goto('/');
  
  // Expand the exercise menu by clicking the collapse toggle
  await page.locator('.controls-header').click();
  
  // Should display the time-based exercise in the list
  await expect(page.locator('.exercise-list label')).toContainText('Plank');
  
  // Exercises are selected by default, so the chart should be rendered
  // Wait for the lazy loading container to be visible
  await expect(page.locator('.lazy-chart-container')).toBeVisible({ timeout: 5000 });
  
  // Scroll the chart container into view to trigger the IntersectionObserver
  await page.locator('.lazy-chart-container').scrollIntoViewIfNeeded();
  
  // Wait a bit for the lazy loading animation
  await page.waitForTimeout(500);
  
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
});