export interface Coordinates {
  lat: number
  lng: number
}

export interface GeocodingCache {
  coordinates: Record<string, Coordinates>
  lastUpdated: string
}

const LOCAL_STORAGE_KEY = 'geocodingCache'

export function loadGeocodingCacheLocal(): GeocodingCache {
  if (typeof window === 'undefined') {
    return { coordinates: {}, lastUpdated: new Date().toISOString() }
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return { coordinates: {}, lastUpdated: new Date().toISOString() }
    const parsed = JSON.parse(raw) as GeocodingCache
    if (!parsed.coordinates) return { coordinates: {}, lastUpdated: new Date().toISOString() }
    return parsed
  } catch {
    return { coordinates: {}, lastUpdated: new Date().toISOString() }
  }
}

function saveCache(cache: GeocodingCache) {
  if (typeof window === 'undefined') return
  const toSave: GeocodingCache = { ...cache, lastUpdated: new Date().toISOString() }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toSave))
}

export function clearGeocodingCacheLocal() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(LOCAL_STORAGE_KEY)
}

export async function getCoordinatesFromCache(place: string): Promise<Coordinates | null> {
  try {
    const cache = loadGeocodingCacheLocal()
    const normalizedPlace = place.toLowerCase().trim()

    // Exact match
    if (cache.coordinates[normalizedPlace]) {
      return cache.coordinates[normalizedPlace]
    }

    // Partial match
    for (const [key, coords] of Object.entries(cache.coordinates)) {
      const keyParts = key.split(',').map(part => part.trim())
      const placeParts = normalizedPlace.split(',').map(part => part.trim())
      for (const placePart of placeParts) {
        for (const keyPart of keyParts) {
          if (placePart.includes(keyPart) || keyPart.includes(placePart)) {
            return coords
          }
        }
      }
    }

    // Fallbacks for generic areas
    if (normalizedPlace.includes('australia') && !normalizedPlace.includes(',')) {
      return { lat: -25.2744, lng: 133.7751 }
    }
    if (normalizedPlace.includes('england') && !normalizedPlace.includes(',')) {
      return { lat: 52.3555, lng: -1.1743 }
    }

    return null
  } catch (error) {
    console.error('Error reading local geocoding cache:', error)
    return null
  }
}

export function addCoordinatesToCache(place: string, coordinates: Coordinates) {
  const cache = loadGeocodingCacheLocal()
  cache.coordinates[place.toLowerCase().trim()] = coordinates
  saveCache(cache)
}

async function fetchCoordinatesFromAPI(place: string, apiKey: string): Promise<Coordinates | null> {
  try {
    const placeParts = place.split(',').map(part => part.trim())
    let query = placeParts[0]
    if (placeParts.length > 1) {
      query = placeParts.slice(0, 2).join(',')
    }
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${apiKey}`
    const response = await fetch(url)
    if (!response.ok) {
      if (response.status === 401) {
        // Special signal for unauthorized to allow caller to abort cleanly
        throw new Error('UNAUTHORIZED')
      }
      throw new Error(`HTTP_${response.status}`)
    }
    const data: Array<{ lat: number; lon: number }> = await response.json()
    if (data && data.length > 0) {
      return { lat: data[0].lat, lng: data[0].lon }
    }
    return null
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') {
      // Propagate unauthorized up; caller will stop batch and show message
      throw e
    }
    console.error(`Failed to fetch coordinates for "${place}":`, e)
    return null
  }
}

export async function batchGeocode(
  places: string[],
  apiKey: string,
  onProgress?: (current: number, total: number) => void
): Promise<{ success: number; failed: string[] }> {
  let success = 0
  const failed: string[] = []
  for (let i = 0; i < places.length; i++) {
    const place = places[i]
    try {
      const existing = await getCoordinatesFromCache(place)
      if (existing) {
        success++
        onProgress?.(i + 1, places.length)
        continue
      }
      const coords = await fetchCoordinatesFromAPI(place, apiKey)
      if (coords) {
        addCoordinatesToCache(place, coords)
        success++
      } else {
        failed.push(place)
      }
      if (i < places.length - 1) {
        await new Promise(r => setTimeout(r, 100))
      }
    } catch (e) {
      if (e instanceof Error && e.message === 'UNAUTHORIZED') {
        // Abort immediately on bad API key
        throw new Error('Unauthorized API key. Please check your API key.')
      }
      console.error('Error geocoding place:', place, e)
      failed.push(place)
    }
    onProgress?.(i + 1, places.length)
  }
  return { success, failed }
}