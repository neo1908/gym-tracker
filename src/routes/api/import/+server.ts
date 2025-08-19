import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fetchSheetData, parseExerciseData } from '$lib/server/googleSheets';
import { db } from '$lib/server/db';
import { gymSession, exerciseLog } from '$lib/server/schema';

// Epley formula for estimated 1RM
const epley = (weight: number, reps: number) => weight * (1 + reps / 30);

export const POST: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const rawData = await fetchSheetData();
    
    if (!rawData || rawData.length < 3) {
      return json({ message: 'No data to import', imported: 0 });
    }
    
    // Exercise names are in row 3 (index 2)
    const exerciseNamesRow = rawData[2];
    let totalImported = 0;
    const errors: string[] = [];
    
    // Track sessions by date to avoid duplicates
    const sessionsByDate = new Map<string, string>();
    
    // Process each row of workout data (starting from row 4, index 3)
    for (let i = 3; i < rawData.length; i++) {
      const row = rawData[i];
      const dateCell = row[0]; // Date is in column A
      
      if (!dateCell || dateCell.trim() === '') continue;
      
      // Parse date (assuming format like "Mon, Nov 18, 2024" or similar)
      let sessionDate: Date;
      try {
        sessionDate = new Date(dateCell);
        if (isNaN(sessionDate.getTime())) {
          errors.push(`Row ${i + 1}: Invalid date format: ${dateCell}`);
          continue;
        }
      } catch (error) {
        errors.push(`Row ${i + 1}: Could not parse date: ${dateCell}`);
        continue;
      }
      
      const dateKey = sessionDate.toISOString().split('T')[0];
      
      // Get or create session for this date
      let sessionId = sessionsByDate.get(dateKey);
      if (!sessionId) {
        try {
          const [newSession] = await db
            .insert(gymSession)
            .values({
              userId: locals.user.id,
              date: sessionDate,
              notes: `Imported from Google Sheets`
            })
            .returning();
          
          sessionId = newSession.id;
          sessionsByDate.set(dateKey, sessionId);
        } catch (error) {
          errors.push(`Row ${i + 1}: Failed to create session: ${error}`);
          continue;
        }
      }
      
      // Process exercises for this session
      const exerciseLogs = [];
      for (let j = 1; j < exerciseNamesRow.length; j++) {
        const exerciseName = exerciseNamesRow[j];
        const cellValue = row[j];
        
        if (!exerciseName || !cellValue || cellValue.trim() === '') continue;
        
        const parsedData = parseExerciseData(cellValue);
        if (!parsedData) {
          errors.push(`Row ${i + 1}, Column ${j + 1}: Could not parse: ${cellValue}`);
          continue;
        }
        
        // Check if this is a "Same Day" (SD) set - for now, we'll just log the first set
        const isSameDay = cellValue.toUpperCase().includes(' SD');
        
        exerciseLogs.push({
          gymSessionId: sessionId,
          exerciseName: exerciseName.trim(),
          sets: 1, // We'll track individual sets for now
          reps: parsedData.reps,
          weight: String(parsedData.weight),
          unit: parsedData.originalUnit || 'kg',
          notes: isSameDay ? 'Multiple sets' : null,
          orderIndex: exerciseLogs.length
        });
      }
      
      // Insert exercise logs for this session
      if (exerciseLogs.length > 0) {
        try {
          await db.insert(exerciseLog).values(exerciseLogs);
          totalImported += exerciseLogs.length;
        } catch (error) {
          errors.push(`Row ${i + 1}: Failed to insert exercises: ${error}`);
        }
      }
    }
    
    return json({
      message: `Import completed`,
      imported: totalImported,
      sessions: sessionsByDate.size,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Import failed:', error);
    return json({ error: 'Import failed', details: error.message }, { status: 500 });
  }
};