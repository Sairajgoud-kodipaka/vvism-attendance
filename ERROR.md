# Debugging Supabase Edge Function Sync to Google Sheets

This document outlines the various errors encountered during the development and deployment of the `sync-to-sheets` Supabase Edge Function and their respective solutions.

---

## 1. Initial Google Sheets Sync Failure (400 Bad Request / "Attendance Saved! Google Sheets sync failed.")

**Problem Description:**
The application would save attendance to the Supabase database successfully, but the Google Sheets sync would consistently fail with a `400 Bad Request` error. Browser console logs indicated that the Edge Function returned a non-2xx status code. Supabase Edge Function logs showed `InvalidCharacterError: Failed to decode base64 at atob` during JWT creation.

**Solution:**
The issue was with the format of the `GOOGLE_SHEETS_PRIVATE_KEY` environment variable. The private key needs to be correctly formatted for `atob` decoding. A more robust regex was implemented in `createSignedJWT` to extract the base64 content, removing headers, footers, and all whitespace.

---

## 2. Google Sheets Sync Failure: "valueInputOption is required but not specified"

**Problem Description:**
After the private key fix, the sync still failed with a specific error in Supabase Edge Function logs: `"valueInputOption is required but not specified"`. This occurred during the attempt to create column headers in the Google Sheet.

**Solution:**
The `valueInputOption: 'RAW'` parameter was missing from the `body` of the `PUT` request when creating new column headers. It was added to the `body` to ensure the API call was correctly formed.

---

## 3. Google Sheets `UpdateValues` Failing (Google Cloud Console Metrics)

**Problem Description:**
While `GetSpreadsheet` and `GetValues` requests to Google Sheets were successful, `UpdateValues` requests were failing with 100% errors, as observed in Google Cloud Console API metrics.

**Solution:**
The `valueInputOption: 'RAW'` was mistakenly included in the JSON `body` of the `PUT` request for the header, even though it was correctly in the URL's query string. This redundancy caused the `400 Bad Request` for `UpdateValues`. The fix was to remove `valueInputOption: 'RAW'` from the JSON `body` for header updates.

---

## 4. Linter Errors: "Cannot find lib definition for 'deno.ns'" and "Cannot find name 'Deno'"

**Problem Description:**
Local development environment (IDE/TypeScript linter) showed errors like "Cannot find lib definition for 'deno.ns'" and "Cannot find name 'Deno'".

**Solution:**
These are expected local development environment warnings because Supabase Edge Functions run in a Deno runtime, which is not natively recognized by typical Node.js-based TypeScript environments. These errors do *not* affect the function's deployment or execution on Supabase and can be safely ignored.

---

## 5. Google Sheets Sync Failure: "Unable to parse range: Sheet1!A5:B" (400 INVALID_ARGUMENT)

**Problem Description:**
After multiple fixes and redeployments, the Supabase Edge Function logs showed a persistent error: `"Unable to parse range: Sheet1!A5:B"`. This indicated that the function was trying to access a sheet named "Sheet1" but couldn't.

**Solution:**
The Google Sheet's actual tab name was "Class 1", not "Sheet1". The code was updated to read the sheet name from a new environment variable `SHEET_NAME`. The solution involved adding a new secret named `SHEET_NAME` to the Supabase Edge Function secrets with the value `Class 1`.

---

## 6. Deployment Issue: Old Code Still Running Despite Secret Updates

**Problem Description:**
Even after updating environment variables (like `SHEET_NAME`) and attempting to apply code fixes, the Edge Function logs continued to show errors consistent with older code (e.g., still trying to parse "Sheet1!A5:B"). This indicated that the latest code changes were not being properly deployed and activated.

**Solution:**
The automatic `edit_file` tool was sometimes failing to apply comprehensive changes correctly. The definitive solution for this recurring issue was to:
1.  Manually copy the *entire, complete, and corrected code block* for `supabase/functions/sync-to-sheets/index.ts` provided by the assistant.
2.  Navigate to the Supabase Dashboard -> Edge Functions -> `sync-to-sheets` function -> Code tab.
3.  **Manually replace *all* existing code in the "Code" tab** with the newly provided complete code.
4.  Click the "Deploy function" button and wait for confirmation of successful deployment.
5.  Verify the `deployment_id` in the Supabase logs to confirm a newer version of the function is running.

---

## 7. Frontend Bug: Incorrect Time Slot Saved to Database

**Problem Description:**
(Identified by user) The UI dropdown showed `12:00-1:00`, but the database consistently saved `10:30-11:30`.

**Solution:**
This is a frontend bug in `src/components/AttendanceApp.tsx` where the selected time slot value is not being correctly captured or passed to the database save function. This issue is separate from the Google Sheets sync and needs to be addressed in the frontend code. (Not addressed by AI yet, but identified).

---

**Important Note:** The Google Sheets attendance sync function requires three environment variables configured in Supabase Edge Function secrets:
- `GOOGLE_SHEETS_PRIVATE_KEY`
- `GOOGLE_SHEETS_CLIENT_EMAIL`
- `GOOGLE_SHEET_ID`
- `SHEET_NAME` (e.g., `Class 1`)
- `STUDENT_DATA_RANGE` (e.g., `A5:B`)
- `HEADER_ROW` (e.g., `4`)
- `STUDENT_DATA_START_ROW` (e.g., `5`)

The `SHEET_NAME`, `STUDENT_DATA_RANGE`, `HEADER_ROW`, and `STUDENT_DATA_START_ROW` were added to make the function more flexible and robust. 