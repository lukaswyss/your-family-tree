import { NextResponse } from 'next/server'

// Deprecated: unmapped places are computed client-side from the uploaded GEDCOM.
export async function GET() {
  return NextResponse.json({ error: 'Unmapped endpoint disabled. Use client-side computation.' }, { status: 404 })
}