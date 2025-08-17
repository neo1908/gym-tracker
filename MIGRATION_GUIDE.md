# Gym Tracker - Authentication & Database Migration Guide

## Overview
The Gym Tracker has been updated with authentication and database-backed exercise tracking. Users can now sign up, log in, and track their gym sessions with exercises directly in the application.

## Environment Variables

Update your `.env` file with the following new variables:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/gym_tracker

# Authentication Configuration  
BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters
BETTER_AUTH_URL=http://localhost:5173
ALLOW_SIGNUPS=false  # Set to true to enable sign-ups

# Existing Google Sheets Configuration (still used for exercise list)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key-here\n-----END PRIVATE KEY-----"
GOOGLE_SHEETS_ID=your-google-sheets-id-here
```

## Database Setup

1. **Generate database migrations:**
   ```bash
   npm run db:generate
   ```

2. **Apply migrations to your database:**
   ```bash
   npm run db:migrate
   ```
   
   Or push the schema directly (for development):
   ```bash
   npm run db:push
   ```

3. **View your database (optional):**
   ```bash
   npm run db:studio
   ```

## Features

### Authentication
- Email/password authentication using better-auth
- Sign-ups controlled by `ALLOW_SIGNUPS` environment variable
- Session management with secure cookies
- Protected routes for authenticated users

### Exercise Tracking
- **Gym Sessions**: Users can create gym sessions with date and notes
- **Exercise Logs**: Each session can have multiple exercises with:
  - Exercise name (pulled from Google Sheets)
  - Sets and reps
  - Weight and unit (kg/lbs)
  - Optional notes
- **Session History**: View all past gym sessions with exercise details

### Data Flow
1. **Exercise List**: Still fetched from Google Sheets (read-only)
2. **Session Data**: Stored in PostgreSQL database per user
3. **Authentication**: Managed by better-auth with PostgreSQL

## Database Schema

The application creates the following tables:
- `user`: User accounts
- `account`: Authentication providers (email/password)
- `session`: Active user sessions
- `verification`: Email verification tokens
- `gym_session`: User's gym sessions
- `exercise_log`: Individual exercises within sessions

## Usage

1. **First Time Setup:**
   - Set `ALLOW_SIGNUPS=true` temporarily
   - Create your account at `/signup`
   - Set `ALLOW_SIGNUPS=false` to prevent unauthorized sign-ups

2. **Logging Sessions:**
   - Log in at `/login`
   - Navigate to `/sessions`
   - Click "Add Session" to log a new workout
   - Select exercises from the dropdown (populated from Google Sheets)
   - Enter sets, reps, and weight for each exercise

3. **Viewing History:**
   - All sessions are listed on the `/sessions` page
   - Click "View Details" to see full session information

## Docker Deployment

The application now includes automatic database migration on startup when running in Docker.

### Using Docker Compose (Recommended)

1. **Create a `.env` file with your configuration:**
   ```bash
   BETTER_AUTH_SECRET=your-production-secret-at-least-32-characters
   BETTER_AUTH_URL=http://localhost:3000
   ALLOW_SIGNUPS=false
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key-here\n-----END PRIVATE KEY-----"
   GOOGLE_SHEETS_ID=your-google-sheets-id-here
   ```

2. **Start the application with database:**
   ```bash
   docker-compose up -d
   ```

   This will:
   - Start a PostgreSQL database
   - Run database migrations automatically
   - Start the application on port 3000

### Using Docker (Manual)

1. **Build the image:**
   ```bash
   docker build -t gym-tracker .
   ```

2. **Run with environment variables:**
   ```bash
   docker run -p 3000:3000 \
     -e DATABASE_URL="postgresql://user:password@host:5432/gym_tracker" \
     -e BETTER_AUTH_SECRET="your-secret-key" \
     -e BETTER_AUTH_URL="http://localhost:3000" \
     -e ALLOW_SIGNUPS="false" \
     -e GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com" \
     -e GOOGLE_PRIVATE_KEY="your-private-key" \
     -e GOOGLE_SHEETS_ID="your-sheets-id" \
     gym-tracker
   ```

### Automatic Migrations

The Docker container will automatically run `npm run db:push` on startup to ensure the database schema is up to date. If the migration fails (e.g., database not ready), the application will still attempt to start but may fail if the schema is missing.

## Migration Notes

- The original spreadsheet visualization remains available for non-authenticated users
- Authenticated users are redirected to the new session tracking interface
- Google Sheets is still used as the source for exercise names
- All session data is now stored in PostgreSQL, not in Google Sheets
- Database migrations run automatically when using Docker