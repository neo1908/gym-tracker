import { JWT } from 'google-auth-library';
import { env } from '$env/dynamic/private';
import type { ParsedExerciseData } from '$lib/types';

let cachedData: any[][] | null = null;
let cacheTimestamp: number | null = null;

async function getAccessToken(): Promise<string> {
	if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
		throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_EMAIL environment variable');
	}
	if (!env.GOOGLE_PRIVATE_KEY) {
		throw new Error('Missing GOOGLE_PRIVATE_KEY environment variable');
	}
	if (!env.GOOGLE_SHEETS_ID) {
		throw new Error('Missing GOOGLE_SHEETS_ID environment variable');
	}

	const privateKey = env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

	try {
		const jwtClient = new JWT({
			email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
			key: privateKey,
			scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
		});
		
		const accessToken = await jwtClient.getAccessToken();
		
		return accessToken.token;
	} catch (error) {
		throw new Error('JWT Authentication error: ' + error.message);
	}
}

export async function fetchSheetData(): Promise<any[][]> {
	const CACHE_DURATION_MS = parseInt(env.CACHE_DURATION) || 3600000; // Default 1 hour
	
	if (cachedData && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION_MS) {
		return cachedData;
	}

	try {
		const accessToken = await getAccessToken();
		
		const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEETS_ID}`;
		const metadataResponse = await fetch(metadataUrl, {
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json'
			}
		});
		
		if (!metadataResponse.ok) {
			if (metadataResponse.status === 404) {
				throw new Error('Spreadsheet not found. Please check your GOOGLE_SHEETS_ID.');
			} else if (metadataResponse.status === 403) {
				throw new Error('Permission denied. Please share your Google Sheet with the service account email.');
			} else {
				throw new Error(`Failed to fetch spreadsheet metadata: ${metadataResponse.status} ${metadataResponse.statusText}`);
			}
		}
		
		const metadataData = await metadataResponse.json();
		const sheetNames = metadataData.sheets.map(sheet => sheet.properties.title);
		
		let sheetToFetch = 'LPP';
		if (!sheetNames.includes('LPP')) {
			if (sheetNames.length > 0) {
				sheetToFetch = sheetNames[0];
			} else {
				throw new Error('No sheets found in the spreadsheet.');
			}
		}
		
		const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEETS_ID}/values/${encodeURIComponent(sheetToFetch + '!A:BX')}`;
		const response = await fetch(dataUrl, {
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch sheet data: ${response.status} ${response.statusText}`);
		}
		
		const data = await response.json();
		const rows = data.values || [];
		
		cachedData = rows;
		cacheTimestamp = Date.now();
		
		return rows;
	} catch (error) {
		if (cachedData) {
			return cachedData;
		}
		throw error;
	}
}

export function parseExerciseData(cellValue: any): ParsedExerciseData | null {
	if (!cellValue || typeof cellValue !== 'string') {
		return null;
	}

	// Pre-process the string to remove common extra details.
	let cleanValue = cellValue
		.replace(/\([^)]*\)/g, '') // Remove anything in parentheses
		.replace(/\+.*$/, '') // Remove anything after a '+', e.g., "+failure"
		.replace(/\s*SD.*$/, '') // Remove "SD" (Same Day) markers
		.replace(/\s*lap(s)?.*$/, '') // Remove "lap" or "laps"
		.trim();

	// Regex for time-based exercises (e.g., "1 min", "30 sec")
	const timeRegex = /(\d+(?:\.\d+)?)\s*(min|m|sec|s|minute|second)(s)?\b/i;
	const timeMatch = cleanValue.match(timeRegex);

	if (timeMatch) {
		const value = parseFloat(timeMatch[1]);
		const unit = timeMatch[2].toLowerCase();
		const isMinutes = unit.startsWith('m');
		const seconds = isMinutes ? value * 60 : value;

		return {
			weight: seconds,
			reps: 1,
			originalUnit: 'sec',
			originalWeight: seconds,
			isTime: true,
		};
	}

	// Regex for weight-based exercises (e.g., "10kg/12", "20 lbs x 8")
	const weightRegex = /(?:DB\s+)?(\d+(?:\.\d+)?)\s*(kg|lbs|lb)?\s*(?:\/|x)\s*(\d+)/i;
	const weightMatch = cleanValue.match(weightRegex);

	if (weightMatch) {
		const weight = parseFloat(weightMatch[1]);
		const unit = weightMatch[2]?.toLowerCase() || 'kg';
		const reps = parseInt(weightMatch[3], 10);

		const isLbs = unit.includes('lb');
		const weightInKg = isLbs ? weight * 0.453592 : weight;

		return {
			weight: weightInKg,
			reps,
			originalUnit: weightMatch[2] || 'kg',
			originalWeight: weight,
		};
	}

	return null; // Return null if no valid format is found
}
