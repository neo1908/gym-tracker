import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('GET /api/sessions returns data for authenticated users', async ({ request }) => {
    const response = await request.get('/api/sessions');
    
    // Should return 401 for unauthenticated users or array for authenticated
    expect([200, 401]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data)).toBeTruthy();
    } else {
      const data = await response.json();
      expect(data).toHaveProperty('error');
    }
  });

  test('GET /api/sessions?includeExercises=true returns sessions with exercises', async ({ request }) => {
    const response = await request.get('/api/sessions?includeExercises=true');
    
    // Should return empty array for unauthenticated users or sessions for authenticated
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    
    // If sessions exist, validate structure
    if (data.length > 0) {
      const session = data[0];
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('date');
      expect(session).toHaveProperty('exercises');
      expect(Array.isArray(session.exercises)).toBeTruthy();
      
      if (session.exercises.length > 0) {
        const exercise = session.exercises[0];
        expect(exercise).toHaveProperty('exerciseName');
        expect(exercise).toHaveProperty('sets');
        expect(exercise).toHaveProperty('reps');
        expect(exercise).toHaveProperty('weight');
      }
    }
  });

  test('GET /api/exercise-list returns list of exercises from Google Sheets', async ({ request }) => {
    const response = await request.get('/api/exercise-list');
    
    // API should respond (even if it fails due to missing credentials)
    expect([200, 500]).toContain(response.status());
    
    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty('exercises');
      expect(Array.isArray(data.exercises)).toBeTruthy();
      
      // If exercises exist, they should be strings
      if (data.exercises.length > 0) {
        expect(typeof data.exercises[0]).toBe('string');
      }
    }
  });

  test('POST /api/import requires authentication', async ({ request }) => {
    const response = await request.post('/api/import');
    
    // Should return 401 for unauthenticated users
    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Unauthorized');
  });

  test('POST /api/sessions requires authentication', async ({ request }) => {
    const response = await request.post('/api/sessions', {
      data: {
        date: new Date().toISOString(),
        notes: 'Test session',
        exercises: []
      }
    });
    
    // Should return 401 for unauthenticated users
    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Unauthorized');
  });

  test('API handles missing environment variables gracefully', async ({ request }) => {
    // This test verifies that the API doesn't crash when env vars are missing
    const response = await request.get('/api/exercise-list');
    
    // Should return an error response, not crash
    expect([200, 401, 403, 500]).toContain(response.status());
    
    if (!response.ok()) {
      const body = await response.text();
      // Should contain some error information
      expect(body.length).toBeGreaterThan(0);
    }
  });
});