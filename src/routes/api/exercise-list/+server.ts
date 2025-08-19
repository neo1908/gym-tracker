import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fetchSheetData } from '$lib/server/googleSheets';

export const GET: RequestHandler = async () => {
  try {
    const rawData = await fetchSheetData();
    
    if (!rawData || rawData.length < 3) {
      return json({ exercises: [] });
    }
    
    // Exercise names are in row 3 (index 2), starting from column B (index 1)
    const exerciseNamesRow = rawData[2];
    const exercises: string[] = [];
    
    // Process each exercise name from column B onwards
    for (let j = 1; j < exerciseNamesRow.length; j++) {
      const exerciseName = exerciseNamesRow[j];
      if (exerciseName && exerciseName.trim() !== '') {
        exercises.push(exerciseName.trim());
      }
    }
    
    // Remove duplicates and sort
    const uniqueExercises = [...new Set(exercises)].sort();
    
    return json({ exercises: uniqueExercises });
  } catch (error) {
    console.error('Failed to fetch exercise list:', error);
    return json({ error: 'Failed to fetch exercise list' }, { status: 500 });
  }
};