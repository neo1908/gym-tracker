import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { gymSession, exerciseLog } from '$lib/server/schema';
import { eq, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, url }) => {
  // Allow public read access to exercise data
  const includeExercises = url.searchParams.get('includeExercises') === 'true';
  
  try {
    if (includeExercises) {
      // For now, only show data for logged-in user
      if (!locals.user) {
        return json([]);
      }
      
      // Fetch sessions with exercise logs for display
      const sessionsWithExercises = await db
        .select()
        .from(gymSession)
        .leftJoin(exerciseLog, eq(gymSession.id, exerciseLog.gymSessionId))
        .where(eq(gymSession.userId, locals.user.id))
        .orderBy(desc(gymSession.date));
      
      // Group exercises by session
      const sessionsMap = new Map();
      for (const row of sessionsWithExercises) {
        const session = row.gym_session;
        const exercise = row.exercise_log;
        
        if (!sessionsMap.has(session.id)) {
          sessionsMap.set(session.id, {
            ...session,
            exercises: []
          });
        }
        
        if (exercise) {
          sessionsMap.get(session.id).exercises.push(exercise);
        }
      }
      
      return json(Array.from(sessionsMap.values()));
    } else {
      // Simple session list for authenticated users
      if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const sessions = await db
        .select()
        .from(gymSession)
        .where(eq(gymSession.userId, locals.user.id))
        .orderBy(desc(gymSession.date));
      
      return json(sessions);
    }
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return json({ error: 'Database connection not configured' }, { status: 503 });
    }
    return json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { date, notes, exercises } = body;
    
    if (!date) {
      return json({ error: 'Date is required' }, { status: 400 });
    }
    
    const [session] = await db
      .insert(gymSession)
      .values({
        userId: locals.user.id,
        date: new Date(date),
        notes: notes || null
      })
      .returning();
    
    if (exercises && Array.isArray(exercises)) {
      const exerciseEntries = exercises.map((exercise: any, index: number) => ({
        gymSessionId: session.id,
        exerciseName: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight ? String(exercise.weight) : null,
        unit: exercise.unit || 'kg',
        notes: exercise.notes || null,
        orderIndex: index
      }));
      
      if (exerciseEntries.length > 0) {
        await db.insert(exerciseLog).values(exerciseEntries);
      }
    }
    
    return json(session);
  } catch (error) {
    console.error('Failed to create session:', error);
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return json({ error: 'Database connection not configured' }, { status: 503 });
    }
    return json({ error: 'Failed to create session' }, { status: 500 });
  }
};