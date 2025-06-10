/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GOOGLE_SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets'

// Proper JWT creation with RSA signing
async function createSignedJWT(privateKey: string, clientEmail: string): Promise<string> {
  try {
    // Extract only the base64 content from the private key, removing headers, footers, and all whitespace.
    // The regex captures content between BEGIN and END markers, then strips all non-base64 characters.
    const base64Match = privateKey.match(/-----BEGIN PRIVATE KEY-----\s*([a-zA-Z0-9+/=\s]+)\s*-----END PRIVATE KEY-----/);
    if (!base64Match || !base64Match[1]) {
      throw new Error('Private key is not in a valid PEM format.');
    }
    const pemKeyContent = base64Match[1].replace(/\s/g, ''); // Remove all whitespace from the extracted base64 content

    // Import the private key for signing
    const binaryKey = Uint8Array.from(atob(pemKeyContent), c => c.charCodeAt(0))
    
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    )

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

    // Base64URL encode header and payload
    const encodedHeader = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

    // Create signature
    const signatureInput = `${encodedHeader}.${encodedPayload}`
    const signatureBytes = new TextEncoder().encode(signatureInput)
    
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      signatureBytes
    )

    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')

    return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
  } catch (error) {
    console.error('JWT creation failed:', error)
    throw new Error(`Failed to create JWT: ${error.message}`)
  }
}

async function getAccessToken(): Promise<string> {
  try {
    const privateKey = Deno.env.get('GOOGLE_SHEETS_PRIVATE_KEY')
    const clientEmail = Deno.env.get('GOOGLE_SHEETS_CLIENT_EMAIL')

    if (!privateKey || !clientEmail) {
      throw new Error('Missing required environment variables: GOOGLE_SHEETS_PRIVATE_KEY or GOOGLE_SHEETS_CLIENT_EMAIL')
    }

    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
      throw new Error('Invalid private key format. Must be a valid PEM format private key.')
    }

    if (!clientEmail.includes('@')) {
      throw new Error('Invalid client email format.')
    }

    // Create properly signed JWT
    const jwt = await createSignedJWT(privateKey, clientEmail)

    // Exchange JWT for access token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OAuth token exchange failed:', response.status, errorText)
      throw new Error(`OAuth token exchange failed: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    
    if (!data.access_token) {
      console.error('No access token in response:', data)
      throw new Error('Failed to obtain access token from Google')
    }

    return data.access_token

  } catch (error) {
    console.error('Access token generation failed:', error)
    throw new Error(`Authentication failed: ${error.message}`)
  }
}

// New function to get student data from the Google Sheet
async function getStudentData(sheetId: string, accessToken: string): Promise<string[][]> {
  try {
    // Assuming student names are in Column A and Hall Tickets in Column B, starting from Row 5
    const range = 'Sheet1!A5:B' 
    const response = await fetch(
      `${GOOGLE_SHEETS_API}/${sheetId}/values/${range}`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch student data from sheet: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    return data.values || [] // Return an empty array if no values are found
  } catch (error) {
    console.error('Failed to retrieve student data from Google Sheet:', error)
    throw error
  }
}

async function validateSheetAccess(sheetId: string, accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${GOOGLE_SHEETS_API}/${sheetId}`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    )

    if (response.status === 404) {
      throw new Error('Google Sheet not found. Check the GOOGLE_SHEET_ID environment variable.')
    }

    if (response.status === 403) {
      throw new Error('Access denied to Google Sheet. Make sure the service account has Editor access to the sheet.')
    }

    if (!response.ok) {
      throw new Error(`Sheet access validation failed: ${response.status}`)
    }

    return true
  } catch (error) {
    console.error('Sheet validation failed:', error)
    throw error
  }
}

async function syncToGoogleSheets(attendanceData: any[]): Promise<{success: boolean, message: string, details?: any}> {
  try {
    // Validate input
    if (!attendanceData || !Array.isArray(attendanceData)) {
      throw new Error('Invalid attendance data: must be an array')
    }

    if (attendanceData.length === 0) {
      return { success: true, message: 'No attendance data to sync' }
    }

    // Validate environment variables
    const sheetId = Deno.env.get('GOOGLE_SHEET_ID')
    if (!sheetId) {
      throw new Error('Missing GOOGLE_SHEET_ID environment variable')
    }

    // Validate attendance data structure
    const requiredFields = ['date', 'time_slot', 'hall_ticket', 'status']
    const firstRecord = attendanceData[0]
    
    for (const field of requiredFields) {
      if (!(field in firstRecord)) {
        throw new Error(`Missing required field '${field}' in attendance data`)
      }
    }

    // Get access token
    const accessToken = await getAccessToken()
    
    // Validate sheet access
    await validateSheetAccess(sheetId, accessToken)

    // Fetch student data from the Google Sheet
    const students = await getStudentData(sheetId, accessToken)
    if (students.length === 0) {
      console.warn('No student data found in the Google Sheet. Cannot sync attendance by hall ticket.')
      return { success: false, message: 'No student data found in Google Sheet. Please populate it first.' }
    }

    const { date, time_slot } = attendanceData[0]
    const columnName = `${date} ${time_slot}`

    console.log(`Syncing attendance for ${columnName} with ${attendanceData.length} records`)

    // Get current sheet structure with retry logic
    let sheetResponse
    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        sheetResponse = await fetch(
          `${GOOGLE_SHEETS_API}/${sheetId}/values/A1:ZZ4`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        )

        if (sheetResponse.ok) break

        if (sheetResponse.status === 429) {
          // Rate limited, wait and retry
          const waitTime = Math.pow(2, retryCount) * 1000 // Exponential backoff
          console.log(`Rate limited, waiting ${waitTime}ms before retry`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        } else {
          throw new Error(`Failed to fetch sheet data: ${sheetResponse.status}`)
        }
      } catch (error) {
        console.error(`Attempt ${retryCount + 1} failed:`, error)
        if (retryCount === maxRetries - 1) throw error
      }
      retryCount++
    }

    if (!sheetResponse?.ok) {
      throw new Error('Failed to fetch sheet data after multiple retries')
    }

    const sheetData = await sheetResponse.json()
    
    if (!sheetData.values || !Array.isArray(sheetData.values)) {
      throw new Error('Invalid sheet data structure')
    }

    const headers = sheetData.values[3] || [] // Row 4 has the headers
    console.log('Found headers:', headers)

    // Find or create column for this date/time
    let columnIndex = headers.findIndex((h: string) => h === columnName)

    if (columnIndex === -1) {
      // Add new column
      columnIndex = headers.length
      const columnLetter = String.fromCharCode(67 + columnIndex) // Start from column C

      console.log(`Creating new column ${columnLetter} for ${columnName}`)

      // Add header to row 4
      const headerResponse = await fetch(
        `${GOOGLE_SHEETS_API}/${sheetId}/values/${columnLetter}4?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: [
              [
                columnName
              ]
            ]
          })
        }
      )

      if (!headerResponse.ok) {
        const errorText = await headerResponse.text()
        throw new Error(`Failed to create column header: ${headerResponse.status} ${errorText}`)
      }
    }
  
    // Prepare batch updates for attendance data
    const columnLetter = String.fromCharCode(67 + columnIndex) // C, D, E, etc.
    const updates: { range: string; values: string[][] }[] = []
    const notFoundStudents: string[] = []

    // Create updates for each student
    attendanceData.forEach(record => {
      // Find student row by hall ticket
      const studentRowIndex = students.findIndex(
        (student: string[]) => student[1] === record.hall_ticket
      )

      if (studentRowIndex !== -1) {
        const rowNumber = studentRowIndex + 5 // Add 5 because students start from row 5
        const value = record.status === 'present' ? 'P' : 'A'

        updates.push({
          range: `${columnLetter}${rowNumber}`,
          values: [[value]]
        })
      } else {
        notFoundStudents.push(record.hall_ticket)
      }
    })

    if (notFoundStudents.length > 0) {
      console.warn(`Students not found in sheet: ${notFoundStudents.join(', ')}`)
    }

    // Batch update all attendance marks
    if (updates.length > 0) {
      const batchResponse = await fetch(
        `${GOOGLE_SHEETS_API}/${sheetId}/values:batchUpdate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            valueInputOption: 'RAW',
            data: updates
          })
        }
      )

      if (!batchResponse.ok) {
        const errorText = await batchResponse.text()
        throw new Error(`Batch update failed: ${batchResponse.status} ${errorText}`)
      }

      const batchResult = await batchResponse.json()
      console.log('Batch update completed:', batchResult)
    }

    return { 
      success: true, 
      message: `Successfully synced ${updates.length} attendance records to Google Sheets`,
      details: {
        totalRecords: attendanceData.length,
        successfulUpdates: updates.length,
        notFoundStudents: notFoundStudents.length,
        columnName: columnName
      }
    }

  } catch (error) {
    console.error('Google Sheets sync failed:', error)
    throw new Error(`Sync failed: ${error.message}`)
  }
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { status: 405, headers: corsHeaders }
      )
    }

    // Parse request body
    let requestBody
    try {
      requestBody = await req.json()
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: corsHeaders }
      )
    }

    const { attendanceData } = requestBody

    if (!attendanceData) {
      return new Response(
        JSON.stringify({ error: 'Missing attendanceData in request body' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Perform the sync
    const result = await syncToGoogleSheets(attendanceData)

    console.log('Sync completed successfully:', result)

    return new Response(
      JSON.stringify(result),
      { headers: corsHeaders }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    
    // Return appropriate error response
    const statusCode = error.message.includes('Authentication failed') ? 401 :
                      error.message.includes('Access denied') ? 403 :
                      error.message.includes('not found') ? 404 :
                      error.message.includes('Invalid') ? 400 : 500

    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: statusCode, headers: corsHeaders }
    )
  }
}) 