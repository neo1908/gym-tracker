import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fetchSheetData, parseExerciseData } from '$lib/server/googleSheets';
import type { Exercise, ExercisesResponse, ErrorResponse, ExerciseSession } from '$lib/types';

export const GET: RequestHandler = async () => {
	try {
		const rawData = await fetchSheetData();
		
		if (!rawData || rawData.length === 0) {
			return json({ exercises: {} });
		}
		
		// In this sheet format:
		// Row 3 (index 2): Exercise names starting from column B (index 1) to column BX
		// Row 4+ (index 3+): Workout sessions (data for each exercise in corresponding columns)
		
		if (rawData.length < 3) {
			return json({ exercises: {} });
		}
		
		// Exercise names are in row 3 (Excel row 3, 0-indexed as row 2)
		const exerciseNamesRow = rawData[2]; // Row 3 in Excel (0-indexed as row 2)
		const exercises: Record<string, Exercise> = {};
		
		// Process each exercise (column-wise) - start from column B (index 1)
		// Column B is index 1, going up to column BX (which would be around index 75)
		for (let j = 1; j < exerciseNamesRow.length; j++) {
			const exerciseName = exerciseNamesRow[j];
			
			if (!exerciseName || exerciseName.trim() === '') continue;
			
			exercises[exerciseName] = {
				name: exerciseName,
				sessions: [],
				parseErrors: []
			};
			
			let currentSession: ExerciseSession | null = null;
			let sessionCounter = 0;
			
			// Process each workout session (starting from row 4 in Excel, which is index 3)
			for (let i = 3; i < rawData.length; i++) {
				const row = rawData[i];
				const cellValue = row[j]; // Get value for this exercise in this session
				
				if (!cellValue || cellValue.trim() === '') continue;
				
				const parsedData = parseExerciseData(cellValue);
				
				if (parsedData) {
					// Check if this is a "Same Day" (SD) set
					const isSameDay = cellValue.toUpperCase().includes(' SD');
					
					if (!isSameDay) {
						// This is a new session
						sessionCounter++;
						currentSession = {
							date: `Session ${sessionCounter}`,
							sessionNumber: sessionCounter,
							sets: [],
							// For backward compatibility, keep the first set's data at the top level
							weight: parsedData.weight,
							reps: parsedData.reps,
							originalWeight: parsedData.originalWeight,
							originalUnit: parsedData.originalUnit
						};
						
						currentSession.sets.push({
							...parsedData,
							setNumber: 1
						});
						
						exercises[exerciseName].sessions.push(currentSession);
					} else {
						// This is an additional set for the current session
						if (currentSession) {
							currentSession.sets.push({
								...parsedData,
								setNumber: currentSession.sets.length + 1
							});
							
							// Update session totals with best set (highest weight * reps volume)
							const currentVolume = currentSession.weight * currentSession.reps;
							const newVolume = parsedData.weight * parsedData.reps;
							
							if (newVolume > currentVolume) {
								currentSession.weight = parsedData.weight;
								currentSession.reps = parsedData.reps;
								currentSession.originalWeight = parsedData.originalWeight;
								currentSession.originalUnit = parsedData.originalUnit;
							}
						}
					}
				}
			}
		}

		// Identify personal records
		for (const exerciseName in exercises) {
			const exercise = exercises[exerciseName];
			let maxVolume = 0;
			for (const session of exercise.sessions) {
				const volume = session.weight * session.reps;
				if (volume > maxVolume) {
					maxVolume = volume;
				}
			}

			for (const session of exercise.sessions) {
				const volume = session.weight * session.reps;
				if (volume === maxVolume) {
					session.isPR = true;
				}
			}
		}

		return json<ExercisesResponse>({ exercises });
	} catch (error) {
		return json<ErrorResponse>({ error: error.message }, { status: 500 });
	}
};
