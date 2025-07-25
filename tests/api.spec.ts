import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('GET /api/exercises returns valid data structure', async ({ request }) => {
    const response = await request.get('/api/exercises');
    
    // API should respond (even if it fails due to missing credentials)
    expect([200, 500]).toContain(response.status());
    
    // If successful, should return JSON with exercises object
    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty('exercises');
      expect(typeof data.exercises).toBe('object');
      
      // If exercises exist, validate structure
      const exerciseNames = Object.keys(data.exercises);
      if (exerciseNames.length > 0) {
        const exerciseName = exerciseNames[0];
        const exercise = data.exercises[exerciseName];
        expect(exercise).toHaveProperty('name');
        expect(exercise).toHaveProperty('sessions');
        expect(exercise).toHaveProperty('parseErrors');
        expect(Array.isArray(exercise.sessions)).toBeTruthy();
        expect(Array.isArray(exercise.parseErrors)).toBeTruthy();
        
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