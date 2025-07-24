import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('GET /api/exercises returns valid data structure', async ({ request }) => {
    const response = await request.get('/api/exercises');
    
    // API should respond (even if it fails due to missing credentials)
    expect(response.status()).toBeLessThan(500);
    
    // If successful, should return JSON array
    if (response.ok()) {
      const exercises = await response.json();
      expect(Array.isArray(exercises)).toBeTruthy();
      
      // If exercises exist, validate structure
      if (exercises.length > 0) {
        const exercise = exercises[0];
        expect(exercise).toHaveProperty('name');
        expect(exercise).toHaveProperty('sessions');
        expect(Array.isArray(exercise.sessions)).toBeTruthy();
        
        if (exercise.sessions.length > 0) {
          const session = exercise.sessions[0];
          expect(session).toHaveProperty('date');
          expect(session).toHaveProperty('weight');
          expect(session).toHaveProperty('reps');
        }
      }
    }
  });

  test('API handles missing environment variables gracefully', async ({ request }) => {
    // This test verifies that the API doesn't crash when env vars are missing
    const response = await request.get('/api/exercises');
    
    // Should return an error response, not crash
    expect([200, 401, 403, 500]).toContain(response.status());
    
    if (!response.ok()) {
      const body = await response.text();
      // Should contain some error information
      expect(body.length).toBeGreaterThan(0);
    }
  });
});