# Gym Progress Tracker

A SvelteKit application that reads workout data from Google Sheets and displays progress charts for each exercise.

## Features

- Reads data from Google Sheets "LPP" sheet via Google Sheets API
- Parses weight/reps format (e.g., "10/12" = 10kg × 12 reps)
- Displays interactive charts for each exercise
- Caches data for configurable duration (default: 1 hour)
- Read-only access to prevent sheet corruption

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up Google Sheets API with Service Account:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google Sheets API
   - Create a Service Account:
     - Go to "IAM & Admin" → "Service Accounts"
     - Click "Create Service Account"
     - Give it a name and click "Create and Continue"
     - Skip the optional steps and click "Done"
   - Create a key for the service account:
     - Click on the service account you created
     - Go to "Keys" tab → "Add Key" → "Create new key"
     - Choose JSON format and download the file
   - Share your Google Sheet with the service account:
     - Copy the service account email (ends with @...iam.gserviceaccount.com)
     - Open your Google Sheet
     - Click "Share" and paste the service account email
     - Give it "Viewer" access (read-only)

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - From the downloaded JSON key file, copy:
     - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
     - `private_key` → `GOOGLE_PRIVATE_KEY` (include the entire key with BEGIN/END lines)
   - Add your Google Sheets ID from the sheet URL → `GOOGLE_SHEETS_ID`
   - Optionally adjust cache duration (default: 1 hour)

4. Run the development server:
   ```bash
   npm run dev
   ```

## Data Format

The spreadsheet should have:
- First row: Dates
- First column: Exercise names
- Data cells: "weight/reps" format (e.g., "10/12", "10kg/12", "20lbs/8")

## Build

```bash
npm run build
```

## Preview production build

```bash
npm run preview
```
