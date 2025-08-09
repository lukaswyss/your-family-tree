import { NextRequest, NextResponse } from 'next/server'

// This route is deprecated in favor of client-side upload/localStorage.
// Keep it returning 404 to avoid exposing server file paths.
export async function GET(_request: NextRequest) {
  return NextResponse.json({ error: 'No GEDCOM configured. Upload on the homepage.' }, { status: 404 })
}