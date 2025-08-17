import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { gymSession, exerciseLog } from '$lib/server/schema';
import { eq, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const sessions = await db
      .select()
      .from(gymSession)
      .where(eq(gymSession.userId, locals.user.id))
      .orderBy(desc(gymSession.date));
    
    return json(sessions);
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
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
    return json({ error: 'Failed to create session' }, { status: 500 });
  }
};