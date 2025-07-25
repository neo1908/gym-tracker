import { JWT } from 'google-auth-library';
import { env } from '$env/dynamic/private';
import type { ParsedExerciseData } from '$lib/types';

let cachedData: any[][] | null = null;
let cacheTimestamp: number | null = null;

async function getAccessToken(): Promise<string> {
	// Debug: Log what environment variables are available (without exposing values)
	console.log('Environment variables check:');
	console.log('- GOOGLE_SERVICE_ACCOUNT_EMAIL present:', !!env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
	console.log('- GOOGLE_PRIVATE_KEY present:', !!env.GOOGLE_PRIVATE_KEY);
	console.log('- GOOGLE_SHEETS_ID present:', !!env.GOOGLE_SHEETS_ID);
	console.log('- CACHE_DURATION present:', !!env.CACHE_DURATION);
	
	// Validate environment variables at runtime
	if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
		throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL environment variable is required');
	}
	if (!env.GOOGLE_PRIVATE_KEY) {
		throw new Error('GOOGLE_PRIVATE_KEY environment variable is required');
	}
	if (!env.GOOGLE_SHEETS_ID) {
		throw new Error('GOOGLE_SHEETS_ID environment variable is required');
	}
	
	// Handle the private key - it might be wrapped in quotes and have escaped newlines
	let privateKey = env.GOOGLE_PRIVATE_KEY;
	
	// Remove surrounding quotes if present
	if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
		privateKey = privateKey.slice(1, -1);
	}
	
	// Replace escaped newlines with actual newlines
	privateKey = privateKey.replace(/\\n/g, '\n');
	
	// Ensure the key has proper formatting
	if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
		throw new Error('Invalid private key format. Key should include BEGIN and END markers.');
	}
	
	try {
		// Create JWT client
		const jwtClient = new JWT({
			email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
			key: privateKey,
			scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
		});
		
		// Get access token
		console.log('Attempting to get access token...');
		const accessToken = await jwtClient.getAccessToken();
		console.log('Google Sheets authentication successful');
		
		return accessToken.token;
	} catch (error) {
		console.error('JWT Authentication error:', error.message);
		console.error('Full error:', error);
		throw error;
	}
}

export async function fetchSheetData(): Promise<any[][]> {
	// Get cache duration from environment with fallback
	const CACHE_DURATION_MS = parseInt(env.CACHE_DURATION) || 3600000; // Default 1 hour
	
	// Check cache
	if (cachedData && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION_MS) {
		return cachedData;
	}

	try {
		const accessToken = await getAccessToken();
		
		console.log('Attempting to fetch spreadsheet:', env.GOOGLE_SHEETS_ID);
		console.log('Sheet range: LPP!A:BX');
		
		// First, try to get the spreadsheet metadata to see what sheets exist
		try {
			console.log('Checking spreadsheet metadata...');
			const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEETS_ID}`;
			const metadataResponse = await fetch(metadataUrl, {
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json'
				}
			});
			
			if (!metadataResponse.ok) {
				throw new Error(`Metadata request failed: ${metadataResponse.status} ${metadataResponse.statusText}`);
			}
			
			const metadataData = await metadataResponse.json();
			const sheetNames = metadataData.sheets.map(sheet => sheet.properties.title);
			console.log('Available sheets:', sheetNames);
			
			if (!sheetNames.includes('LPP')) {
				console.log('LPP sheet not found. Available sheets are:', sheetNames);
				// Try the first sheet if LPP doesn't exist
				if (sheetNames.length > 0) {
					console.log('Trying first available sheet:', sheetNames[0]);
					const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEETS_ID}/values/${encodeURIComponent(sheetNames[0] + '!A:BX')}`;
					const response = await fetch(dataUrl, {
						headers: {
							'Authorization': `Bearer ${accessToken}`,
							'Content-Type': 'application/json'
						}
					});
					
					if (!response.ok) {
						throw new Error(`Data request failed: ${response.status} ${response.statusText}`);
					}
					
					const data = await response.json();
					const rows = data.values || [];
					console.log('Successfully fetched data from', sheetNames[0], '- rows:', rows.length);
					
					// Cache the data
					cachedData = rows;
					cacheTimestamp = Date.now();
					
					return rows;
				}
			}
		} catch (metaError) {
			console.error('Error fetching metadata:', metaError.message);
		}
		
		// Fetch the LPP sheet - extend range to column BX to include all exercises
		const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEETS_ID}/values/LPP!A:BX`;
		const response = await fetch(dataUrl, {
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`Data request failed: ${response.status} ${response.statusText}`);
		}
		
		const data = await response.json();
		const rows = data.values || [];
		console.log('Successfully fetched LPP data - rows:', rows.length);
		
		// Cache the data
		cachedData = rows;
		cacheTimestamp = Date.now();
		
		return rows;
	} catch (error) {
		console.error('Error fetching sheet data:', error);
		console.error('Spreadsheet ID being used:', env.GOOGLE_SHEETS_ID);
		console.error('Error details:', {
			message: error.message,
			status: error.status
		});
		
		// Provide helpful error messages
		if (error.message.includes('404')) {
			console.error('404 Error - This usually means:');
			console.error('1. The spreadsheet ID is incorrect');
			console.error('2. The service account doesn\'t have access to the spreadsheet');
			console.error('3. The sheet name "LPP" doesn\'t exist');
			console.error('Make sure to share the spreadsheet with:', env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
		}
		
		// Return cached data if available, even if expired
		if (cachedData) {
			console.log('Returning cached data due to error');
			return cachedData;
		}
		throw error;
	}
}

export function parseExerciseData(cellValue: any): ParsedExerciseData | null {
	if (!cellValue || typeof cellValue !== 'string') {
		return null;
	}

	// Clean up the cell value - remove extra text in parentheses and trim
	let cleanValue = cellValue.replace(/\([^)]*\)/g, '').trim();
	
	// Handle special formats like "10kg/2 lap" - extract just the weight/reps part
	if (cleanValue.includes(' lap')) {
		cleanValue = cleanValue.replace(/ lap.*$/, '');
	}
	
	// Handle formats like "25/10+failure SD" - extract just the weight/reps part
	cleanValue = cleanValue.replace(/\+.*$/, '').replace(/ SD.*$/, '').trim();
	
	console.log(`Parsing "${cellValue}" -> cleaned: "${cleanValue}"`);
	
	// First check if this is a time-based format: "1 min", "1.5 min", "30 sec", "1 m", etc.
	let timeMatch = cleanValue.match(/(\d+(?:\.\d+)?)\s*(min|mins|minute|minutes|m|sec|secs|second|seconds|s)\b/i);
	
	if (timeMatch) {
		const timeValue = parseFloat(timeMatch[1]);
		const timeUnit = timeMatch[2].toLowerCase();
		
		// Convert to seconds for consistency
		let seconds;
		if (timeUnit.startsWith('min') || timeUnit === 'm') {
			seconds = timeValue * 60;
		} else {
			seconds = timeValue;
		}
		
		console.log(`Successfully parsed time: ${timeValue} ${timeUnit} = ${seconds} seconds`);
		
		return {
			weight: seconds,  // Store time in seconds as "weight"
			reps: 1,          // Time-based exercises typically count as 1 rep
			originalUnit: 'sec',
			originalWeight: seconds,
			isTime: true      // Flag to indicate this is a time-based exercise
		};
	}
	
	// Try to match patterns with "/" separator: "10/12" or "10kg/12" or "10lbs/12" or "DB 15/12"
	let match = cleanValue.match(/(?:DB\s+)?(\d+(?:\.\d+)?)\s*(kg|lbs|lb)?\s*\/\s*(\d+)/i);
	
	// If no match with "/", try "x" format: "Knee 10 x3" or "10 x 3" or "15kg x 5"
	if (!match) {
		// This regex captures: optional prefix text, number, optional unit, "x", number
		match = cleanValue.match(/(?:.*?)(\d+(?:\.\d+)?)\s*(kg|lbs|lb)?\s*x\s*(\d+)/i);
	}
	
	if (match) {
		const weight = parseFloat(match[1]);
		const unit = match[2] || 'kg'; // Default to kg if not specified
		const reps = parseInt(match[3]);
		
		// Convert to kg if needed
		const weightInKg = unit.toLowerCase().includes('lb') ? weight * 0.453592 : weight;
		
		console.log(`Successfully parsed: ${weight}${unit} x ${reps} reps`);
		
		return {
			weight: weightInKg,
			reps,
			originalUnit: unit,
			originalWeight: weight
		};
	}
	
	console.log(`Could not parse: "${cellValue}"`);
	return null;
}