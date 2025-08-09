import { promises as fs } from 'fs'
import path from 'path'

export interface Coordinates {
  lat: number
  lng: number
}

export interface GeocodingCache {
  coordinates: Record<string, Coordinates>
  lastUpdated: string
}

export interface OpenWeatherMapGeoResponse {
  name: string
  lat: number
  lon: number
  country: string
  state?: string
}

const CACHE_FILE_PATH = path.join(process.cwd(), 'src/data/geocoding-cache.json')

// Load the geocoding cache from file
export async function loadGeocodingCache(): Promise<GeocodingCache> {
  try {
    const data = await fs.readFile(CACHE_FILE_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading geocoding cache:', error)
    return {
      coordinates: {},
      lastUpdated: new Date().toISOString()
    }
  }
}

// Save the geocoding cache to file
export async function saveGeocodingCache(cache: GeocodingCache): Promise<void> {
  try {
    cache.lastUpdated = new Date().toISOString()
    await fs.writeFile(CACHE_FILE_PATH, JSON.stringify(cache, null, 2))
  } catch (error) {
    console.error('Error saving geocoding cache:', error)
    throw error
  }
}

// Get coordinates from cache
export async function getCoordinatesFromCache(place: string): Promise<Coordinates | null> {
  const cache = await loadGeocodingCache()
  const normalizedPlace = place.toLowerCase().trim()
  
  // Try exact match first
  if (cache.coordinates[normalizedPlace]) {
    return cache.coordinates[normalizedPlace]
  }

  // Try partial matches for major cities and regions
  for (const [key, coords] of Object.entries(cache.coordinates)) {
    const keyParts = key.split(',').map(part => part.trim())
    const placeParts = normalizedPlace.split(',').map(part => part.trim())
    
    // Check if any part of the place matches any part of the key
    for (const placePart of placeParts) {
      for (const keyPart of keyParts) {
        if (placePart.includes(keyPart) || keyPart.includes(placePart)) {
          return coords
        }
      }
    }
  }

  // Special handling for generic country/state names
  if (normalizedPlace.includes('australia') && !normalizedPlace.includes(',')) {
    return { lat: -25.2744, lng: 133.7751 } // Center of Australia
  }
  
  if (normalizedPlace.includes('england') && !normalizedPlace.includes(',')) {
    return { lat: 52.3555, lng: -1.1743 } // Center of England
  }

  return null
}

// Fetch coordinates from OpenWeatherMap API
export async function fetchCoordinatesFromAPI(place: string, apiKey: string): Promise<Coordinates | null> {
  try {
    // Parse the place string to extract components
    const placeParts = place.split(',').map(part => part.trim())
    let query = placeParts[0] // Start with the first part (usually city/town)
    
    // Add additional parts for better accuracy
    if (placeParts.length > 1) {
      query = placeParts.slice(0, 2).join(',')
    }
    
    const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${apiKey}`
    
    console.log(`Fetching coordinates for "${place}" using query "${query}"`)
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data: OpenWeatherMapGeoResponse[] = await response.json()
    
    if (data && data.length > 0) {
      const result = data[0]
      return {
        lat: result.lat,
        lng: result.lon
      }
    }
    
    return null
  } catch (error) {
    console.error(`Error fetching coordinates for "${place}":`, error)
    return null
  }
}

// Add coordinates to cache
export async function addCoordinatesToCache(place: string, coordinates: Coordinates): Promise<void> {
  const cache = await loadGeocodingCache()
  const normalizedPlace = place.toLowerCase().trim()
  
  cache.coordinates[normalizedPlace] = coordinates
  await saveGeocodingCache(cache)
}

// Get all unmapped places from a list of individuals
export function getUnmappedPlaces(individuals: any[]): string[] {
  const unmappedPlaces = new Set<string>()
  
  individuals.forEach(individual => {
    if (individual.birth?.place) {
      // This will be replaced with async cache check in the component
      unmappedPlaces.add(individual.birth.place)
    }
  })
  
  return Array.from(unmappedPlaces)
}

// Batch geocode multiple places
export async function batchGeocode(places: string[], apiKey: string, onProgress?: (current: number, total: number) => void): Promise<{ success: number, failed: string[] }> {
  let success = 0
  const failed: string[] = []
  
  for (let i = 0; i < places.length; i++) {
    const place = places[i]
    
    try {
      // Check if already in cache
      const existingCoords = await getCoordinatesFromCache(place)
      if (existingCoords) {
        success++
        onProgress?.(i + 1, places.length)
        continue
      }
      
      // Fetch from API
      const coordinates = await fetchCoordinatesFromAPI(place, apiKey)
      
      if (coordinates) {
        await addCoordinatesToCache(place, coordinates)
        success++
      } else {
        failed.push(place)
      }
      
      // Rate limiting - wait 100ms between requests
      if (i < places.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
    } catch (error) {
      console.error(`Failed to geocode "${place}":`, error)
      failed.push(place)
    }
    
    onProgress?.(i + 1, places.length)
  }
  
  return { success, failed }
} 