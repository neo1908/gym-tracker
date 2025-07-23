import { json } from '@sveltejs/kit';
import { fetchSheetData, parseExerciseData } from '$lib/server/googleSheets.js';

export async function GET() {
	try {
		const rawData = await fetchSheetData();
		
		if (!rawData || rawData.length === 0) {
			return json({ exercises: {} });
		}

		console.log('Raw sheet data:');
		console.log('Total rows:', rawData.length);
		
		// In this sheet format:
		// Row 2: Exercise names (starting from column 1)
		// Row 3+: Workout sessions (data for each exercise in corresponding columns)
		
		if (rawData.length < 3) {
			console.log('Not enough rows in sheet');
			return json({ exercises: {} });
		}
		
		const exerciseNamesRow = rawData[2]; // Row 2 has exercise names
		const exercises = {};
		
		console.log('Exercise names row:', exerciseNamesRow);
		
		// Process each exercise (column-wise)
		for (let j = 1; j < exerciseNamesRow.length; j++) {
			const exerciseName = exerciseNamesRow[j];
			
			if (!exerciseName || exerciseName.trim() === '') continue;
			
			console.log(`Processing exercise: "${exerciseName}"`);
			
			exercises[exerciseName] = {
				name: exerciseName,
				sessions: [],
				parseErrors: []
			};
			
			let currentSession = null;
			let sessionCounter = 0;
			
			// Process each workout session (rows 3+)
			for (let i = 3; i < rawData.length; i++) {
				const row = rawData[i];
				const cellValue = row[j]; // Get value for this exercise in this session
				
				if (!cellValue || cellValue.trim() === '') continue;
				
				console.log(`  Row ${i}: "${cellValue}"`);
				
				const parsedData = parseExerciseData(cellValue);
				console.log(`  Parsed data:`, parsedData);
				
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
						} else {
							console.warn(`Found SD marker but no current session for ${exerciseName} at row ${i}`);
						}
					}
				} else {
					// Track unparseable data with location info
					exercises[exerciseName].parseErrors.push({
						row: i + 1, // Convert to 1-based row numbering (Google Sheets style)
						column: String.fromCharCode(65 + j), // Convert column index to letter (A, B, C, etc.)
						location: `${String.fromCharCode(65 + j)}${i + 1}` // e.g., "B4", "C7", etc.
					});
					console.log(`  Unparseable data at ${String.fromCharCode(65 + j)}${i + 1}`);
				}
			}
			
			console.log(`Exercise "${exerciseName}" has ${exercises[exerciseName].sessions.length} sessions`);
			
			// Log session details
			exercises[exerciseName].sessions.forEach(session => {
				console.log(`  Session ${session.sessionNumber}: ${session.sets.length} sets`);
			});
		}

		console.log('Final exercises object:', Object.keys(exercises));
		console.log('Total exercises found:', Object.keys(exercises).length);

		return json({ exercises });
	} catch (error) {
		console.error('Error in API endpoint:', error);
		return json({ error: 'Failed to fetch exercise data' }, { status: 500 });
	}
}