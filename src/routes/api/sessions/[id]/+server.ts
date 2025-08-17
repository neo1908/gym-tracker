import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { gymSession, exerciseLog } from '$lib/server/schema';
import { eq, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const sessionId = params.id;
    
    const [session] = await db
      .select()
      .from(gymSession)
      .where(
        and(
          eq(gymSession.id, sessionId),
          eq(gymSession.userId, locals.user.id)
        )
      );
    
    if (!session) {
      return json({ error: 'Session not found' }, { status: 404 });
    }
    
    const exercises = await db
      .select()
      .from(exerciseLog)
      .where(eq(exerciseLog.gymSessionId, sessionId))
      .orderBy(exerciseLog.orderIndex);
    
    return json({ ...session, exercises });
  } catch (error) {
    console.error('Failed to fetch session:', error);
    return json({ error: 'Failed to fetch session' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const sessionId = params.id;
    const body = await request.json();
    const { date, notes, exercises } = body;
    
    const [existingSession] = await db
      .select()
      .from(gymSession)
      .where(
        and(
          eq(gymSession.id, sessionId),
          eq(gymSession.userId, locals.user.id)
        )
      );
    
    if (!existingSession) {
      return json({ error: 'Session not found' }, { status: 404 });
    }
    
    const [updatedSession] = await db
      .update(gymSession)
      .set({
        date: date ? new Date(date) : existingSession.date,
        notes: notes !== undefined ? notes : existingSession.notes,
        updatedAt: new Date()
      })
      .where(eq(gymSession.id, sessionId))
      .returning();
    
    if (exercises !== undefined) {
      await db.delete(exerciseLog).where(eq(exerciseLog.gymSessionId, sessionId));
      
      if (exercises && Array.isArray(exercises) && exercises.length > 0) {
        const exerciseEntries = exercises.map((exercise: any, index: number) => ({
          gymSessionId: sessionId,
          exerciseName: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight ? String(exercise.weight) : null,
          unit: exercise.unit || 'kg',
          notes: exercise.notes || null,
          orderIndex: index
        }));
        
        await db.insert(exerciseLog).values(exerciseEntries);
      }
    }
    
    return json(updatedSession);
  } catch (error) {
    console.error('Failed to update session:', error);
    return json({ error: 'Failed to update session' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const sessionId = params.id;
    
    const [existingSession] = await db
      .select()
      .from(gymSession)
      .where(
        and(
          eq(gymSession.id, sessionId),
          eq(gymSession.userId, locals.user.id)
        )
      );
    
    if (!existingSession) {
      return json({ error: 'Session not found' }, { status: 404 });
    }
    
    await db.delete(gymSession).where(eq(gymSession.id, sessionId));
    
    return json({ success: true });
  } catch (error) {
    console.error('Failed to delete session:', error);
    return json({ error: 'Failed to delete session' }, { status: 500 });
  }
};