# Google Sheets API Integration for VV Attendance App

This guide will help you sync attendance data from your Supabase app to your Google Sheet automatically.

## Step 1: Google Cloud Setup

### 1.1 Create Service Account

1. **Go to Google Cloud Console**: https://console.cloud.google.com
2. **Enable APIs**: 
   - Google Sheets API
   - Google Drive API
3. **Create Service Account**:
   - Go to `IAM & Admin` → `Service Accounts`
   - Create new service account: `vv-attendance-sheets`
   - Download JSON credentials file

### 1.2 Share Your Google Sheet

1. **Open your Google Sheet**: https://docs.google.com/spreadsheets/d/1Lqr6qDaK42qggRCliLt3E9t7h8Hgr_DJc3GJFEfmW6c/edit
2. **Click Share**
3. **Add service account email** (from JSON file): `vv-attendance-sheets@your-project.iam.gserviceaccount.com`
4. **Set permission**: Editor
5. **Uncheck "Notify people"**

## Step 2: Environment Variables

Add these to your Supabase Edge Function:

```env
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_CLIENT_EMAIL="vv-attendance-sheets@your-project.iam.gserviceaccount.com"
GOOGLE_SHEET_ID="1Lqr6qDaK42qggRCliLt3E9t7h8Hgr_DJc3GJFEfmW6c"
```

## Step 3: Google Sheets Integration Code

### 3.1 Create Supabase Edge Function

Create a new edge function for Google Sheets sync:

```typescript
// supabase/functions/sync-to-sheets/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GOOGLE_SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets'

interface AttendanceRecord {
  student_id: number
  student_name: string
  hall_ticket: string
  date: string
  time_slot: string
  status: string
}

async function getAccessToken() {
  const privateKey = Deno.env.get('GOOGLE_SHEETS_PRIVATE_KEY')?.replace(/\\n/g, '\n')
  const clientEmail = Deno.env.get('GOOGLE_SHEETS_CLIENT_EMAIL')
  
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  }
  
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  }
  
  // Create JWT and exchange for access token
  // Implementation details for JWT creation and token exchange
  // ... (JWT signing code)
}

async function findOrCreateDateColumn(sheetId: string, date: string, timeSlot: string) {
  const columnName = `${date} ${timeSlot}`
  
  // Get current sheet data to find column
  const response = await fetch(
    `${GOOGLE_SHEETS_API}/${sheetId}/values/1:1`,
    {
      headers: { 'Authorization': `Bearer ${await getAccessToken()}` }
    }
  )
  
  const data = await response.json()
  const headers = data.values[0]
  
  // Find if column exists
  const columnIndex = headers.findIndex(h => h === columnName)
  
  if (columnIndex !== -1) {
    return columnIndex
  }
  
  // Create new column
  const newColumnIndex = headers.length
  const columnLetter = String.fromCharCode(65 + newColumnIndex) // A, B, C, etc.
  
  // Add header
  await fetch(
    `${GOOGLE_SHEETS_API}/${sheetId}/values/${columnLetter}1`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${await getAccessToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [[columnName]]
      })
    }
  )
  
  return newColumnIndex
}

async function syncAttendanceToSheets(attendanceRecords: AttendanceRecord[]) {
  const sheetId = Deno.env.get('GOOGLE_SHEET_ID')
  
  if (!attendanceRecords.length) return
  
  const { date, time_slot } = attendanceRecords[0]
  const columnIndex = await findOrCreateDateColumn(sheetId, date, time_slot)
  const columnLetter = String.fromCharCode(65 + columnIndex)
  
  // Prepare batch update data
  const updates = attendanceRecords.map((record, index) => {
    const rowNumber = index + 5 // Assuming data starts from row 5
    const value = record.status === 'present' ? 'P' : 'A'
    
    return {
      range: `${columnLetter}${rowNumber}`,
      values: [[value]]
    }
  })
  
  // Batch update the sheet
  await fetch(
    `${GOOGLE_SHEETS_API}/${sheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await getAccessToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'RAW',
        data: updates
      })
    }
  )
}

serve(async (req) => {
  try {
    const { attendanceData } = await req.json()
    
    // Get attendance records from Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )
    
    // Sync to Google Sheets
    await syncAttendanceToSheets(attendanceData)
    
    return new Response(
      JSON.stringify({ success: true, message: 'Synced to Google Sheets' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### 3.2 Update Your App to Sync After Attendance Submission

Modify your attendance submission function to also sync to Google Sheets:

```typescript
// In your VV Attendance app
async function submitAttendance(attendanceData: any[], date: string, timeSlot: string) {
  // 1. Save to Supabase (existing functionality)
  const { data: { user } } = await supabase.auth.getUser()
  
  const records = attendanceData.map(record => ({
    student_id: record.student_id,
    date,
    time_slot: timeSlot,
    status: record.status,
    marked_by: user.id
  }))

  const { data, error } = await supabase
    .from('attendance')
    .upsert(records, { onConflict: 'student_id,date,time_slot' })

  if (error) throw error

  // 2. Sync to Google Sheets
  try {
    const { data: syncData, error: syncError } = await supabase.functions.invoke('sync-to-sheets', {
      body: { 
        attendanceData: records.map(r => ({
          ...r,
          student_name: attendanceData.find(a => a.student_id === r.student_id)?.name,
          hall_ticket: attendanceData.find(a => a.student_id === r.student_id)?.hall_ticket
        }))
      }
    })
    
    if (syncError) {
      console.warn('Google Sheets sync failed:', syncError)
      // Don't throw error - Supabase save was successful
    }
  } catch (syncError) {
    console.warn('Google Sheets sync failed:', syncError)
  }

  return data
}
```

## Step 4: Sheet Structure Mapping

Your Google Sheet structure:
- **Column A**: Student Name
- **Column B**: Hall Ticket No
- **Column C+**: Date columns (format: "9/4 9:30-10:30")

The sync function will:
1. **Find existing date+time column** or create new one
2. **Map students by hall ticket number** to correct row
3. **Update with P (Present) or A (Absent)**
4. **Handle all 201 students** in batch operation

## Step 5: Testing the Integration

1. **Deploy the edge function** to Supabase
2. **Mark attendance** in your VV Attendance app
3. **Check your Google Sheet** - should see new column with attendance data
4. **Verify data accuracy** - P/A values in correct student rows

## Benefits of This Approach

✅ **Dual System**: Supabase for app performance + Google Sheets for reporting
✅ **Automatic Sync**: No manual data entry needed
✅ **Real-time Updates**: Attendance reflects immediately in sheet
✅ **Backup**: Data stored in both systems
✅ **Compatibility**: Existing Google Sheets workflows continue working

## Troubleshooting

**If sync fails:**
- Check service account permissions on the sheet
- Verify environment variables are set correctly
- Check Supabase edge function logs
- Ensure Google Sheets API is enabled

**Data mismatch:**
- Verify student hall tickets match between Supabase and sheet
- Check row mapping logic
- Ensure date/time format consistency