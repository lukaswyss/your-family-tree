import { NextRequest, NextResponse } from 'next/server'
import { batchGeocode, loadGeocodingCache } from '@/lib/geocoding'

export async function GET() {
  try {
    const cache = await loadGeocodingCache()
    return NextResponse.json(cache)
  } catch (error) {
    console.error('Error loading geocoding cache:', error)
    return NextResponse.json({ error: 'Failed to load geocoding cache' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { apiKey, places } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 })
    }

    if (!places || !Array.isArray(places) || places.length === 0) {
      return NextResponse.json({ error: 'Places array is required' }, { status: 400 })
    }

    const result = await batchGeocode(places, apiKey)
    
    return NextResponse.json({
      success: true,
      geocoded: result.success,
      failed: result.failed,
      total: places.length
    })
  } catch (error) {
    console.error('Error during batch geocoding:', error)
    return NextResponse.json({ error: 'Failed to geocode places' }, { status: 500 })
  }
} 