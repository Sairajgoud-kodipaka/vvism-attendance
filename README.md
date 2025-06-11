# VV Attendance Application 

This is a student attendance management application built using a React frontend, Supabase for the database, and Supabase Edge Functions for integrating with Google Sheets.

## Features:
- Mark student attendance (Present/Absent)
- Sort students by hall ticket number
- Save attendance records to Supabase database
- Sync attendance data to a Google Sheet

## Technologies Used:
- **Frontend**: React.js
- **Backend/Database**: Supabase
- **Cloud Functions**: Supabase Edge Functions (Deno)
- **Integration**: Google Sheets API

## Setup and Installation:

### 1. Clone the repository:
```bash
git clone [YOUR_REPOSITORY_URL]
cd vv-attendance
```

### 2. Install dependencies:
```bash
npm install
# or
yarn install
# or
bun install
```

### 3. Environment Variables (for Supabase & Google Sheets):
Create a `.env.local` file in the root of your project and add your Supabase credentials:

```
VITE_SUPABASE_URL="YOUR_SUPABASE_URL"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
```

For Google Sheets integration, configure these secrets in your Supabase Dashboard under "Edge Functions" -> "Secrets":
- `GOOGLE_SHEETS_PRIVATE_KEY`: Your Google Service Account private key (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
- `GOOGLE_SHEETS_CLIENT_EMAIL`: Your Google Service Account client email
- `GOOGLE_SHEET_ID`: The ID of your Google Sheet (from its URL)
- `SHEET_NAME`: The exact name of the sheet tab (e.g., `Class 1`)
- `STUDENT_DATA_RANGE`: The range for student names and hall tickets (e.g., `A5:B`)
- `HEADER_ROW`: The row number where column headers are located (e.g., `4`)
- `STUDENT_DATA_START_ROW`: The row number where student data begins (e.g., `5`)

### 4. Deploy Supabase Edge Function:
Ensure your `supabase/functions/sync-to-sheets/index.ts` is up-to-date with the latest code.

Due to potential CLI issues, it is recommended to manually paste the function code directly into the Supabase Dashboard's "Edge Functions" -> "sync-to-sheets" -> "Code" tab and click "Deploy function".

### 5. Run the application:
```bash
npm run dev
# or
yarn dev
# or
bun dev
```

The application will typically run on `http://localhost:5173` (or similar).

## Project Structure (Key Files):
- `src/components/AttendanceApp.tsx`: Main React component for attendance tracking.
- `supabase/functions/sync-to-sheets/index.ts`: Supabase Edge Function for syncing attendance data to Google Sheets.
- `src/sort_students.py`: Python script for sorting student data (if used).

## Troubleshooting:
Refer to `ERROR.md` for a detailed log of encountered issues and their solutions during development.

---

## Contribution:
Feel free to contribute by opening issues or submitting pull requests.
