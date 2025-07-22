import { google } from 'googleapis';
import { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEETS_ID, CACHE_DURATION } from '$env/static/private';

// We'll validate these at runtime in the function to avoid module-level errors

let cachedData = null;
let cacheTimestamp = null;

const CACHE_DURATION_MS = parseInt(CACHE_DURATION) || 3600000; // Default 1 hour

async function getAuthClient() {
	// Validate environment variables at runtime
	if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) {
		throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL environment variable is required');
	}
	if (!GOOGLE_PRIVATE_KEY) {
		throw new Error('GOOGLE_PRIVATE_KEY environment variable is required');
	}
	if (!GOOGLE_SHEETS_ID) {
		throw new Error('GOOGLE_SHEETS_ID environment variable is required');
	}
	
	// Handle the private key - it might be wrapped in quotes and have escaped newlines
	let privateKey = GOOGLE_PRIVATE_KEY;
	
	// Log initial key info for debugging (without exposing the actual key)
	console.log('Private key initial length:', privateKey?.length || 'undefined');
	console.log('Service account email:', GOOGLE_SERVICE_ACCOUNT_EMAIL);
	
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
	
	console.log('Processed private key length:', privateKey.length);
	console.log('Private key begins with:', privateKey.substring(0, 27));
	
	try {
		// Create auth client using JWT with the object form
		const auth = new google.auth.JWT({
			email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
			key: privateKey,
			scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
		});
		
		// Test the authentication
		console.log('Attempting to authorize JWT...');
		await auth.authorize();
		console.log('Google Sheets authentication successful');
		
		return auth;
	} catch (error) {
		console.error('JWT Authentication error:', error.message);
		console.error('Full error:', error);
		
		// Try the older JWT constructor syntax
		try {
			console.log('Attempting older JWT constructor syntax...');
			const auth = new google.auth.JWT(
				GOOGLE_SERVICE_ACCOUNT_EMAIL,
				null,
				privateKey,
				['https://www.googleapis.com/auth/spreadsheets.readonly']
			);
			
			await auth.authorize();
			console.log('Older JWT syntax successful');
			return auth;
		} catch (oldError) {
			console.error('Older JWT syntax also failed:', oldError.message);
			throw error; // Throw original error
		}
	}
}

export async function fetchSheetData() {
	// Check cache
	if (cachedData && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION_MS) {
		return cachedData;
	}

	try {
		const auth = await getAuthClient();
		const sheets = google.sheets({ version: 'v4', auth });
		
		console.log('Attempting to fetch spreadsheet:', GOOGLE_SHEETS_ID);
		console.log('Sheet range: LPP!A:Z');
		
		// First, try to get the spreadsheet metadata to see what sheets exist
		try {
			console.log('Checking spreadsheet metadata...');
			const metadataResponse = await sheets.spreadsheets.get({
				spreadsheetId: GOOGLE_SHEETS_ID
			});
			
			const sheetNames = metadataResponse.data.sheets.map(sheet => sheet.properties.title);
			console.log('Available sheets:', sheetNames);
			
			if (!sheetNames.includes('LPP')) {
				console.log('LPP sheet not found. Available sheets are:', sheetNames);
				// Try the first sheet if LPP doesn't exist
				if (sheetNames.length > 0) {
					console.log('Trying first available sheet:', sheetNames[0]);
					const response = await sheets.spreadsheets.values.get({
						spreadsheetId: GOOGLE_SHEETS_ID,
						range: `${sheetNames[0]}!A:Z`,
					});
					
					const rows = response.data.values || [];
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
		
		// Fetch the LPP sheet
		const response = await sheets.spreadsheets.values.get({
			spreadsheetId: GOOGLE_SHEETS_ID,
			range: 'LPP!A:Z', // Adjust range as needed
		});

		const rows = response.data.values || [];
		console.log('Successfully fetched LPP data - rows:', rows.length);
		
		// Cache the data
		cachedData = rows;
		cacheTimestamp = Date.now();
		
		return rows;
	} catch (error) {
		console.error('Error fetching sheet data:', error);
		console.error('Spreadsheet ID being used:', GOOGLE_SHEETS_ID);
		console.error('Error details:', {
			message: error.message,
			code: error.code,
			status: error.status
		});
		
		// Provide helpful error messages
		if (error.code === 404) {
			console.error('404 Error - This usually means:');
			console.error('1. The spreadsheet ID is incorrect');
			console.error('2. The service account doesn\'t have access to the spreadsheet');
			console.error('3. The sheet name "LPP" doesn\'t exist');
			console.error('Make sure to share the spreadsheet with:', GOOGLE_SERVICE_ACCOUNT_EMAIL);
		}
		
		// Return cached data if available, even if expired
		if (cachedData) {
			console.log('Returning cached data due to error');
			return cachedData;
		}
		throw error;
	}
}

export function parseExerciseData(cellValue) {
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
	
	// Match patterns like "10/12" or "10kg/12" or "10lbs/12" or "DB 15/12"
	const match = cleanValue.match(/(?:DB\s+)?(\d+(?:\.\d+)?)\s*(kg|lbs|lb)?\s*\/\s*(\d+)/i);
	
	if (match) {
		const weight = parseFloat(match[1]);
		const unit = match[2] || 'kg'; // Default to kg if not specified
		const reps = parseInt(match[3]);
		
		// Convert to kg if needed
		const weightInKg = unit.toLowerCase().includes('lb') ? weight * 0.453592 : weight;
		
		console.log(`Successfully parsed: ${weight}${unit}/${reps} reps`);
		
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